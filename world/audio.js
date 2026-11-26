// Synthesized sound, off until the visitor turns it on: soft steps, a toy squeak on landing,
// chimes, birdsong and fire crackle. No audio files.
let ac = null, master = null, soundOn = false;
function ensureAudio() {
  if (ac) return;
  ac = new AudioContext(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const wind = ac.createBufferSource(); wind.buffer = buf; wind.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
  const wg = ac.createGain(); wg.gain.value = 0.04;
  const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.025; lfo.connect(lg).connect(wg.gain); lfo.start();
  wind.connect(lp).connect(wg).connect(master); wind.start();
  ac._noise = buf;
}
function tone(freq, dur, type = 'sine', vol = 0.06, slide = 0, delay = 0) {
  if (!soundOn || !ac) return;
  const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(freq, n); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), n + dur);
  g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol, n + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
  o.connect(g).connect(master); o.start(n); o.stop(n + dur + 0.02);
}
function noise(dur, freq, vol, q = 1.2) {
  if (!soundOn || !ac) return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), n = ac.currentTime;
  s.buffer = ac._noise; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
  s.connect(f).connect(g).connect(master); s.start(n, Math.random()); s.stop(n + dur);
}
export const sfx = {
  step: () => noise(0.06, 380 + Math.random() * 120, 0.09, 0.8),
  squeak: () => { tone(900, 0.09, 'sine', 0.06, 600); tone(1400, 0.1, 'sine', 0.05, -500, 0.08); },
  land: () => { tone(150, 0.2, 'sine', 0.2, -70); noise(0.1, 300, 0.12); sfx.squeak(); },
  jump: () => tone(420, 0.16, 'sine', 0.06, 520),
  pop: () => tone(520 + Math.random() * 200, 0.12, 'sine', 0.05, -260),
  blip: () => tone(640 + Math.random() * 80, 0.035, 'triangle', 0.03),
  chime: () => { tone(784, 0.3, 'triangle', 0.07); tone(1175, 0.4, 'triangle', 0.06, 0, 0.09); },
  open: () => { tone(392, 0.14, 'triangle', 0.07); tone(523, 0.14, 'triangle', 0.07, 0, 0.07); tone(784, 0.3, 'triangle', 0.07, 0, 0.14); },
  close: () => tone(523, 0.14, 'triangle', 0.05, -200),
  crackle: () => noise(0.03, 2000 + Math.random() * 2000, 0.05, 3),
};
function birds() {
  if (soundOn && ac) { const f = 2400 + Math.random() * 900, n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) tone(f + i * 120, 0.07, 'sine', 0.018, 700, i * 0.11); }
  setTimeout(birds, 2500 + Math.random() * 5000);
}
setTimeout(birds, 3000);
export const isSoundOn = () => soundOn;
export function toggleSound() {
  ensureAudio(); soundOn = !soundOn;
  master.gain.setTargetAtTime(soundOn ? 0.9 : 0, ac.currentTime, 0.15);
  if (ac.state === 'suspended') ac.resume();
  if (soundOn) sfx.chime();
  return soundOn;
}
