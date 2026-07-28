import { showResult } from '../common/result.js';
import { showScreen } from '../common/screens.js';

const SET_SIZE = 5;

let targets = [];
let components = [];
let puzzles = [];
let loaded = false;

let sessionMode = 'general';
let session = [];
let currentIndex = 0;
let firstTryCorrectCount = 0;

let currentPuzzle = null;
let selections = [];
let attemptedOnce = false;

const modeSelectEl = document.getElementById('lottery-mode-select');
const playEl = document.getElementById('lottery-play');
const progressEl = document.getElementById('lottery-progress');
const targetLabelEl = document.getElementById('lottery-target-label');
const sentenceEl = document.getElementById('lottery-sentence');
const checkBtn = document.getElementById('lottery-check');
const answerEl = document.getElementById('lottery-answer');
const verdictEl = document.getElementById('lottery-answer-verdict');
const wrongActionsEl = document.getElementById('lottery-wrong-actions');
const retryBtn = document.getElementById('lottery-retry');
const revealBtn = document.getElementById('lottery-reveal');
const breakdownSectionEl = document.getElementById('lottery-breakdown-section');
const breakdownEl = document.getElementById('lottery-breakdown');
const ratioEl = document.getElementById('lottery-ratio');
const nextBtn = document.getElementById('lottery-next');

async function loadData() {
  if (loaded) return;
  const [targetsRes, componentsRes, puzzlesRes] = await Promise.all([
    fetch('./data/lottery-targets.json'),
    fetch('./data/lottery-components.json'),
    fetch('./data/lottery-puzzles.json'),
  ]);
  targets = await targetsRes.json();
  components = await componentsRes.json();
  puzzles = await puzzlesRes.json();
  loaded = true;
}

function roundToSignificant(n, sig) {
  if (n === 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(n))) - (sig - 1));
  return Math.round(n / magnitude) * magnitude;
}

function toJapaneseApprox(n) {
  const rounded = roundToSignificant(n, 2);
  if (rounded >= 1e8) {
    const v = rounded / 1e8;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}億`;
  }
  if (rounded >= 1e4) {
    const v = rounded / 1e4;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}万`;
  }
  return rounded.toLocaleString('ja-JP');
}

function formatOdds(odds) {
  const rounded = Math.round(odds);
  return `1/${rounded.toLocaleString('ja-JP')}(${toJapaneseApprox(rounded)}分の1)`;
}

function findTarget(id) {
  return targets.find((t) => t.id === id);
}

