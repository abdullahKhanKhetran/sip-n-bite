# Sip & Bite — website

One-page site for Sip & Bite, Dera Ghazi Khan. Vite + vanilla JS + GSAP.

## Edit the content

Everything (phones, addresses, socials, the deal, menu items, prices) lives in **`public/menu.json`**.

- Price: change `"Rs. —"` to e.g. `"Rs. 150"`.
- Photo for an item: put it in `assets/raw/`, run `npm run images`, then set
  `"image": "/img/<name>-960.webp"` on the item. Without a photo, the drawn sticker icon is used.
- After going live, set `site.url` to the real domain (used for SEO + share image), then run `npm run og`.

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
npm run og        # regenerate og-image.png + app icons from menu.json
npm run images    # convert assets/raw photos → public/img (WebP + AVIF, 480/960/1600px)
```

## Deploy

- **Netlify**: connect the repo; `netlify.toml` already sets `npm run build` → `dist`.
- **Vercel**: import the repo; it detects Vite automatically.
