// The hero slushy cup, drawn on <canvas>.
// - liquid surface = row of damped springs + a lagging "slosh angle" spring (inertia)
// - cup tilts toward the pointer (desktop), touch-drag or device tilt (mobile)
// - tap/click = shake: rattle, bubbles + ice bits rise, droplets burst out of the straw
// - scrolling the page drains the cup a little, and the straw "sips"
import { rng } from './render.js';

const TAU = Math.PI * 2;
const VW = 420, VH = 560;              // design box, scaled to the canvas
const BASE_X = 210, BASE_Y = 530;      // cup bottom centre in the design box
const H = 300, BOT = 76, TOP = 116;    // cup body (y grows upward as negative numbers)
const RIM_H = 16, RIM = 124, DOME_RX = 112, DOME_RY = 74;
const STRAW = { x0: 26, y0: -26, x1: 84, y1: -500, w: 20 };
const N = 40;                          // surface springs
const FULL = 0.84, DRAIN = 0.3;
const INK = '#3B1F14';
const COL = { blue: '#1FB6FF', foam: '#A8E6FF', pink: '#FF3D7F', mango: '#FFC81E', white: '#FFFDF7' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cupPath(ctx, inset = 0) {
  const b = BOT - inset, t = TOP - inset, top = -H + (inset ? 2 : 0), bot = -inset * 0.6;
  ctx.beginPath();
  ctx.moveTo(-t, top);
  ctx.lineTo(t, top);
  ctx.lineTo(b, bot - 12);
  ctx.quadraticCurveTo(b - 1, bot, b - 14, bot);
  ctx.lineTo(-b + 14, bot);
  ctx.quadraticCurveTo(-b + 1, bot, -b, bot - 12);
  ctx.closePath();
}

// Frosty crushed-ice texture, rendered once per size and blitted into the liquid.
function makeIceTexture(k) {
  const w = TOP * 2 + 20, h = H + 10;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * k);
  c.height = Math.ceil(h * k);
  const g = c.getContext('2d');
  g.scale(k, k);
  const r = rng(7);
  for (let i = 0; i < 280; i++) {
    const x = r() * w, y = r() * h, s = 0.8 + r() * 2.4;
    g.fillStyle = `rgba(255,255,255,${0.18 + r() * 0.5})`;
    g.beginPath();
    g.moveTo(x, y - s); g.lineTo(x + s * 0.8, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.8, y);
    g.fill();
  }
  g.lineWidth = 1;
  for (let i = 0; i < 52; i++) {
    const x = r() * w, y = r() * h, s = 4 + r() * 7, n = 5 + ((r() * 2) | 0), rot = r() * TAU;
    g.beginPath();
    for (let j = 0; j < n; j++) {
      const a = rot + (j / n) * TAU, d = s * (0.6 + r() * 0.5);
      g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    g.closePath();
    g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.25})`;
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.6)';
    g.stroke();
  }
  return c;
}

export function createCup(canvas, { reduced = false, onShake } = {}) {
  const ctx = canvas.getContext('2d');
  const h = new Float32Array(N), v = new Float32Array(N);
  const inner = [];   // bubbles + ice bits, cup space
  const splash = [];  // droplets, design space
  const st = {
    t: 0, tilt: 0, tiltV: 0, tiltTarget: 0, rot: 0, grav: 0,
    ang: 0, angV: 0, level: FULL, levelTarget: FULL, sip: 0,
    shake: 0, shakeX: 0, bounce: 0, offX: 0,
  };
  let scale = 1, dpr = 1, texture = null, raf = 0, last = 0, running = false, visible = true;

  const gradBlue = ctx.createLinearGradient(0, -H, 0, 0);
  gradBlue.addColorStop(0, '#4CC9FF');
  gradBlue.addColorStop(1, '#0A8FDB');
  const gradPink = ctx.createLinearGradient(0, -H * 0.5, 0, 0);
  gradPink.addColorStop(0, '#FF5C93');
  gradPink.addColorStop(1, '#D81B57');

  // Where the straw pokes out of the dome (for the little grommet).
  const strawExit = (() => {
    const cy = -H - RIM_H + 2;
    for (let t = 0; t <= 1; t += 0.002) {
      const x = STRAW.x0 + (STRAW.x1 - STRAW.x0) * t, y = STRAW.y0 + (STRAW.y1 - STRAW.y0) * t;
      if (y < cy && (x / DOME_RX) ** 2 + ((y - cy) / DOME_RY) ** 2 >= 1) return { x, y };
    }
    return { x: 0, y: cy - DOME_RY };
  })();

  /* ---------- liquid shape ---------- */

  function waveAt(x) {
    const u = clamp((x + TOP) / (2 * TOP), 0, 1) * (N - 1);
    const i = u | 0, f = u - i;
    return h[i] * (1 - f) + h[Math.min(i + 1, N - 1)] * f;
  }
  const surfaceY = (x) =>
    -st.level * H + Math.tan(st.ang) * x + waveAt(x) + Math.sin(x * 0.035 + st.t * 2.2) * 2 + Math.sin(x * 0.08 - st.t * 1.4) * 1.1;
  const boundaryY = (x, sy) =>
    Math.max(sy + 12, -st.level * H * 0.46 + Math.tan(st.ang) * 0.75 * x + waveAt(x) * 0.35 + Math.sin(x * 0.05 + st.t * 0.8) * 4 + Math.sin(x * 0.13 + 1) * 2.5);

  function toWorld(x, y) {
    const c = Math.cos(st.rot), s = Math.sin(st.rot);
    return { x: BASE_X + st.offX + st.shakeX + c * x - s * y, y: BASE_Y + st.bounce + s * x + c * y };
  }

  /* ---------- simulation ---------- */

  function step(dt) {
    st.t += dt;
    st.tiltV += ((st.tiltTarget - st.tilt) * 70 - st.tiltV * 11) * dt;
    st.tilt += st.tiltV * dt;

    st.shake = Math.max(0, st.shake - dt * 1.5);
    const sh = st.shake * st.shake;
    st.rot = st.tilt + Math.sin(st.t * 47) * 0.075 * sh;
    st.shakeX = Math.sin(st.t * 61) * 7 * sh;
    st.bounce = -Math.abs(Math.sin(st.t * 23)) * 10 * sh;
    st.offX = st.tilt * 60;

    // The surface wants to stay level with gravity; lightly damped, so it overshoots = slosh.
    const target = clamp(-st.rot + st.grav, -0.55, 0.55);
    st.angV += ((target - st.ang) * 46 - st.angV * 2.6) * dt;
    st.ang = clamp(st.ang + st.angV * dt, -0.6, 0.6);

    if (st.shake > 0.05) for (let i = 0; i < N; i++) v[i] += (Math.random() - 0.5) * st.shake * 900 * dt;
    const sub = dt / 2;
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < N; i++) {
        const l = h[i ? i - 1 : 0], r = h[i < N - 1 ? i + 1 : N - 1];
        v[i] += (-h[i] * 38 - v[i] * 1.9 + (l + r - 2 * h[i]) * 1300) * sub;
      }
      for (let i = 0; i < N; i++) h[i] = clamp(h[i] + v[i] * sub, -40, 40);
    }

    const prev = st.level;
    st.level += (st.levelTarget - st.level) * Math.min(1, dt * 2.5);
    const drained = prev - st.level;
    st.sip += ((drained > 0.0003 ? 1 : 0) - st.sip) * Math.min(1, dt * (drained > 0.0003 ? 5 : 1.6));
    if (drained > 0.0003) {
      const i = Math.round(((STRAW.x0 + TOP) / (2 * TOP)) * (N - 1));
      v[i] -= drained * 5000;
    }

    for (let i = inner.length - 1; i >= 0; i--) {
      const p = inner[i];
      p.vy -= (p.ice ? 14 : 48) * dt;
      p.y += p.vy * dt;
      p.x = clamp(p.x + (Math.sin(st.t * 7 + p.ph) * p.wob + p.vx) * dt, -TOP + 8, TOP - 8);
      p.rot += p.vr * dt;
      if (p.y < surfaceY(p.x) + p.r) inner.splice(i, 1);
    }
    for (let i = splash.length - 1; i >= 0; i--) {
      const p = splash[i];
      p.vy += 1100 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0 || p.y > VH + 30) splash.splice(i, 1);
    }
  }

  /* ---------- drawing ---------- */

  function strawShape(ghost) {
    const { x0, y0, x1, y1, w } = STRAW;
    const L = Math.hypot(x1 - x0, y1 - y0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
    rr(ctx, 0, -w / 2, L, w, w / 2);
    ctx.save();
    ctx.globalAlpha = ghost ? 0.22 : 1;
    ctx.fillStyle = COL.white;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = COL.pink;
    for (let s = -20; s < L + 20; s += 26) {
      ctx.beginPath();
      ctx.moveTo(s, -w / 2); ctx.lineTo(s + 11, -w / 2); ctx.lineTo(s + 5, w / 2); ctx.lineTo(s - 6, w / 2);
      ctx.fill();
    }
    if (!ghost && st.sip > 0.02) {
      ctx.fillStyle = 'rgba(31,182,255,.92)';
      ctx.fillRect(0, -w / 2 + 4, st.sip * L * 0.82, w - 8);
    }
    ctx.restore();
    if (!ghost) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    ctx.restore();
  }

  function polyline(xs, ys) {
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
  }

  function drawLiquid() {
    const n = 32, xs = [], sy = [], by = [];
    for (let i = 0; i <= n; i++) {
      const x = -TOP - 8 + ((2 * TOP + 16) * i) / n;
      xs.push(x);
      sy.push(surfaceY(x));
      by.push(boundaryY(x, sy[i]));
    }
    ctx.save();
    cupPath(ctx, 4.5);
    ctx.clip();

    // top layer: blue raspberry
    ctx.beginPath();
    polyline(xs, sy);
    ctx.lineTo(xs[n], 20); ctx.lineTo(xs[0], 20); ctx.closePath();
    ctx.fillStyle = gradBlue;
    ctx.fill();
    ctx.save();
    ctx.clip();

    // bottom layer: strawberry
    ctx.beginPath();
    polyline(xs, by);
    ctx.lineTo(xs[n], 20); ctx.lineTo(xs[0], 20); ctx.closePath();
    ctx.fillStyle = gradPink;
    ctx.fill();

    // crushed-ice band where the layers meet
    ctx.beginPath();
    polyline(xs, by);
    ctx.setLineDash([1, 8]);
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.stroke();
    ctx.setLineDash([]);

    if (texture) ctx.drawImage(texture, -TOP - 10 + Math.sin(st.t * 0.6) * 3 + st.ang * 16, -H - 10, TOP * 2 + 20, H + 10);
    strawShape(true);

    for (const p of inner) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.ice) {
        ctx.rotate(p.rot);
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.strokeStyle = 'rgba(59,31,20,.35)';
        ctx.lineWidth = 1.5;
        rr(ctx, -p.r, -p.r, p.r * 2, p.r * 2, 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, TAU);
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    // shiny surface line
    ctx.beginPath();
    polyline(xs, sy);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = COL.foam;
    ctx.stroke();
    ctx.beginPath();
    polyline(xs, sy.map((y) => y + 7));
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.stroke();
    ctx.restore();
  }

  function drawCupFront() {
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.moveTo(-TOP + 16, -H + 18); ctx.lineTo(-TOP + 38, -H + 18); ctx.lineTo(-BOT + 30, -22); ctx.lineTo(-BOT + 16, -22);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath();
    ctx.moveTo(-TOP + 46, -H + 18); ctx.lineTo(-TOP + 53, -H + 18); ctx.lineTo(-BOT + 41, -22); ctx.lineTo(-BOT + 36, -22);
    ctx.fill();

    ctx.save();
    ctx.translate(0, -H * 0.36);
    ctx.rotate(-0.06);
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, TAU);
    ctx.fillStyle = COL.mango;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 41, 0, TAU);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '25px "Bagel Fat One", "Arial Black", sans-serif';
    ctx.fillText('SIP &', 0, -9);
    ctx.fillText('BITE', 0, 15);
    ctx.restore();

    cupPath(ctx);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  function drawLid() {
    const cy = -H - RIM_H + 2;
    ctx.beginPath();
    ctx.ellipse(0, cy, DOME_RX, DOME_RY, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,.38)';
    ctx.fill();
    ctx.lineWidth = 5.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, cy, DOME_RX - 18, DOME_RY - 18, 0, Math.PI * 1.13, Math.PI * 1.36);
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(strawExit.x, strawExit.y + 2, 15, 6, -0.45, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();

    rr(ctx, -RIM, -H - RIM_H, RIM * 2, RIM_H + 6, 7);
    ctx.fillStyle = COL.white;
    ctx.fill();
    ctx.lineWidth = 5.5;
    ctx.stroke();
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = scale * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);

    ctx.fillStyle = 'rgba(59,31,20,.16)';
    ctx.beginPath();
    ctx.ellipse(BASE_X + st.offX * 0.6 + st.shakeX, BASE_Y + 12, 100 - Math.abs(st.rot) * 60, 12, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(BASE_X + st.offX + st.shakeX, BASE_Y + st.bounce);
    ctx.rotate(st.rot);
    cupPath(ctx);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fill();
    strawShape(false);
    drawLiquid();
    drawCupFront();
    drawLid();
    ctx.restore();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    for (const p of splash) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * Math.min(1, p.life * 1.5), 0, TAU);
      ctx.fillStyle = p.c;
      ctx.fill();
      ctx.stroke();
    }
  }

  /* ---------- loop + sizing ---------- */

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60;
    last = now;
    step(dt);
    draw();
  }
  function sync() {
    const should = visible && !document.hidden && !reduced;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    scale = rect.width / VW;
    texture = makeIceTexture(scale * dpr);
    draw();
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  document.fonts?.ready.then(draw);

  /* ---------- public controls ---------- */

  return {
    shake() {
      if (reduced) return;
      st.shake = 1;
      st.angV += (Math.random() < 0.5 ? -1 : 1) * rand(3, 6);
      for (let i = 0; i < N; i++) v[i] += (Math.random() - 0.5) * 320;
      const depth = st.level * H;
      for (let i = 0; i < 16 && inner.length < 90; i++)
        inner.push({ x: rand(-BOT + 14, BOT - 14), y: -rand(8, depth * 0.6), vx: 0, vy: -rand(30, 90), r: rand(2, 6.5), ph: rand(0, TAU), wob: rand(20, 50), rot: 0, vr: 0, ice: false });
      for (let i = 0; i < 9 && inner.length < 90; i++)
        inner.push({ x: rand(-BOT + 16, BOT - 16), y: -rand(8, depth * 0.45), vx: rand(-20, 20), vy: -rand(20, 50), r: rand(4, 8), ph: rand(0, TAU), wob: rand(5, 15), rot: rand(0, TAU), vr: rand(-5, 5), ice: true });
      const tip = toWorld(STRAW.x1, STRAW.y1);
      for (let i = 0; i < 18; i++)
        splash.push({ x: tip.x + rand(-5, 5), y: tip.y, vx: rand(-300, 300), vy: -rand(260, 640), r: rand(3, 8), c: Math.random() < 0.6 ? COL.blue : COL.pink, life: rand(0.9, 1.5) });
      for (const side of [-1, 1]) {
        const p = toWorld(side * RIM, -H - RIM_H / 2);
        for (let i = 0; i < 4; i++)
          splash.push({ x: p.x, y: p.y, vx: side * rand(60, 220), vy: -rand(120, 320), r: rand(2.5, 5), c: Math.random() < 0.5 ? COL.blue : COL.white, life: rand(0.6, 1) });
      }
      onShake?.();
    },
    // -1..1 horizontal pointer offset, and horizontal pointer velocity (px/s)
    lean(amount, velocity = 0) {
      st.tiltTarget = clamp(amount, -1, 1) * 0.16;
      st.angV += clamp(velocity, -4000, 4000) * 0.0005;
      const speed = Math.abs(velocity);
      if (speed > 1200) for (let i = 0; i < N; i += 3) v[i] += (Math.random() - 0.5) * Math.min(speed, 5000) * 0.03;
    },
    // gravity angle (radians) from device tilt
    gravity(angle) {
      const g = clamp(angle, -0.5, 0.5);
      st.angV += (g - st.grav) * 4;
      st.grav = g;
      st.tiltTarget = g * 0.25; // the cup half-stays upright in the real world, so it counter-rotates on screen
    },
    // 0..1 page scroll progress
    drain(p) {
      st.levelTarget = FULL - DRAIN * clamp(p, 0, 1);
      if (reduced) {
        st.level = st.levelTarget;
        draw();
      }
    },
  };
}

// Wires pointer / touch / device-orientation / scroll input to a cup.
export function bindCup(cup, { button, tiltButton, reduced }) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    cup.drain(max > 0 ? scrollY / max : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let dragged = false;
  button.addEventListener('click', () => {
    if (!dragged) cup.shake();
    dragged = false;
  });
  if (reduced) return;

  if (finePointer) {
    let lx = 0, lt = 0;
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      const vx = lt ? ((e.clientX - lx) / Math.max(now - lt, 8)) * 1000 : 0;
      lx = e.clientX;
      lt = now;
      const r = button.getBoundingClientRect();
      cup.lean((e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5), vx);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => cup.lean(0));
  }

  // touch-drag sideways to tilt (vertical drags still scroll the page: touch-action: pan-y)
  let sx = null, px = 0, pt = 0;
  button.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    sx = px = e.clientX;
    pt = performance.now();
    dragged = false;
  });
  button.addEventListener('pointermove', (e) => {
    if (sx === null) return;
    const now = performance.now();
    const vx = ((e.clientX - px) / Math.max(now - pt, 8)) * 1000;
    px = e.clientX;
    pt = now;
    if (Math.abs(e.clientX - sx) > 10) dragged = true;
    cup.lean((e.clientX - sx) / 110, vx);
  });
  const release = () => {
    if (sx === null) return;
    sx = null;
    cup.lean(0);
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', () => { release(); dragged = false; });

  // device tilt: liquid stays level with real gravity
  if (finePointer || typeof DeviceOrientationEvent === 'undefined') return;
  const onOrient = (e) => {
    if (e.gamma == null) return;
    const angle = screen.orientation?.angle || 0;
    const roll = angle === 90 ? -e.beta : angle === 270 ? e.beta : e.gamma;
    cup.gravity((-roll * Math.PI) / 180);
  };
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS: needs a tap before it will share motion data
    tiltButton.hidden = false;
    tiltButton.addEventListener('click', async () => {
      try {
        if ((await DeviceOrientationEvent.requestPermission()) === 'granted') {
          addEventListener('deviceorientation', onOrient);
          tiltButton.textContent = 'Tilt is on!';
          tiltButton.disabled = true;
        } else {
          tiltButton.textContent = 'Drag the cup instead';
        }
      } catch {
        tiltButton.hidden = true;
      }
    });
  } else {
    addEventListener('deviceorientation', onOrient);
  }
}
