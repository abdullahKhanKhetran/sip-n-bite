// Turns photos dropped in assets/raw/ into web-ready files in public/img/:
// WebP + AVIF at 480, 960 and 1600px wide (never upscaled). Run: npm run images
// Then point a menu item at one, e.g. "image": "/img/cone-960.webp"
import { readdirSync, mkdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'assets', 'raw');
const out = join(root, 'public', 'img');
mkdirSync(out, { recursive: true });

const files = readdirSync(src).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
for (const file of files) {
  const name = parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { width } = await sharp(join(src, file)).metadata();
  for (const w of [480, 960, 1600]) {
    if (w > width && w !== 480) continue;
    const img = sharp(join(src, file)).rotate().resize({ width: Math.min(w, width) });
    await img.clone().webp({ quality: 78 }).toFile(join(out, `${name}-${w}.webp`));
    await img.clone().avif({ quality: 55 }).toFile(join(out, `${name}-${w}.avif`));
  }
  console.log(`✓ ${file}`);
}
if (!files.length) console.log('Put photos in assets/raw/ first.');
