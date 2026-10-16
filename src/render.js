// Pure HTML-string renderers. Used by the Vite plugin (prerendering public/menu.json
// into index.html at build time) and by the browser (re-rendering the menu from menu.json).
// No DOM access in here.

const C = {
  pink: '#FF3D7F', blue: '#1FB6FF', mango: '#FFC81E', choc: '#3B1F14', cream: '#FFF4E2',
  white: '#FFFDF7', tan: '#E9B872', toast: '#C68B59', brown: '#8B4A2B', red: '#E8253B',
  mint: '#2BD9A0', lime: '#6BD089', aqua: '#BDEBFF', milk: '#FFC2D6',
};

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const isUrdu = (s) => /[؀-ۿ]/.test(s);
const digits = (p) => p.replace(/\D/g, '');
export const telHref = (phone) => `tel:+${digits(phone)}`;
export const waHref = (phone, msg) => `https://wa.me/${digits(phone)}?text=${encodeURIComponent(msg)}`;
const waMsg = (data, b) => data.site.whatsappMessage.replace('{branch}', `${b.label}, ${b.name}`);
export const mapsLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const mapsEmbed = (q) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const menuHash = (data) => hashStr(JSON.stringify([data.categories, data.items])).toString(36);

/* ---------- decorative shapes ---------- */

const f1 = (n) => Math.round(n * 10) / 10;

