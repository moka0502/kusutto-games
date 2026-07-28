import { showResult } from '../common/result.js';
import { showScreen } from '../common/screens.js';

const MEMORIZE_SECONDS = 5;

let scenarios = [];
let loaded = false;
let current = null;
let countdownTimer = null;

const instructionEl = document.getElementById('bangs-instruction');
const timerEl = document.getElementById('bangs-timer');
const beforeVisualEl = document.getElementById('bangs-visual-before');
const afterVisualEl = document.getElementById('bangs-visual-after');
const judgeGroupEl = document.getElementById('bangs-judge-group');
const judgeChangedBtn = document.getElementById('bangs-judge-changed');
const judgeSameBtn = document.getElementById('bangs-judge-same');

async function loadData() {
  if (loaded) return;
  const res = await fetch('./data/bangs-scenarios.json');
  scenarios = await res.json();
  loaded = true;
}

function setVisualLength(el, length) {
  el.style.setProperty('--bangs-length', length);
}

function startMemorizePhase() {
  judgeGroupEl.classList.add('hidden');
  instructionEl.classList.remove('hidden');
  timerEl.classList.remove('hidden');
  beforeVisualEl.classList.remove('hidden');

  setVisualLength(beforeVisualEl, current.beforeLength);
  window.gsap?.fromTo(beforeVisualEl, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });

  let remaining = MEMORIZE_SECONDS;
  timerEl.textContent = String(remaining);
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      startJudgePhase();
      return;
    }
    timerEl.textContent = String(remaining);
    // 1秒ごとにタイマー数字をパッと拍動させ、記憶フェーズの緊張感を出す
    window.gsap?.fromTo(timerEl, { scale: 1.35 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
  }, 1000);
}

function startJudgePhase() {
  instructionEl.classList.add('hidden');
  timerEl.classList.add('hidden');
  beforeVisualEl.classList.add('hidden');
  judgeGroupEl.classList.remove('hidden');
  setVisualLength(afterVisualEl, current.afterLength);

  window.gsap?.fromTo(
    judgeGroupEl,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
  );
}

function handleJudge(guessChanged) {
  const isCorrect = guessChanged === current.changed;
  showResult({
    emoji: isCorrect ? '👀' : '😳',
    title: isCorrect ? '正解！' : '不正解…',
    message: current.changed ? '実は伸びてました。' : '実は変わっていませんでした。',
    teaseLine: current.teaseLine,
    variant: isCorrect ? 'good' : 'bad',
    onRetry: () => {
      showScreen('screen-bangs');
      mountBangs();
    },
  });
}

judgeChangedBtn.addEventListener('click', () => handleJudge(true));
judgeSameBtn.addEventListener('click', () => handleJudge(false));

export async function mountBangs() {
  await loadData();
  current = scenarios[Math.floor(Math.random() * scenarios.length)];
  clearInterval(countdownTimer);
  startMemorizePhase();
}
