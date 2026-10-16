// First-visit loader: cup fills with wobbly slush, % counter, lid pops on, then the
// whole screen melts up and away with stretching drips. Under ~2s; once per session.
import { gsap } from 'gsap';

const EMPTY = 250, FULL = 88; // liquid group translateY in the loader SVG

export function runLoader() {
  return new Promise((resolve) => {
    const root = document.documentElement;
    const el = document.getElementById('loader');
    if (!el || !root.classList.contains('is-loading')) {
      el?.remove();
      resolve(false);
      return;
    }
    const pct = document.getElementById('loader-pct');
    const liquid = document.getElementById('loader-liquid');
    const lid = document.getElementById('loader-lid');
    const inner = el.querySelector('.loader__inner');
    const drips = el.querySelector('.loader__drips');

    let loaded = document.readyState === 'complete';
    addEventListener('load', () => (loaded = true), { once: true });
    gsap.set(lid, { y: -150, rotation: -14, opacity: 0, transformOrigin: '50% 100%' });

    const t0 = performance.now();
    const fillMs = Math.max(450, 950 - t0 * 0.5); // if the script arrived late, pour faster
    const tick = () => {
      const now = performance.now() - t0;
      const raw = Math.min(1, now / fillMs);
      const cap = loaded || now > 1300 ? 1 : 0.92; // hold near the top until the page is ready
      const p = Math.min(cap, 1 - Math.pow(1 - raw, 2.2));
      pct.textContent = Math.round(p * 100);
      liquid.setAttribute('transform', `translate(0 ${EMPTY - (EMPTY - FULL) * p})`);
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);

    function finish() {
      gsap
        .timeline({ onComplete: done })
        .to(lid, { y: 0, rotation: 0, opacity: 1, duration: 0.36, ease: 'back.out(3)' })
        .to(inner, { scaleY: 0.86, scaleX: 1.08, duration: 0.09, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, '-=0.1')
        .addLabel('melt', '+=0.04')
        .to(drips, { scaleY: 2.6, duration: 0.6, ease: 'power2.in', transformOrigin: '50% 0%' }, 'melt')
        .to(inner, { y: -60, scaleY: 1.25, scaleX: 0.85, duration: 0.6, ease: 'power2.in' }, 'melt')
        .to(el, { y: () => -(innerHeight + drips.offsetHeight * 2.7), duration: 0.6, ease: 'power3.in' }, 'melt');
    }

    function done() {
      root.classList.remove('is-loading');
      try {
        sessionStorage.setItem('snb-poured', '1');
      } catch {}
      el.remove();
      resolve(true);
    }
  });
}
