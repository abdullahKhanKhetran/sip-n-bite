import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import * as R from './src/render.js';

const DATA_FILE = fileURLToPath(new URL('./public/menu.json', import.meta.url));

// Fills <!--#slot--> markers in index.html from public/menu.json, so every phone number,
// address and menu item is real HTML for search engines and no-JS visitors.
function fillSlots(html) {
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  const slots = {
    seo: () => R.renderSeo(data),
    menu: () => R.renderMenu(data),
    deal: () => R.renderDeal(data),
    branches: () => R.renderBranches(data),
    socials: () => R.renderSocials(data),
    sheet: () => R.renderSheet(data),
    callbar: () => R.renderCallbar(data),
    contacts: () => R.renderFooterContacts(data),
    drip: (seed) => R.dripSvg(Number(seed)),
    scallop: () => R.scallopPath(200, 200, 186, 22, 0.045),
    handle: () => R.esc(data.site.handle),
    tagline: () => R.esc(data.site.tagline),
    taglineUrdu: () => R.esc(data.site.taglineUrdu),
  };
  return html.replace(/<!--#(\w+)(?::(\w+))?-->/g, (match, name, arg) => {
    if (!slots[name]) throw new Error(`Unknown slot ${match} in index.html`);
    return slots[name](arg);
  });
}

function sipnbitePrerender() {
  return {
    name: 'sipnbite-prerender',
    configureServer(server) {
      server.watcher.add(DATA_FILE);
      server.watcher.on('change', (file) => {
        if (file === DATA_FILE) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: { order: 'pre', handler: fillSlots },
  };
}

export default defineConfig({
  plugins: [sipnbitePrerender()],
  build: { target: 'es2019' },
});
