// Tiny synthesized sounds (no audio files): ice rattling in a cup + soda fizz.
// Muted by default; the AudioContext is only created after the visitor turns sound on.
let ac = null;
let noise = null;
let on = false;

function ensure() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function burst(t, { freq, q = 8, gain = 0.3, dur = 0.05, type = 'bandpass' }) {
  const src = ac.createBufferSource();
  src.buffer = noise;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.03);
}

export const sound = {
  get on() {
    return on;
  },
  set(value) {
    on = value;
    if (on) ensure();
  },
  shake() {
    if (!on || !ensure()) return;
    const t = ac.currentTime;
    for (let i = 0; i < 9; i++)
      burst(t + i * 0.045 + Math.random() * 0.025, { freq: 2200 + Math.random() * 3500, q: 9, gain: 0.35 * (1 - i / 11), dur: 0.045 });
    burst(t + 0.05, { freq: 6000, q: 0.7, gain: 0.05, dur: 0.7, type: 'highpass' });
  },
};
