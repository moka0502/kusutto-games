import { showScreen } from './screens.js';

const emojiEl = document.getElementById('result-emoji');
const titleEl = document.getElementById('result-title');
const messageEl = document.getElementById('result-message');
const teaseEl = document.getElementById('result-tease');
const retryBtn = document.getElementById('result-retry');
const cardEl = document.querySelector('.result-card');

let currentRetryHandler = null;

/**
 * 3ゲーム共通の結果画面を表示する。
 * @param {{emoji?: string, title: string, message: string, teaseLine?: string,
 *          variant?: 'good'|'bad'|'neutral', onRetry?: () => void}} opts
 */
export function showResult({ emoji = '🤔', title, message, teaseLine = '', variant = 'neutral', onRetry }) {
  emojiEl.textContent = emoji;
  titleEl.textContent = title;
  messageEl.textContent = message;
  teaseEl.textContent = teaseLine;

  if (currentRetryHandler) {
    retryBtn.removeEventListener('click', currentRetryHandler);
  }
  currentRetryHandler = () => onRetry?.();
  retryBtn.addEventListener('click', currentRetryHandler);

  showScreen('screen-result');
  playResultEntrance(variant);
}

function playResultEntrance(variant) {
  const gsap = window.gsap;
  if (!gsap) {
    // GSAP未読み込み時はCSSアニメーションにフォールバック
    cardEl.classList.remove('pop-in');
    void cardEl.offsetWidth;
    cardEl.classList.add('pop-in');
    return;
  }

  gsap.killTweensOf([cardEl, emojiEl, teaseEl]);
  gsap.set(cardEl, { opacity: 0, scale: 0.85, y: 8, x: 0 });
  gsap.set(emojiEl, { scale: 0.5 });
  gsap.set(teaseEl, { opacity: 0, y: 6 });

  const tl = gsap.timeline();
  tl.to(cardEl, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'back.out(1.7)' })
    .to(emojiEl, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.3');

  if (variant === 'bad') {
    // 不正解時だけの軽いシェイク(茶化されている感を演出)
    tl.to(cardEl, { x: -8, duration: 0.06, ease: 'power1.inOut' })
      .to(cardEl, { x: 8, duration: 0.06, ease: 'power1.inOut' })
      .to(cardEl, { x: -5, duration: 0.06, ease: 'power1.inOut' })
      .to(cardEl, { x: 0, duration: 0.06, ease: 'power1.inOut' });
  }

  // 「茶化される」演出: 一拍おいてteaseLineがふわっと現れる
  tl.to(teaseEl, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '+=0.15')
    .fromTo(teaseEl, { rotate: -1.5 }, { rotate: 0, duration: 0.25, ease: 'elastic.out(1, 0.5)' }, '<');
}