function findComponent(id) {
  return components.find((c) => c.id === id);
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession(mode) {
  const pool = mode === 'mix' ? puzzles : puzzles.filter((p) => p.mode === mode);
  const shuffled = shuffle(pool);
  const picked = [];
  while (picked.length < SET_SIZE) {
    for (const p of shuffled) {
      if (picked.length >= SET_SIZE) break;
      picked.push(p);
    }
  }
  return picked;
}

function buildBlankSelect(optionsPool, blankIndex) {
  const select = document.createElement('select');
  select.className = 'blank-select';

  const placeholder = document.createElement('option');
  placeholder.textContent = '選んでください';
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  for (const comp of shuffle(optionsPool)) {
    const opt = document.createElement('option');
    opt.value = comp.id;
    opt.textContent = comp.label;
    select.appendChild(opt);
  }

  select.addEventListener('change', () => {
    selections[blankIndex] = select.value || null;
    checkBtn.disabled = selections.some((s) => !s);
  });

  return select;
}

function renderPuzzle() {
  const puzzle = currentPuzzle;
  const target = findTarget(puzzle.targetId);
  const pool = components.filter((c) => c.mode === puzzle.mode);

  attemptedOnce = false;
  targetLabelEl.textContent = `${target.label}が当たる確率は ${formatOdds(target.odds)}`;

  selections = new Array(puzzle.componentIds.length).fill(null);
  checkBtn.disabled = true;
  checkBtn.classList.remove('hidden');
  answerEl.classList.add('hidden');
  wrongActionsEl.classList.add('hidden');
  breakdownSectionEl.classList.add('hidden');
  verdictEl.classList.remove('is-correct', 'is-wrong');

  sentenceEl.innerHTML = '';

  if (puzzle.mode === 'general') {
    sentenceEl.append('身近な出来事でたとえると…');
    sentenceEl.appendChild(buildBlankSelect(pool, 0));
    sentenceEl.append('の方が、確率が高いです。');
  } else {
    sentenceEl.append('身近な激レアでたとえると…『');
    sentenceEl.appendChild(buildBlankSelect(pool, 0));
    sentenceEl.append('』の確率 × 『');
    sentenceEl.appendChild(buildBlankSelect(pool, 1));
    sentenceEl.append('』の確率、とだいたい同じくらいレアです。');
  }
}

function renderBreakdown(componentIds) {
  breakdownEl.innerHTML = '';
  for (const id of componentIds) {
    const comp = findComponent(id);
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `
      <p class="breakdown-label">${comp.label}</p>
      <p class="breakdown-odds">${formatOdds(comp.odds)}</p>
      <p class="breakdown-note">${comp.note}</p>
    `;
    breakdownEl.appendChild(item);
  }
}

function showBreakdownAndRatio() {
  const puzzle = currentPuzzle;
  const target = findTarget(puzzle.targetId);
  const correctIds = puzzle.componentIds;

  renderBreakdown(correctIds);

  const correctComponents = correctIds.map(findComponent);
  const product = correctComponents.reduce((acc, c) => acc * c.odds, 1);
  const ratio = target.odds / product;

  ratioEl.classList.remove('hidden');
  if (ratio >= 1) {
    ratioEl.textContent = `宝くじの方が、まだ約${Math.round(ratio).toLocaleString('ja-JP')}倍当たりにくいです(掛け算だと${formatOdds(product)}相当)。`;
  } else {
    ratioEl.textContent = `こちらの方が、宝くじよりまだ約${Math.round(1 / ratio).toLocaleString('ja-JP')}倍当たりやすいです。`;
  }

  wrongActionsEl.classList.add('hidden');
  breakdownSectionEl.classList.remove('hidden');
}

function checkAnswer() {
  const puzzle = currentPuzzle;
  const correctIds = puzzle.componentIds;

  const isCorrect =
    selections.length === correctIds.length &&
    new Set(selections).size === selections.length &&
    selections.every((id) => correctIds.includes(id));

  checkBtn.classList.add('hidden');
  answerEl.classList.remove('hidden');
  verdictEl.classList.toggle('is-correct', isCorrect);
  verdictEl.classList.toggle('is-wrong', !isCorrect);

  if (isCorrect) {
    verdictEl.textContent = '正解！🎯';
    if (!attemptedOnce) firstTryCorrectCount += 1;
    showBreakdownAndRatio();
    return;
  }

  attemptedOnce = true;
  verdictEl.textContent = '不正解…';
  breakdownSectionEl.classList.add('hidden');
  wrongActionsEl.classList.remove('hidden');
}

function retryPuzzle() {
  renderPuzzle();
}

function revealAnswer() {
  showBreakdownAndRatio();
}

function nextPuzzle() {
  currentIndex += 1;
  if (currentIndex >= session.length) {
    finishSet();
    return;
  }
  currentPuzzle = session[currentIndex];
  progressEl.textContent = `${currentIndex + 1} / ${session.length}`;
  renderPuzzle();
}

function finishSet() {
  const total = session.length;
  const rate = Math.round((firstTryCorrectCount / total) * 100);
  showResult({
    emoji: rate >= 80 ? '🎯' : rate >= 40 ? '🤔' : '💸',
    title: `${firstTryCorrectCount} / ${total} 問を自力で正解`,
    message: `正答率 ${rate}%(回答を見た問題は除く)`,
    teaseLine: rate === 100 ? '確率の感覚、だいぶ研ぎ澄まされてます。' : '宝くじの確率、体感できてきましたか？',
    variant: rate >= 80 ? 'good' : rate < 40 ? 'bad' : 'neutral',
    onRetry: () => {
      showScreen('screen-lottery');
      mountLottery();
    },
  });
}

function startSet(mode) {
  sessionMode = mode;
  session = buildSession(mode);
  currentIndex = 0;
  firstTryCorrectCount = 0;
  currentPuzzle = session[0];
  progressEl.textContent = `${currentIndex + 1} / ${session.length}`;
  progressEl.classList.remove('hidden');

  modeSelectEl.classList.add('hidden');
  playEl.classList.remove('hidden');
  renderPuzzle();
}

modeSelectEl.querySelectorAll('.mode-card').forEach((btn) => {
  btn.addEventListener('click', () => startSet(btn.dataset.mode));
});

checkBtn.addEventListener('click', checkAnswer);
retryBtn.addEventListener('click', retryPuzzle);
revealBtn.addEventListener('click', revealAnswer);
nextBtn.addEventListener('click', nextPuzzle);

export async function mountLottery() {
  await loadData();
  playEl.classList.add('hidden');
  progressEl.classList.add('hidden');
  modeSelectEl.classList.remove('hidden');
}