// A drippy bottom edge: solid band on top, teardrop drips hanging down.
export function dripSvg(seed) {
  const W = 1440, B = 24, r = rng(seed);
  const drips = [];
  for (let x = 30 + r() * 50; x < W - 40; ) {
    const hw = 7 + r() * 12;
    const len = r() < 0.4 ? 50 + r() * 60 : 18 + r() * 26;
    drips.push({ cx: x, hw, len });
    x += hw * 2 + 36 + r() * 120;
  }
  let d = `M0 0H${W}V${B}`;
  let cur = W;
  for (const { cx, hw, len } of drips.reverse()) {
    const R = cx + hw, L = cx - hw, bot = B + len, neck = hw * 0.3;
    d += `Q${f1((cur + R + 10) / 2)} ${f1(B + r() * 8 - 2)} ${f1(R + 10)} ${B}`;
    d += `C${f1(R + 3)} ${B} ${f1(R - neck)} ${B + 2} ${f1(R - neck)} ${B + 9}`;
    d += `L${f1(R - neck)} ${f1(bot - hw * 1.7)}C${f1(R - neck)} ${f1(bot - hw * 1.3)} ${f1(R)} ${f1(bot - hw * 1.4)} ${f1(R)} ${f1(bot - hw)}`;
    d += `A${f1(hw)} ${f1(hw)} 0 0 1 ${f1(L)} ${f1(bot - hw)}`;
    d += `C${f1(L)} ${f1(bot - hw * 1.4)} ${f1(L + neck)} ${f1(bot - hw * 1.3)} ${f1(L + neck)} ${f1(bot - hw * 1.7)}`;
    d += `L${f1(L + neck)} ${B + 9}C${f1(L + neck)} ${B + 2} ${f1(L - 3)} ${B} ${f1(L - 10)} ${B}`;
    cur = L - 10;
  }
  d += `Q${f1(cur / 2)} ${B + 6} 0 ${B}Z`;
  return `<svg viewBox="0 0 ${W} 120" aria-hidden="true" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;
}

// Wavy-edged circle (bottle-cap / sticker badge).
export function scallopPath(cx, cy, radius, bumps = 18, depth = 0.06) {
  let d = '';
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const rr = radius * (1 + depth * Math.cos(a * bumps));
    d += `${i ? 'L' : 'M'}${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

/* ---------- icons ---------- */

const ui = (body, cls = 'ico') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICON = {
  phone: ui('<path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>'),
  wa: ui('<path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.65.8-.8.97-.14.17-.29.19-.54.06a6.8 6.8 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.17.04-.3-.02-.43l-.76-1.84c-.2-.48-.4-.42-.56-.42h-.48a.9.9 0 0 0-.66.31c-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.57c.13.17 1.75 2.67 4.24 3.74 1.58.68 2.2.74 2.99.62.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>'),
  pin: ui('<path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'),
  arrow: ui('<path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M9 6h9v9"/>'),
  Instagram: ui('<rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.4" fill="currentColor"/>'),
  TikTok: ui('<path fill="currentColor" d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z"/>'),
  Facebook: ui('<path fill="currentColor" d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22z"/>'),
};

const art = (body) =>
  `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="none" stroke="${C.choc}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

const specks = (pts, fill = C.white) =>
  `<g fill="${fill}" stroke="none">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;

export const ART = {
  cone: art(`
    <path d="M30 48 50 95 70 48Z" fill="${C.tan}"/>
    <path d="M36 58 62 52M40 68 59 62M45 79 55 76M38 52 55 86M50 50 61 64" stroke-width="2.4"/>
    <path d="M27 50c-4-18 8-32 23-32s27 14 23 32c-4 4-8-2-12 2s-6 8-10 2-8 4-12 0-8-6-12-4Z" fill="${C.pink}"/>
    <g stroke-width="3.2"><path d="M39 33l5-2" stroke="${C.mango}"/><path d="M55 28l4 3" stroke="${C.blue}"/><path d="M62 40l-5 1" stroke="${C.white}"/><path d="M44 42l3 3" stroke="${C.mint}"/></g>
    <circle cx="52" cy="17" r="6" fill="${C.red}"/><path d="M53 11c1-4 4-6 8-6"/>`),
  'scoop-cup': art(`
    <circle cx="37" cy="49" r="15" fill="${C.pink}"/>
    <circle cx="63" cy="49" r="15" fill="${C.blue}"/>
    <circle cx="50" cy="34" r="15" fill="${C.mango}"/>
    <path d="M60 34 78 13" stroke-width="4.5"/><ellipse cx="81" cy="10" rx="5" ry="7.5" transform="rotate(40 81 10)" fill="${C.white}"/>
    <path d="M21 55h58l-7 39H28Z" fill="${C.white}"/>
    <path d="M26 69h48" stroke="${C.pink}" stroke-width="6" stroke-linecap="butt"/>`),
  blizzard: art(`
    <path d="M62 4 53 36" stroke="${C.red}" stroke-width="7"/>
    <path d="M27 41c-2-10 8-14 14-14 0-8 8-12 14-10 8 2 10 8 8 12 8 0 12 6 10 12Z" fill="${C.cream}"/>
    <path d="M38 33l5 2M51 24l3 4M60 35l-4 2M46 38l2 1" stroke-width="4.5"/>
    <path d="M25 41h50l-6 53H31Z" fill="${C.white}"/>
    <circle cx="50" cy="66" r="11" fill="${C.pink}"/><path d="M45 66h10" stroke="${C.white}"/>`),
  slush: art(`
    <path d="M27 42h46l-7 52H34Z" fill="${C.blue}"/>
    <path d="M30.5 68h39L66 94H34Z" fill="${C.pink}"/>
    ${specks([[40, 52, 2], [56, 58, 2.5], [47, 80, 2], [60, 85, 2], [36, 62, 1.6], [62, 48, 1.6]])}
    <path d="M27 36c0-19 46-19 46 0Z" fill="${C.white}" fill-opacity=".55"/>
    <rect x="23" y="36" width="54" height="8" rx="4" fill="${C.white}"/>
    <path d="M56 35 62 5 68 6.5 62 36Z" fill="${C.pink}"/><path d="M58.6 24 65 25.4M60.6 14 66.8 15.4" stroke="${C.white}" stroke-width="3"/>`),
  coffee: art(`
    <path d="M54 40 61 3" stroke-width="6"/>
    <path d="M26 30h48l-7 64H33Z" fill="${C.toast}"/>
    <path d="M26 30h48l-1.6 14H27.6Z" fill="${C.cream}"/>
    <rect x="36" y="52" width="12" height="12" rx="2" fill="${C.white}" fill-opacity=".85" transform="rotate(-12 42 58)" stroke-width="2.5"/>
    <rect x="52" y="66" width="11" height="11" rx="2" fill="${C.white}" fill-opacity=".85" transform="rotate(14 57 71)" stroke-width="2.5"/>
    <path d="M22 30h56" stroke-width="5"/>`),
  soda: art(`
    <path d="M42 16h16v8c0 6 10 9 10 20v42c0 6-4 10-10 10H42c-6 0-10-4-10-10V44c0-11 10-14 10-20Z" fill="${C.aqua}"/>
    <rect x="40" y="6" width="20" height="10" rx="3" fill="${C.red}"/>
    <path d="M32 56h36v15H32Z" fill="${C.mango}"/>
    ${specks([[44, 81, 2.5], [55, 86, 2], [50, 45, 2], [58, 40, 1.6], [42, 36, 1.4]])}`),
  'milk-soda': art(`
    <path d="M58 26 67 2" stroke-width="5"/>
    <path d="M28 20h44l-6 74H34Z" fill="${C.milk}"/>
    <path d="M28 20h44l-1.1 13H29.1Z" fill="${C.white}"/>
    ${specks([[42, 50, 2.5], [56, 60, 2], [47, 74, 2.2], [58, 82, 1.8], [40, 64, 1.5]])}
    <path d="M36 44 39 86" stroke="${C.white}" stroke-width="3" stroke-opacity=".7"/>`),
  golgappay: art(`
    <path d="M77 24h16l-2.4 22H79.4Z" fill="${C.lime}"/>
    <ellipse cx="48" cy="73" rx="44" ry="16" fill="${C.white}"/>
    <circle cx="28" cy="61" r="14" fill="${C.tan}"/>
    <circle cx="68" cy="61" r="14" fill="${C.tan}"/>
    <circle cx="48" cy="52" r="15" fill="#F2C98C"/>
    <ellipse cx="48" cy="47" rx="6.5" ry="4.2" fill="${C.brown}"/>
    <circle cx="47" cy="46" r="2.4" fill="${C.mango}" stroke="none"/>`),
  'dahi-bhallay': art(`
    <path d="M12 46h76c0 22-16 38-38 38S12 68 12 46Z" fill="${C.pink}"/>
    <ellipse cx="50" cy="46" rx="38" ry="11" fill="${C.white}"/>
    <path d="M27 45c6 4 12-4 18 0s10-4 16 0 10-2 12 0" stroke="${C.brown}" stroke-width="4"/>
    <g stroke="none"><circle cx="35" cy="40" r="2.2" fill="${C.red}"/><circle cx="61" cy="50" r="2.2" fill="${C.red}"/><circle cx="48" cy="39" r="2.2" fill="${C.mint}"/><circle cx="67" cy="41" r="2.2" fill="${C.mint}"/></g>
    <path d="M24 60c4 8 10 12 16 14" stroke="${C.white}" stroke-width="3" stroke-opacity=".7"/>`),
  fries: art(`
    <g fill="${C.mango}"><path d="M33 50 30 18h8l3 32Z"/><path d="M43 50V12h8v38Z"/><path d="M54 50l4-34h8l-4 34Z"/><path d="M63 52l8-27 7 3-7 25Z"/><path d="M36 50l-9-23 7-3 9 25Z"/></g>
    <path d="M24 46c16 8 36 8 52 0l-6 48H30Z" fill="${C.red}"/>
    <circle cx="50" cy="71" r="9" fill="${C.white}"/><path d="M46.5 71h7" />`),
  platter: art(`
    <ellipse cx="50" cy="62" rx="46" ry="26" fill="${C.white}"/>
    <ellipse cx="50" cy="62" rx="36" ry="18" stroke-width="2"/>
    <g fill="${C.mango}" stroke-width="2.8"><rect x="22" y="46" width="6" height="22" rx="2" transform="rotate(-35 25 57)"/><rect x="30" y="44" width="6" height="22" rx="2" transform="rotate(-15 33 55)"/><rect x="37" y="46" width="6" height="20" rx="2" transform="rotate(10 40 56)"/></g>
    <g fill="${C.toast}" stroke-width="2.8"><path d="M50 54c6-5 14-1 13 5s-11 6-14 3-1-6 1-8Z"/><path d="M58 66c5-4 12-1 11 4s-10 5-12 2-1-4 1-6Z"/></g>
    <circle cx="73" cy="56" r="7" fill="${C.red}"/>
    <path d="M30 72c4-6 10-6 14 0-4 4-10 4-14 0Z" fill="${C.mint}"/>`),
};

/* ---------- sections ---------- */

const COLOR_CLASS = { pink: 'pink', slush: 'slush', mango: 'mango', choc: 'choc' };

export function renderBoardItems(data) {
  const colorOf = Object.fromEntries(data.categories.map((c) => [c.id, COLOR_CLASS[c.color] || 'pink']));
  return data.items
    .map((item) => {
      const r = rng(hashStr(item.name));
      const rot = f1(r() * 12 - 6);
      const dx = Math.round(r() * 10 - 5);
      const dy = Math.round(r() * 14 - 7);
      const shape = Math.floor(r() * 3);
      const price = item.price || 'Rs. —';
      const unpriced = !/\d/.test(price);
      const pic = item.image
        ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" width="240" height="240">`
        : ART[item.icon] || ART.slush;
      return `<li class="sticker" data-cat="${esc(item.category)}" style="--dx:${dx}px;--dy:${dy}px">
  <div class="sticker__body sticker--${colorOf[item.category] || 'pink'} shape-${shape}" style="--r:${rot}deg">
    <div class="sticker__art">${pic}</div>
    <h3 class="sticker__name">${esc(item.name)}</h3>
    ${item.urdu ? `<p class="sticker__ur urdu" lang="ur" dir="rtl">${esc(item.urdu)}</p>` : ''}
    ${item.desc ? `<p class="sticker__desc">${esc(item.desc)}</p>` : ''}
    <span class="sticker__price">${
      unpriced
        ? `<span aria-hidden="true">${esc(price)}</span><span class="sr-only">Price: ask the branch</span>`
        : esc(price)
    }</span>
  </div>
</li>`;
    })
    .join('\n');
}

export function renderMenu(data) {
  const tab = (id, label, color, selected) =>
    `<button class="tab tab--${color}" role="tab" type="button" id="tab-${id}" data-cat="${id}" aria-selected="${selected}" aria-controls="menu-board"${selected ? '' : ' tabindex="-1"'}>${esc(label)}</button>`;
  const tabs = [tab('all', 'Everything', 'cream', true), ...data.categories.map((c) => tab(c.id, c.label, COLOR_CLASS[c.color] || 'pink', false))];
  const urduMap = esc(JSON.stringify(Object.fromEntries(data.categories.map((c) => [c.id, c.urdu || '']))));
  return `<div class="tabs" role="tablist" aria-label="Menu categories">${tabs.join('')}</div>
<p class="board-ur urdu" lang="ur" dir="rtl" aria-hidden="true" data-urdu="${urduMap}">ٹھنڈا ٹھار</p>
<ul class="board" id="menu-board" role="tabpanel" aria-labelledby="tab-all" data-v="${menuHash(data)}">
${renderBoardItems(data)}
</ul>`;
}

const ROAD = (d) => `<path d="${d}" stroke="${C.choc}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${C.white}" stroke-width="22" fill="none" stroke-linecap="round"/>`;
const MAP_PIN = (x, y) =>
  `<g class="map-pin" transform="translate(${x} ${y})"><ellipse cx="0" cy="2" rx="12" ry="4" fill="${C.choc}" opacity=".25"/><g class="map-pin__drop"><path d="M0 0C-16-16-17-40 0-40S16-16 0 0Z" fill="${C.pink}" stroke="${C.choc}" stroke-width="4" stroke-linejoin="round"/><circle cx="0" cy="-25" r="6" fill="${C.white}" stroke="${C.choc}" stroke-width="3"/></g></g>`;
const LABEL = (x, y, t, rot = 0) =>
  `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Rubik, system-ui, sans-serif" font-weight="800" font-size="13" fill="${C.choc}" letter-spacing=".5">${esc(t)}</text>`;

function mapArt(i, b) {
  const blocks = `<g fill="#FFD79A">${[[18, 16, 140, 70], [242, 16, 140, 70], [18, 166, 140, 70], [242, 166, 140, 70]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>`).join('')}</g>`;
  let body;
  if (i === 0) {
    body = `${blocks}${ROAD('M-20 126H420')}${ROAD('M200 -20V270')}
      <circle cx="200" cy="126" r="44" fill="${C.white}" stroke="${C.choc}" stroke-width="4"/>
      <circle cx="200" cy="126" r="26" fill="${C.mint}" stroke="${C.choc}" stroke-width="4"/>
      <g stroke="${C.choc}" stroke-width="3.5" stroke-linejoin="round"><rect x="191" y="104" width="18" height="34" fill="${C.cream}"/><path d="M187 104h26l-13-16Z" fill="${C.pink}"/><circle cx="200" cy="116" r="6" fill="${C.white}"/></g>
      ${LABEL(26, 108, 'GHANTA GHAR CHOWK')}${LABEL(254, 40, 'BLOCK C')}${MAP_PIN(346, 82)}`;
  } else if (i === 1) {
    body = `${blocks}
      <path d="M-20 70C90 40 210 110 420 54" stroke="${C.choc}" stroke-width="42" fill="none"/><path d="M-20 70C90 40 210 110 420 54" stroke="${C.blue}" stroke-width="34" fill="none"/>
      <path d="M10 66c14-6 28-6 42 0M150 74c14 6 28 6 42 2M300 66c14-6 28-6 42-4" stroke="${C.white}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${ROAD('M-20 150C90 120 210 190 420 134')}${ROAD('M250 -20V270')}
      <rect x="276" y="174" width="70" height="40" rx="8" fill="${C.mango}" stroke="${C.choc}" stroke-width="4"/>
      ${LABEL(26, 108, 'MANKA CANAL', -6)}${LABEL(282, 232, 'GUJJAR HOTEL')}${MAP_PIN(222, 188)}`;
  } else {
    body = `${blocks}${ROAD('M-20 126H420')}${ROAD('M200 -20V270')}${MAP_PIN(250, 100)}`;
  }
  return `<svg class="branch__art" viewBox="0 0 400 250" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice"><rect width="400" height="250" fill="${C.cream}"/>${body}</svg>`;
}

