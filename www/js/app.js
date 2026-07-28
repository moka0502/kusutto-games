import { showScreen, initBackToHomeButtons } from './common/screens.js';
import { mountLottery } from './games/lottery.js';
import { mountProverb } from './games/proverb.js';
import { mountBangs } from './games/bangs.js';

initBackToHomeButtons();

const mountByGame = {
  lottery: mountLottery,
  proverb: mountProverb,
  bangs: mountBangs,
};

document.querySelectorAll('.game-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const game = btn.dataset.game;
    showScreen(`screen-${game}`);
    mountByGame[game]?.();
  });
});
