import { showResult } from '../common/result.js';
import { showScreen } from '../common/screens.js';

const QUESTIONS_PER_ROUND = 10;

let allQuestions = [];
let loaded = false;
let session = [];
let currentIndex = 0;
let correctCount = 0;
let answering = false;

const situationEl = document.getElementById('proverb-situation');
const choicesEl = document.getElementById('proverb-choices');
const progressEl = document.getElementById('proverb-progress');

async function loadData() {
  if (loaded) return;
  const res = await fetch('./data/proverb-quiz.json');
  allQuestions = await res.json();
  loaded = true;
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession() {
  const picked = shuffle(allQuestions).slice(0, Math.min(QUESTIONS_PER_ROUND, allQuestions.length));
  session = picked.map((q) => ({
    situation: q.situation,
    choices: shuffle(q.choices.map((text, i) => ({ text, isCorrect: i === q.answerIndex }))),
  }));
}

function renderQuestion() {
  answering = true;
  const q = session[currentIndex];
  situationEl.textContent = q.situation;
  progressEl.textContent = `${currentIndex + 1} / ${session.length}`;

  choicesEl.innerHTML = '';
  q.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'proverb-choice';
    btn.type = 'button';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => handleAnswer(btn, choice.isCorrect));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(button, isCorrect) {
  if (!answering) return;
  answering = false;

  const buttons = [...choicesEl.querySelectorAll('.proverb-choice')];
  buttons.forEach((b) => (b.disabled = true));
  button.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

  if (isCorrect) {
    correctCount += 1;
  } else {
    const correctBtn = buttons.find((_, i) => session[currentIndex].choices[i].isCorrect);
    correctBtn?.classList.add('is-correct-reveal');
  }

  setTimeout(nextQuestion, 900);
}

function nextQuestion() {
  currentIndex += 1;
  if (currentIndex >= session.length) {
    finishRound();
    return;
  }
  renderQuestion();
}

function finishRound() {
  const total = session.length;
  const rate = Math.round((correctCount / total) * 100);
  showResult({
    emoji: rate >= 80 ? '📜' : rate >= 50 ? '🤔' : '💡',
    title: `${correctCount} / ${total} 問正解`,
    message: `正答率 ${rate}%`,
    teaseLine: rate === 100 ? 'ことわざ、体に染み込んでますね。' : 'ことわざは知識より、気づきの練習です。',
    variant: rate >= 80 ? 'good' : rate < 40 ? 'bad' : 'neutral',
    onRetry: () => {
      showScreen('screen-proverb');
      mountProverb();
    },
  });
}

export async function mountProverb() {
  situationEl.textContent = '読み込み中…';
  choicesEl.innerHTML = '';
  await loadData();
  currentIndex = 0;
  correctCount = 0;
  buildSession();
  renderQuestion();
}
