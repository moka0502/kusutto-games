const SVG_NS = 'http://www.w3.org/2000/svg';

export const ICONS = {
  ticket: '<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="12" y1="6" x2="12" y2="18" stroke-dasharray="2 2"/>',
  lottoBalls: '<circle cx="7" cy="14" r="4"/><circle cx="14" cy="8" r="4"/><circle cx="18" cy="16" r="3"/>',
  meteor: '<circle cx="15" cy="15" r="4"/><path d="M3 3l7 7M6 4l4 4M4 7l3.5 3.5"/>',
  sharkFin: '<path d="M4 18 Q10 3 14 18 Q9 13 4 18 Z"/>',
  golfFlag: '<line x1="6" y1="3" x2="6" y2="21"/><path d="M6 4 L16 7 L6 10 Z" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="2"/>',
  pachinko: '<rect x="4" y="4" width="14" height="16" rx="2"/><circle cx="11" cy="10" r="2" fill="currentColor" stroke="none"/><line x1="20" y1="6" x2="20" y2="14"/>',
  coin: '<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3" ry="8"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>',
  card: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8c-2 2-3.5 3.3-3.5 5a3.5 3.5 0 0 0 7 0c0-1.7-1.5-3-3.5-5z" fill="currentColor" stroke="none"/>',
  droplet: '<path d="M12 3C9 8 5 12 5 15.5A7 7 0 0 0 19 15.5C19 12 15 8 12 3Z"/>',
  cake: '<rect x="4" y="13" width="16" height="7" rx="1"/><line x1="4" y1="16" x2="20" y2="16"/><line x1="8" y1="13" x2="8" y2="9"/><line x1="12" y1="13" x2="12" y2="8"/><line x1="16" y1="13" x2="16" y2="9"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1" fill="currentColor" stroke="none"/>',
  basket: '<path d="M4 12h16l-2 8H6z"/><path d="M4 12a8 5 0 0 1 16 0"/><ellipse cx="9.5" cy="12" rx="1.8" ry="2.4" fill="currentColor" stroke="none"/><ellipse cx="14.5" cy="12" rx="1.8" ry="2.4" fill="currentColor" stroke="none"/>',
  wheel: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>',
  clock: '<circle cx="12" cy="12" r="8"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="12" y1="12" x2="16" y2="14"/>',
  wrench: '<path d="M14 7a4 4 0 0 0-5.6 4.9L3 17.3 5.7 20l5.4-5.4A4 4 0 0 0 16 9l-3 3-2-2 3-3z"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><rect x="2" y="6" width="20" height="4" rx="1"/><line x1="12" y1="6" x2="12" y2="20"/><path d="M12 6c-2-4-7-3-6 0M12 6c2-4 7-3 6 0"/>',
  book: '<path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0z"/><path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0z"/>',
  eye: '<path d="M2 12c2.5-5 7-8 10-8s7.5 3 10 8c-2.5 5-7 8-10 8s-7.5-3-10-8z"/><circle cx="12" cy="12" r="3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="3" x2="7" y2="7"/><line x1="17" y1="3" x2="17" y2="7"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/>',
};

const DEFAULT_ATTRS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.6',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

export function createIcon(iconId, className = '') {
  const inner = ICONS[iconId];
  if (!inner) {
    console.warn(`icons.js: unknown iconId "${iconId}"`);
    return null;
  }
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [key, value] of Object.entries(DEFAULT_ATTRS)) {
    svg.setAttribute(key, value);
  }
  svg.setAttribute('class', `icon${className ? ` ${className}` : ''}`);
  svg.innerHTML = inner;
  return svg;
}
