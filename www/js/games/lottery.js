let comparisons = [];
let lastIndex = -1;
let loaded = false;

const textEl = document.getElementById('lottery-text');
const nextBtn = document.getElementById('lottery-next');

async function loadData() {
  if (loaded) return;
  const res = await fetch('./data/lottery-comparisons.json');
  comparisons = await res.json();
  loaded = true;
}

function pickNext() {
  if (comparisons.length === 0) return;
  let index = lastIndex;
  while (index === lastIndex && comparisons.length > 1) {
    index = Math.floor(Math.random() * comparisons.length);
  }
  lastIndex = index;
  textEl.classList.remove('fade-in');
  void textEl.offsetWidth;
  textEl.textContent = comparisons[index].text;
  textEl.classList.add('fade-in');
}

nextBtn.addEventListener('click', pickNext);

export async function mountLottery() {
  textEl.textContent = '読み込み中…';
  await loadData();
  pickNext();
}
