const screens = document.querySelectorAll('.screen');

export function showScreen(id) {
  for (const el of screens) {
    el.classList.toggle('hidden', el.id !== id);
  }
}

export function initBackToHomeButtons() {
  document.querySelectorAll('.back-to-home').forEach((btn) => {
    btn.addEventListener('click', () => showScreen('screen-home'));
  });
}
