const screens = document.querySelectorAll('.screen');

export function showScreen(id) {
  for (const el of screens) {
    el.classList.toggle('hidden', el.id !== id);
  }
  const target = document.getElementById(id);
  if (!target) return;
  // 表示直後にscreen-enter状態からフェード+スライドインさせる(versant-practiceの画面遷移演出を踏襲)
  target.classList.add('screen-enter');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => target.classList.remove('screen-enter'));
  });
}

export function initBackToHomeButtons() {
  document.querySelectorAll('.back-to-home').forEach((btn) => {
    btn.addEventListener('click', () => showScreen('screen-home'));
  });
}
