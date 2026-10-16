// Desktop-only cursor: a pink drop with a laggy, stretchy trailing blob.
// Grows over anything clickable; becomes a mini slush cup over the menu.
const CLICKABLE = 'a, button, [role="tab"], .sticker__body';

export function initCursor() {
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="cursor__blob"><div class="cursor__shape"></div>
    <svg class="cursor__cup" viewBox="0 0 40 52"><path d="M24 14 28 1" stroke="#3B1F14" stroke-width="5" stroke-linecap="round"/><path d="M24 14 28 1" stroke="#FF3D7F" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M7 19h26l-4 30H11Z" fill="#1FB6FF" stroke="#3B1F14" stroke-width="3" stroke-linejoin="round"/><path d="M9 34h22l-2 15H11Z" fill="#FF3D7F" stroke="#3B1F14" stroke-width="3" stroke-linejoin="round"/>
    <path d="M8 18c0-12 24-12 24 0Z" fill="#FFFDF7" stroke="#3B1F14" stroke-width="3" stroke-linejoin="round"/><rect x="4" y="16" width="32" height="5" rx="2.5" fill="#FFFDF7" stroke="#3B1F14" stroke-width="3"/></svg>
  </div><div class="cursor__dot"></div>`;
  document.body.append(el);
  document.documentElement.classList.add('has-cursor');

  const blob = el.querySelector('.cursor__blob');
  const shape = el.querySelector('.cursor__shape');
  const dot = el.querySelector('.cursor__dot');
  let x = -100, y = -100, bx = x, by = y, raf = 0;

  function loop() {
    const dx = x - bx, dy = y - by;
    bx += dx * 0.16;
    by += dy * 0.16;
    const stretch = Math.min(Math.hypot(dx, dy) / 140, 0.45);
    blob.style.transform = `translate(${bx}px,${by}px)`;
    shape.style.transform = `rotate(${Math.atan2(dy, dx)}rad) scale(${1 + stretch},${1 - stretch * 0.6})`;
    raf = Math.abs(dx) + Math.abs(dy) > 0.2 ? requestAnimationFrame(loop) : 0;
  }

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = `translate(${x}px,${y}px)`;
    if (!el.classList.contains('is-on')) {
      bx = x;
      by = y;
      el.classList.add('is-on');
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    el.classList.toggle('is-link', !!t?.closest(CLICKABLE));
    el.classList.toggle('is-cup', !!t?.closest('#menu'));
  });
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.documentElement.addEventListener('mouseleave', () => el.classList.remove('is-on'));
  // the native cursor shows inside map iframes; hide ours while there
  addEventListener('blur', () => el.classList.remove('is-on'));
}
