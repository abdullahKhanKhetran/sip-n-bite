import './styles.css';
import { gsap } from 'gsap';
import { createCup, bindCup } from './cup.js';
import { runLoader } from './loader.js';
import { initCursor } from './cursor.js';
import { sound } from './sound.js';
import { heroIntro, jelly, sprinkles } from './fx.js';
import { renderBoardItems, menuHash } from './render.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------- hero cup ---------- */

const cupBtn = $('.cup-btn');
const cup = createCup($('#cup-canvas'), { reduced, onShake: () => sound.shake() });
bindCup(cup, { button: cupBtn, tiltButton: $('.tilt-toggle'), reduced });
cupBtn.addEventListener('click', () => $('.cup-hint').classList.add('is-done'), { once: true });

const soundBtn = $('.sound-toggle');
soundBtn.addEventListener('click', () => {
  sound.set(!sound.on);
  soundBtn.setAttribute('aria-pressed', String(sound.on));
  $('.sound-toggle__label', soundBtn).textContent = sound.on ? 'Sound on' : 'Sound off';
  if (sound.on) cup.shake();
});

/* ---------- loader, cursor, motion ---------- */

runLoader().then((played) => {
  if (played && !reduced) heroIntro();
});
if (!reduced) {
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) initCursor();
  jelly();
  sprinkles();
}

/* ---------- call-for-delivery sheet ---------- */

const sheet = $('#call-sheet');
const panel = $('.sheet__panel', sheet);
function openSheet() {
  sheet.showModal();
  if (!reduced) gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'elastic.out(1, 0.75)' });
}
function closeSheet() {
  if (!sheet.open) return;
  if (reduced) return sheet.close();
  gsap.to(panel, { yPercent: 110, duration: 0.25, ease: 'power2.in', onComplete: () => sheet.close() });
}
$$('[data-open-sheet]').forEach((b) => b.addEventListener('click', openSheet));
sheet.addEventListener('click', (e) => {
  if (e.target === sheet || e.target.closest('[data-close-sheet]')) closeSheet();
});
sheet.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeSheet();
});

/* ---------- menu tabs + live menu.json ---------- */

const board = $('#menu-board');
const tabs = $$('.tabs [role="tab"]');
const boardUr = $('.board-ur');
const urduFor = JSON.parse(boardUr.dataset.urdu);
const defaultUr = boardUr.textContent;
let currentCat = 'all';

function showCategory(cat, animate) {
  currentCat = cat;
  for (const t of tabs) {
    const selected = t.dataset.cat === cat;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
  }
  board.setAttribute('aria-labelledby', `tab-${cat}`);
  const shown = [];
  for (const s of $$('.sticker', board)) {
    s.hidden = cat !== 'all' && s.dataset.cat !== cat;
    if (!s.hidden) shown.push(s);
  }
  boardUr.textContent = urduFor[cat] || defaultUr;
  if (!animate || reduced) return;
  gsap.fromTo(shown, { scale: 0.5, y: 30, rotation: () => gsap.utils.random(-20, 20) }, {
    scale: 1, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', stagger: 0.04, clearProps: 'transform',
  });
  gsap.fromTo(boardUr, { scale: 0.3, rotation: -40 }, { scale: 1, rotation: -8, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => showCategory(tab.dataset.cat, true));
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });
});

// The board is prerendered from menu.json at build time. Re-load it at runtime too, so an
// edited menu.json on the server shows up even before the next build.
fetch(`${import.meta.env.BASE_URL}menu.json`, { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => {
    if (!data || menuHash(data) === board.dataset.v) return;
    board.innerHTML = renderBoardItems(data);
    board.dataset.v = menuHash(data);
    showCategory(currentCat, false);
  })
  .catch(() => {});

/* ---------- branch maps: illustrated until asked, then the real Google map ---------- */

for (const map of $$('.branch__map')) {
  $('.branch__mapbtn', map).addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = map.dataset.map;
    frame.title = map.dataset.title;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;
    map.append(frame);
    map.classList.add('is-live');
    frame.focus();
  });
}

$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
