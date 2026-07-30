import { showResult } from '../common/result.js';
import { showScreen } from '../common/screens.js';
import { createIcon } from '../common/icons.js';

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
let blankChips = [];
let activeBlankIndex = null;

const modeSelectEl = document.getElementById('lottery-mode-select');
const playEl = document.getElementById('lottery-play');
const progressEl = document.getElementById('lottery-progress');
const targetLabelEl = document.getElementById('lottery-target-label');
const sentenceEl = document.getElementById('lottery-sentence');
const choiceBankEl = document.getElementById('lottery-choice-bank');
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

function buildBlankChip(blankIndex) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'blank-chip';
  chip.textContent = '選んでください';
  chip.addEventListener('click', () => setActiveBlank(blankIndex));
  return chip;
}

function findNextEmptyBlank() {
  const index = selections.findIndex((s) => !s);
  return index === -1 ? null : index;
}

function setActiveBlank(index) {
  activeBlankIndex = index;
  blankChips.forEach((chip, i) => chip.classList.toggle('is-active', i === index));
}

function updateBlankChip(blankIndex) {
  const chip = blankChips[blankIndex];
  const comp = findComponent(selections[blankIndex]);
  chip.innerHTML = '';
  const icon = createIcon(comp.icon, 'blank-chip-icon');
  if (icon) chip.appendChild(icon);
  chip.append(comp.label);
  chip.classList.add('is-filled');
}

function syncChoiceBankUsedState() {
  choiceBankEl.querySelectorAll('.choice-card').forEach((card) => {
    const used = selections.includes(card.dataset.id);
    card.classList.toggle('is-used', used);
    card.disabled = used;
  });
}

function handleChoiceCardClick(componentId) {
  if (activeBlankIndex === null) return;
  selections[activeBlankIndex] = componentId;
  updateBlankChip(activeBlankIndex);
  syncChoiceBankUsedState();
  checkBtn.disabled = selections.some((s) => !s);
  setActiveBlank(findNextEmptyBlank());
}

function renderChoiceBank(pool) {
  choiceBankEl.innerHTML = '';
  for (const comp of shuffle(pool)) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'choice-card';
    card.dataset.id = comp.id;
    const icon = createIcon(comp.icon, 'choice-card-icon');
    if (icon) card.appendChild(icon);
    const label = document.createElement('span');
    label.textContent = comp.label;
    card.appendChild(label);
    card.addEventListener('click', () => handleChoiceCardClick(comp.id));
    choiceBankEl.appendChild(card);
  }
}

function renderPuzzle() {
  const puzzle = currentPuzzle;
  const target = findTarget(puzzle.targetId);
  const pool = components.filter((c) => c.mode === puzzle.mode);

  attemptedOnce = false;
  targetLabelEl.innerHTML = '';
  const targetIcon = createIcon(target.icon, 'target-label-icon');
  if (targetIcon) targetLabelEl.appendChild(targetIcon);
  targetLabelEl.append(`${target.label}が当たる確率は ${formatOdds(target.odds)}`);

  selections = new Array(puzzle.componentIds.length).fill(null);
  blankChips = [];
  checkBtn.disabled = true;
  checkBtn.classList.remove('hidden');
  answerEl.classList.add('hidden');
  wrongActionsEl.classList.add('hidden');
  breakdownSectionEl.classList.add('hidden');
  verdictEl.classList.remove('is-correct', 'is-wrong');

  sentenceEl.innerHTML = '';

  const lead = puzzle.mode === 'general' ? '身近な出来事でたとえると…' : '身近な激レアでたとえると…';
  sentenceEl.append(lead);
  sentenceEl.appendChild(document.createElement('br'));
  puzzle.componentIds.forEach((_, i) => {
    if (i > 0) {
      const operator = document.createElement('span');
      operator.className = 'sentence-operator';
      operator.textContent = '×';
      sentenceEl.appendChild(operator);
      sentenceEl.appendChild(document.createElement('br'));
    }
    sentenceEl.append('『');
    const chip = buildBlankChip(i);
    blankChips.push(chip);
    sentenceEl.appendChild(chip);
    sentenceEl.append('』の確率');
    sentenceEl.appendChild(document.createElement('br'));
  });
  sentenceEl.append('、とだいたい同じくらいレアです。');

  renderChoiceBank(pool);
  setActiveBlank(0);
}

function renderBreakdown(pool, correctIds) {
  breakdownEl.innerHTML = '';
  const sorted = pool.slice().sort((a, b) => a.odds - b.odds);
  for (const comp of sorted) {
    const isCorrect = correctIds.includes(comp.id);
    const item = document.createElement('div');
    item.className = `breakdown-item${isCorrect ? ' is-correct' : ''}`;
    const icon = createIcon(comp.icon, 'breakdown-icon');
    const body = document.createElement('div');
    body.className = 'breakdown-body';
    body.innerHTML = `
      <p class="breakdown-label">${isCorrect ? '✓ ' : ''}${comp.label}</p>
      <p class="breakdown-odds">${formatOdds(comp.odds)}</p>
      <p class="breakdown-note">${comp.note}</p>
    `;
    if (icon) item.appendChild(icon);
    item.appendChild(body);
    breakdownEl.appendChild(item);
  }
}

const RATIO_TOLERANCE = 0.2;

function showBreakdownAndRatio() {
  const puzzle = currentPuzzle;
  const target = findTarget(puzzle.targetId);
  const correctIds = puzzle.componentIds;
  const pool = components.filter((c) => c.mode === puzzle.mode);

  renderBreakdown(pool, correctIds);

  const correctComponents = correctIds.map(findComponent);
  const product = correctComponents.reduce((acc, c) => acc * c.odds, 1);
  const ratio = target.odds / product;

  ratioEl.classList.remove('hidden');
  if (Math.abs(ratio - 1) <= RATIO_TOLERANCE) {
    const diffPct = Math.round(Math.abs(ratio - 1) * 100);
    ratioEl.textContent = `掛け算だと${formatOdds(product)}相当。宝くじ(${formatOdds(target.odds)})とだいたい同じくらいのレアさです(誤差約${diffPct}%)。`;
  } else if (ratio > 1) {
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
