import { showResult } from '../common/result.js';
import { showScreen } from '../common/screens.js';

const MEMORIZE_SECONDS = 5;

const ATTR_ORDER = ['hairLength', 'topColor', 'shoeColor', 'bagColor'];
const ATTR_LABEL = {
  hairLength: '前髪切った',
  topColor: '服の色が変わった',
  shoeColor: '靴の色が変わった',
  bagColor: 'かばんの色が変わった',
};

let scenarios = [];
let loaded = false;
let current = null;
let countdownTimer = null;

const instructionEl = document.getElementById('bangs-instruction');
const timerEl = document.getElementById('bangs-timer');
const beforeAvatarEl = document.getElementById('bangs-avatar-before');
const afterAvatarEl = document.getElementById('bangs-avatar-after');
const judgeGroupEl = document.getElementById('bangs-judge-group');
const choicesEl = document.getElementById('bangs-choices');

async function loadData() {
  if (loaded) return;
  const res = await fetch('./data/bangs-scenarios.json');
  scenarios = await res.json();
  loaded = true;
}

function applyAvatar(el, attrs) {
  el.style.setProperty('--bangs-length', attrs.hairLength);
  el.style.setProperty('--top-color', attrs.topColor);
  el.style.setProperty('--shoe-color', attrs.shoeColor);
  el.style.setProperty('--bag-color', attrs.bagColor);
}

function buildAfter(scenario) {
  const after = { ...scenario.before };
  after[scenario.changedAttr] = scenario.changedTo;
  return after;
}

function startMemorizePhase() {
  judgeGroupEl.classList.add('hidden');
  instructionEl.classList.remove('hidden');
  timerEl.classList.remove('hidden');
  beforeAvatarEl.classList.remove('hidden');

  applyAvatar(beforeAvatarEl, current.before);
  window.gsap?.fromTo(beforeAvatarEl, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });

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
  beforeAvatarEl.classList.add('hidden');
  judgeGroupEl.classList.remove('hidden');

  applyAvatar(afterAvatarEl, buildAfter(current));

  choicesEl.innerHTML = '';
  ATTR_ORDER.forEach((attr) => {
    const btn = document.createElement('button');
    btn.className = 'bangs-choice';
    btn.type = 'button';
    btn.textContent = ATTR_LABEL[attr];
    btn.addEventListener('click', () => handleJudge(attr));
    choicesEl.appendChild(btn);
  });

  window.gsap?.fromTo(
    judgeGroupEl,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
  );
}

function handleJudge(guessAttr) {
  const isCorrect = guessAttr === current.changedAttr;
  showResult({
    emoji: isCorrect ? '👀' : '😳',
    title: isCorrect ? '正解！' : '不正解…',
    message: `実は${ATTR_LABEL[current.changedAttr]}んです。`,
    teaseLine: current.teaseLine,
    variant: isCorrect ? 'good' : 'bad',
    onRetry: () => {
      showScreen('screen-bangs');
      mountBangs();
    },
  });
}

export async function mountBangs() {
  await loadData();
  current = scenarios[Math.floor(Math.random() * scenarios.length)];
  clearInterval(countdownTimer);
  startMemorizePhase();
}
