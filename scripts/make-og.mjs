// Builds public/og-image.png (1200x630) and the PNG app icons.
// Text is converted to outlines with the real brand fonts, so the PNG doesn't depend
// on fonts installed on this machine. Run: npm run og
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';
import { scallopPath, dripSvg } from '../src/render.js';

const root = new URL('../', import.meta.url);
const data = JSON.parse(readFileSync(new URL('public/menu.json', root), 'utf8'));
const INK = '#3B1F14';

async function loadFont(family) {
  // Without a browser user-agent, Google Fonts serves plain TTF files that opentype.js can read.
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}`)).text();
  // the last @font-face block is the basic Latin subset
  const url = [...css.matchAll(/src:\s*url\((.+?)\)/g)].at(-1)?.[1];
  if (!url) throw new Error(`No font URL for ${family}`);
  return opentype.parse(await (await fetch(url)).arrayBuffer());
}

const bagel = await loadFont('Bagel+Fat+One');
// Glyph-by-glyph layout: skips OpenType shaping, which opentype.js can't do for these fonts.
function text(font, str, x, y, size) {
  let d = '';
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    d += g.getPath(x, y, size).toPathData(2);
    x += (g.advanceWidth * size) / font.unitsPerEm;
  }
  return d;
}
const width = (font, str, size) => [...str].reduce((w, ch) => w + (font.charToGlyph(ch).advanceWidth * size) / font.unitsPerEm, 0);

function sticker(d, fill, stroke = 10, shadow = 8) {
  return `<path d="${d}" transform="translate(${shadow} ${shadow})" fill="${INK}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round"/>
  <path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round" paint-order="stroke"/>`;
}

const tagline = data.site.tagline.toUpperCase();
const tagSize = 28, tagW = width(bagel, tagline, tagSize) + 56;

const cup = `
<g transform="translate(905 560) rotate(6)" stroke="${INK}" stroke-linejoin="round">
  <path d="M30-30 80-470" stroke-width="22" stroke-linecap="round"/>
  <path d="M30-30 80-470" stroke="#FFFDF7" stroke-width="14" stroke-linecap="round"/>
  <path d="M-110-290H110L74-10H-74Z" fill="#1FB6FF" stroke-width="7"/>
  <path d="M-94-150H94L74-10H-74Z" fill="#E0245E" stroke-width="0"/>
  <path d="M-110-290H110L74-10H-74Z" fill="none" stroke-width="7"/>
  <circle cx="0" cy="-110" r="48" fill="#FFC81E" stroke-width="5"/>
  <path d="${text(bagel, 'S&B', -34, -98, 34)}" fill="${INK}" stroke="none"/>
  <path d="M-106-302C-106-390 106-390 106-302Z" fill="#FFFDF7" fill-opacity=".7" stroke-width="7"/>
  <rect x="-118" y="-308" width="236" height="22" rx="8" fill="#FFFDF7" stroke-width="7"/>
</g>`;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFF4E2"/>
  <path d="${scallopPath(910, 330, 250, 22, 0.045)}" fill="#FFC81E" stroke="${INK}" stroke-width="7"/>
  ${cup}
  <g transform="translate(70 92) rotate(-3)">
    <rect width="${tagW}" height="58" fill="${INK}" transform="translate(6 6)"/>
    <rect width="${tagW}" height="58" fill="#FFC81E"/>
    <path d="${text(bagel, tagline, 28, 40, tagSize)}" fill="${INK}"/>
  </g>
  ${sticker(text(bagel, 'Sip', 64, 330, 220), '#FF3D7F', 12, 12)}
  <circle cx="132" cy="408" r="52" fill="#FF3D7F" stroke="${INK}" stroke-width="8"/>
  <path d="${text(bagel, '&', 106, 434, 72)}" fill="#FFFDF7"/>
  ${sticker(text(bagel, 'Bite', 196, 500, 190), '#1FB6FF', 12, 12)}
  <path d="${text(bagel, 'DG KHAN  ·  HOME DELIVERY', 70, 562, 24)}" fill="${INK}"/>
  ${data.branches.map((b, i) => `<path d="${text(bagel, b.phone, 70 + i * 250, 596, 24)}" fill="${i ? '#0A8FDB' : '#D81B57'}"/>`).join('')}
  <g transform="translate(0 -1)" fill="#FF3D7F">${dripSvg(5).replace(/<\/?svg[^>]*>/g, '').replace('currentColor', '#FF3D7F').replace('<path', '<path transform="scale(.8334)"')}</g>
</svg>`;

await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL('public/og-image.png', root)));

const icon = readFileSync(new URL('public/favicon.svg', root));
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-512.png', 512]]) {
  await sharp(icon, { density: 72 * (size / 64) }).resize(size, size).png().toFile(fileURLToPath(new URL(`public/${name}`, root)));
}
console.log('og-image.png, apple-touch-icon.png, icon-512.png written to public/');
