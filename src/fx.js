// Page-level motion: hero intro, jelly-bounce section entrances, sprinkle showers.
import { gsap } from 'gsap';

const SPRINKLES = ['#FF3D7F', '#1FB6FF', '#FFC81E', '#2BD9A0', '#FFFDF7'];

export function heroIntro() {
  // clearProps hands each element back to its CSS transform (the letters are tilted in CSS)
  const clear = { clearProps: 'transform' };
  gsap.from('.wm-l, .wm-amp', {
    yPercent: -70, scale: 0.5, rotation: () => gsap.utils.random(-30, 30),
    duration: 1.1, ease: 'elastic.out(1, 0.45)', stagger: 0.05, ...clear,
  });
  gsap.from('.tape', { scaleX: 0, rotation: -14, duration: 0.6, ease: 'back.out(2)', delay: 0.2, ...clear });
  gsap.from('.cup-stage', { y: 70, scaleY: 0.82, scaleX: 1.12, transformOrigin: '50% 100%', duration: 1.2, ease: 'elastic.out(1, 0.4)', delay: 0.1, ...clear });
  gsap.from('.cup-badge', { scale: 0, duration: 1, ease: 'back.out(1.6)', ...clear });
  gsap.from('.hero__ctas .btn', { scale: 0.4, duration: 0.9, ease: 'elastic.out(1, 0.5)', stagger: 0.1, delay: 0.35, ...clear });
}

// Elements below the fold wobble in like jelly when they scroll into view.
export function jelly() {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        io.unobserve(target);
        gsap.fromTo(
          target,
          { y: 80, scaleX: 1.1, scaleY: 0.82, autoAlpha: 0 },
          { y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 1.2, ease: 'elastic.out(1, 0.45)', transformOrigin: '50% 100%', clearProps: 'transform' },
        );
      }),
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const el of document.querySelectorAll('[data-jelly]')) {
    if (el.getBoundingClientRect().top < innerHeight) continue;
    gsap.set(el, { autoAlpha: 0 });
    io.observe(el);
  }

  const board = document.getElementById('menu-board');
  if (board && board.getBoundingClientRect().top > innerHeight) {
    const stickers = () => board.querySelectorAll('.sticker:not([hidden])');
    gsap.set(stickers(), { scale: 0 });
    const bio = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      bio.disconnect();
      gsap.to(stickers(), {
        scale: 1, duration: 1, ease: 'elastic.out(1, 0.5)',
        stagger: { each: 0.06, from: 'random' }, clearProps: 'transform',
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    bio.observe(board);
  }
}

// A shower of sprinkles the first time each section scrolls into view.
export function sprinkles() {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        io.unobserve(target);
        shower(target);
      }),
    { threshold: 0.12 },
  );
  document.querySelectorAll('.sprinkle-layer').forEach((layer) => io.observe(layer));
}

function shower(layer) {
  const w = layer.clientWidth;
  const h = Math.min(layer.clientHeight, innerHeight * 0.9);
  const count = w < 600 ? 16 : 28;
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('i');
    bit.className = 'sprinkle-bit';
    bit.style.background = SPRINKLES[i % SPRINKLES.length];
    layer.append(bit);
    const x = Math.random() * w;
    gsap
      .timeline({ delay: Math.random() * 0.6, onComplete: () => bit.remove() })
      .fromTo(bit, { x, y: -30, rotation: Math.random() * 360 }, {
        x: x + gsap.utils.random(-90, 90), y: h * gsap.utils.random(0.35, 1),
        rotation: `+=${gsap.utils.random(-540, 540)}`, duration: gsap.utils.random(1.2, 2.2), ease: 'power1.in',
      })
      .to(bit, { autoAlpha: 0, scale: 0.4, duration: 0.35 }, '-=0.3');
  }
}
