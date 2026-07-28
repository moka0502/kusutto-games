let targets = [];
let components = [];
let puzzles = [];
let loaded = false;

let currentMode = 'general';
let currentPuzzle = null;
let selections = [];
let lastPuzzleIdByMode = {};

const modeSwitchEl = document.getElementById('lottery-mode-switch');
const targetLabelEl = document.getElementById('lottery-target-label');
const sentenceEl = document.getElementById('lottery-sentence');
const checkBtn = document.getElementById('lottery-check');
const answerEl = document.getElementById('lottery-answer');
const verdictEl = document.getElementById('lottery-answer-verdict');
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

function formatOdds(odds) {
  const rounded = Math.round(odds);
  return `1/${rounded.toLocaleString('ja-JP')}`;
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

function pickPuzzle(mode) {
  const pool = puzzles.filter((p) => p.mode === mode);
  let puzzle = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) {
    while (puzzle.id === lastPuzzleIdByMode[mode]) {
      puzzle = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  lastPuzzleIdByMode[mode] = puzzle.id;
  return puzzle;
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

  targetLabelEl.textContent = `${target.label}が当たる確率は ${formatOdds(target.odds)}`;

  selections = new Array(puzzle.componentIds.length).fill(null);
  checkBtn.disabled = true;
  answerEl.classList.add('hidden');
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

function checkAnswer() {
  const puzzle = currentPuzzle;
  const target = findTarget(puzzle.targetId);
  const correctIds = puzzle.componentIds;

  const isCorrect =
    selections.length === correctIds.length &&
    new Set(selections).size === selections.length &&
    selections.every((id) => correctIds.includes(id));

  verdictEl.textContent = isCorrect ? '正解！🎯' : '不正解…';
  verdictEl.classList.toggle('is-correct', isCorrect);
  verdictEl.classList.toggle('is-wrong', !isCorrect);

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

  answerEl.classList.remove('hidden');
}

function nextPuzzle() {
  currentPuzzle = pickPuzzle(currentMode);
  renderPuzzle();
}

modeSwitchEl.querySelectorAll('.mode-chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.mode === currentMode) return;
    modeSwitchEl.querySelectorAll('.mode-chip').forEach((b) => b.classList.toggle('active', b === btn));
    currentMode = btn.dataset.mode;
    nextPuzzle();
  });
});

checkBtn.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', nextPuzzle);

export async function mountLottery() {
  targetLabelEl.textContent = '読み込み中…';
  sentenceEl.textContent = '';
  await loadData();
  currentMode = 'general';
  modeSwitchEl.querySelectorAll('.mode-chip').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'general'));
  nextPuzzle();
}