function familyStamp(id) {
  const ring = 'FAMILY SITTING AVAILABLE ✦ FAMILY SITTING AVAILABLE ✦ ';
  return `<div class="stamp" aria-hidden="true">
  <svg viewBox="0 0 140 140"><path d="${scallopPath(70, 70, 64, 16, 0.05)}" fill="${C.mango}" stroke="${C.choc}" stroke-width="4"/>
  <defs><path id="ring-${id}" d="M70 70m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>
  <g class="stamp__ring"><text font-family="Rubik, system-ui, sans-serif" font-weight="800" font-size="11.2" letter-spacing="1.2" fill="${C.choc}"><textPath href="#ring-${id}">${ring}</textPath></text></g>
  <g stroke="${C.choc}" stroke-width="3.5" stroke-linejoin="round"><path d="M44 86v-14c0-6 4-9 9-9h34c5 0 9 3 9 9v14Z" fill="${C.pink}"/><path d="M40 78h60v12H40Z" fill="${C.white}"/><circle cx="58" cy="54" r="6" fill="${C.cream}"/><circle cx="82" cy="54" r="6" fill="${C.cream}"/><circle cx="70" cy="60" r="4.5" fill="${C.cream}"/></g></svg>
</div>`;
}

export function renderBranches(data) {
  return data.branches
    .map((b, i) => {
      const color = i % 2 ? 'slush' : 'pink';
      return `<article class="branch branch--${color}${b.familySitting ? ' branch--family' : ''}" aria-labelledby="${b.id}-title" data-jelly>
  <header class="branch__head">
    <span class="branch__num" aria-hidden="true">0${i + 1}</span>
    <div><p class="branch__label">${esc(b.label)}</p><h3 class="branch__name" id="${b.id}-title">${esc(b.name)}</h3></div>
  </header>
  ${b.familySitting ? `${familyStamp(b.id)}<p class="badge">Family sitting available</p>` : ''}
  <div class="branch__map" data-map="${esc(mapsEmbed(b.mapQuery))}" data-title="Google map of ${esc(b.label)}, ${esc(b.name)}">
    ${mapArt(i, b)}
    <button type="button" class="btn btn--small branch__mapbtn">${ICON.pin} Load live map</button>
  </div>
  <div class="branch__body">
    <address>${esc(b.address)}</address>
    ${b.extras?.length ? `<ul class="chips">${b.extras.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <p class="branch__phone">Delivery: <a href="${telHref(b.phone)}">${esc(b.phone)}</a></p>
    <div class="branch__actions">
      <a class="btn btn--pink" href="${telHref(b.phone)}">${ICON.phone} Call</a>
      <a class="btn btn--wa" href="${waHref(b.phone, waMsg(data, b))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
      <a class="btn" href="${mapsLink(b.mapQuery)}" target="_blank" rel="noopener">${ICON.pin} Directions</a>
    </div>
  </div>
</article>`;
    })
    .join('\n');
}

export function renderSheet(data) {
  const rows = data.branches
    .map(
      (b, i) => `<li class="sheet__branch sheet__branch--${i % 2 ? 'slush' : 'pink'}">
      <div class="sheet__info">
        <strong>${esc(b.label)} · ${esc(b.name)}</strong>
        <span>${esc(b.address)}</span>
        <span class="sheet__phone">${esc(b.phone)}</span>
      </div>
      <div class="sheet__btns">
        <a class="btn btn--pink" href="${telHref(b.phone)}">${ICON.phone} Call</a>
        <a class="btn btn--wa" href="${waHref(b.phone, waMsg(data, b))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
      </div>
    </li>`,
    )
    .join('');
  return `<dialog class="sheet" id="call-sheet" aria-labelledby="sheet-title">
  <div class="sheet__panel">
    <span class="sheet__grab" aria-hidden="true"></span>
    <p class="sheet__ur urdu" lang="ur" dir="rtl" aria-hidden="true">گھر بیٹھے منگوائیں</p>
    <h2 class="sheet__title" id="sheet-title">Which branch is closer?</h2>
    <p class="sheet__sub">Home delivery is by phone or WhatsApp. Tap a branch to order.</p>
    <ul class="sheet__list">${rows}</ul>
    <button class="btn btn--small sheet__close" type="button" data-close-sheet>Close</button>
  </div>
</dialog>`;
}

export function renderSocials(data) {
  return data.socials
    .map((s) => {
      const key = s.name.toLowerCase();
      const letters = [...s.name].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join('');
      return `<li><a class="social social--${key}" href="${esc(s.url)}" target="_blank" rel="noopener me">
  <span class="social__icon">${ICON[s.name] || ICON.arrow}</span>
  <span class="social__name" aria-hidden="true">${letters}</span>
  <span class="sr-only">${esc(s.name)}</span>
  <span class="social__handle">${esc(s.handle)}</span>
  <span class="social__arrow">${ICON.arrow}</span>
</a></li>`;
    })
    .join('\n');
}

const STAR = `<svg class="tick-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6Z" fill="currentColor"/></svg>`;

export function renderDeal(data) {
  const d = data.deal;
  const run = (list) =>
    list.map((t) => `<span${isUrdu(t) ? ' class="urdu" lang="ur"' : ''}>${esc(t)}</span>${STAR}`).join('');
  const track = (list) => `<div class="ticker__track"><div class="ticker__run">${run(list)}</div><div class="ticker__run">${run(list)}</div></div>`;
  return `<div class="ticker ticker--a" aria-hidden="true">${track(d.ticker)}</div>
<div class="ticker ticker--b" aria-hidden="true">${track([...d.ticker].reverse())}</div>
<div class="deal__card" data-jelly>
  <svg class="deal__burst" viewBox="0 0 160 160" aria-hidden="true"><path d="${scallopPath(80, 80, 70, 14, 0.12)}" fill="${C.pink}" stroke="${C.choc}" stroke-width="4"/><text x="80" y="76" text-anchor="middle" font-family="'Bagel Fat One', Impact, sans-serif" font-size="26" fill="${C.white}">MID</text><text x="80" y="104" text-anchor="middle" font-family="'Bagel Fat One', Impact, sans-serif" font-size="26" fill="${C.white}">MONTH</text></svg>
  <p class="deal__kicker">${esc(d.kicker)}</p>
  <h2 class="deal__title" id="deal-title">${esc(d.title)}</h2>
  ${d.titleUrdu ? `<p class="deal__ur urdu" lang="ur" dir="rtl">${esc(d.titleUrdu)}</p>` : ''}
  <p class="deal__body">${esc(d.body)}</p>
  <button class="btn btn--pink btn--big" type="button" data-open-sheet>${ICON.phone} ${esc(d.cta)}</button>
</div>`;
}

export function renderCallbar(data) {
  return `<nav class="callbar" aria-label="Call for delivery">${data.branches
    .slice(0, 2)
    .map(
      (b, i) =>
        `<a class="callbar__btn callbar__btn--${i % 2 ? 'slush' : 'pink'}" href="${telHref(b.phone)}">${ICON.phone}<span><strong>Call ${esc(b.label)}</strong><small>${esc(b.name)}</small></span></a>`,
    )
    .join('')}</nav>`;
}

export function renderFooterContacts(data) {
  return data.branches
    .map((b) => `<li><strong>${esc(b.label)}</strong> ${esc(b.address)} · <a href="${telHref(b.phone)}">${esc(b.phone)}</a></li>`)
    .join('');
}

export function renderSeo(data) {
  const s = data.site;
  const url = s.url.replace(/\/$/, '');
  const img = `${url}/og-image.png`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': `${url}/#brand`,
      name: s.name,
      url: `${url}/`,
      logo: `${url}/icon-512.png`,
      slogan: s.tagline,
      sameAs: data.socials.map((x) => x.url),
    },
    ...data.branches.map((b) => ({
      '@type': 'IceCreamShop',
      '@id': `${url}/#${b.id}`,
      name: `${s.name} — ${b.name}`,
      parentOrganization: { '@id': `${url}/#brand` },
      url: `${url}/#branches`,
      image: img,
      telephone: `+${digits(b.phone)}`,
      priceRange: 'Rs',
      servesCuisine: ['Ice cream', 'Desserts', 'Slush', 'Pakistani street food'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: b.address.replace(/,\s*DG Khan$/i, ''),
        addressLocality: 'Dera Ghazi Khan',
        addressRegion: 'Punjab',
        addressCountry: 'PK',
      },
      hasMap: mapsLink(b.mapQuery),
      ...(b.familySitting
        ? { amenityFeature: [{ '@type': 'LocationFeatureSpecification', name: 'Family sitting area', value: true }] }
        : {}),
    })),
  ];
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<title>${esc(s.seoTitle)}</title>
    <meta name="description" content="${esc(s.seoDescription)}">
    <link rel="canonical" href="${url}/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(s.name)}">
    <meta property="og:locale" content="en_PK">
    <meta property="og:title" content="${esc(s.seoTitle)}">
    <meta property="og:description" content="${esc(s.seoDescription)}">
    <meta property="og:url" content="${url}/">
    <meta property="og:image" content="${img}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(s.name)} — ${esc(s.tagline)}, Dera Ghazi Khan">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(s.seoTitle)}">
    <meta name="twitter:description" content="${esc(s.seoDescription)}">
    <meta name="twitter:image" content="${img}">
    <script type="application/ld+json">${ld}</script>`;
}
