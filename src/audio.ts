// Web Audio synth: four instrument voices, metronome click, simple drums. No samples to download.
import { freq } from './music';

export type Timbre = 'piano' | 'guitar' | 'strings' | 'sine';
let ctx: AudioContext | null = null, master: GainNode, metGain: GainNode;
let vol = 0.8, metVol = 0.7, sfxOn = true;
const live = new Set<AudioScheduledSourceNode>();
/** Audio-clock time until which the app itself is sounding a prompt (the mic ignores input until then). */
export let busyUntil = 0;

export function ac(): AudioContext {
  if (!ctx) {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    ctx = new C() as AudioContext;
    master = ctx.createGain(); master.gain.value = vol;
    // Compress, then add make-up gain: single notes come out clearly on small speakers and chords do not clip.
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const makeup = ctx.createGain(); makeup.gain.value = 1.8;
    master.connect(comp); comp.connect(makeup); makeup.connect(ctx.destination);
    metGain = ctx.createGain(); metGain.gain.value = metVol; metGain.connect(ctx.destination);
  }
  // 'suspended' before the first tap; iOS also uses 'interrupted' after a call, a tab switch or a microphone change
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}
export const now = () => ac().currentTime;
/** Where other sound sources (the teaching synth) plug in, so they share the volume setting and the limiter. */
export const synthOut = (): AudioNode => { ac(); return master; };
/** Called by stopAll, so anything else making sound stops with it. */
export const stopHooks: (() => void)[] = [];

// ---- getting sound out on phones ----
// 1. Browsers only start audio from a tap, so every tap, click and key press makes sure the context is running.
// 2. On iPhone and iPad, Web Audio obeys the ring/silent switch unless the page counts as media playback.
//    Newer Safari lets us say so directly; older Safari needs a silent <audio> element playing alongside.
let silentEl: HTMLAudioElement | null = null, micActive = false;
export const isIOS = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
function applySession() {
  // 'playback' ignores the silent switch but cannot record; 'play-and-record' is needed while the microphone is on.
  try { const s = (navigator as any).audioSession; if (s) { const want = micActive ? 'play-and-record' : 'playback'; if (s.type !== want) s.type = want; return true; } } catch { /* unsupported */ }
  return false;
}
/** Tell the audio system whether the microphone is in use, so playback keeps coming out of the speaker. */
export function setMicActive(on: boolean) { micActive = on; applySession(); }
/**
 * Start again with a fresh audio context. On iPhone and iPad, turning the microphone on or off changes the
 * audio hardware underneath a running context, which can leave it silent; a new context picks up the new route.
 */
export function resetAudio() {
  if (!ctx) return;
  live.clear(); busyUntil = 0;
  try { ctx.close().catch(() => {}); } catch { /* already closed */ }
  ctx = null;
}
function silentWavUrl(): string {
  const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
export function unlockAudio() {
  try {
    const c = ac(); if (c.state !== 'running') c.resume().catch(() => {});
    if (applySession()) return;
    if (!isIOS() || micActive) return;
    if (!silentEl) { silentEl = new Audio(silentWavUrl()); silentEl.loop = true; silentEl.setAttribute('playsinline', ''); }
    if (silentEl.paused) silentEl.play().catch(() => {});
  } catch { /* no audio available */ }
}
export function installAudioUnlock() {
  ['touchend', 'pointerup', 'click', 'keydown'].forEach((e) => window.addEventListener(e, unlockAudio, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) silentEl?.pause(); else if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
}
/** 'running' when sound can play. */
export const audioState = () => (ctx ? ctx.state : 'not started');
export function setVolumes(v: number, m: number, fx = true) { vol = v; metVol = m; sfxOn = fx; if (ctx) { master.gain.value = v; metGain.gain.value = m; } }
function track(n: AudioScheduledSourceNode) { live.add(n); n.onended = () => live.delete(n); }
export function stopAll() { stopHooks.forEach((f) => f()); live.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }); live.clear(); busyUntil = 0; }

export function playNote(m: number, when = now(), dur = 0.8, timbre: Timbre = 'piano', vel = 0.7, prompt = false, out?: AudioNode) {
  const c = ac(), f = freq(m), g = c.createGain(); g.connect(out ?? master);
  const t0 = Math.max(when, c.currentTime), end = t0 + dur;
  const osc = (type: OscillatorType, mult: number, gain: number, detune = 0) => {
    const o = c.createOscillator(), og = c.createGain();
    o.type = type; o.frequency.value = f * mult; o.detune.value = detune; og.gain.value = gain;
    o.connect(og); track(o); return { o, og };
  };
  let tail = 0.25;
  if (timbre === 'piano') {
    // Phone and laptop speakers barely reproduce anything below about 250 Hz, so low notes lean on their
    // upper harmonics: the ear fills in the missing fundamental and still hears the right pitch.
    const low = Math.max(0, Math.min(1, (66 - m) / 24));
    const a = osc('triangle', 1, 0.7), b = osc('sine', 2, 0.22 + 0.4 * low), d = osc('sine', 3, 0.08 + 0.32 * low);
    const hi = [osc('sine', 4, 0.03 + 0.22 * low), osc('sine', 5, 0.12 * low)];
    [a, b, d, ...hi].forEach((x) => x.og.connect(g));
    hi.forEach((x) => { x.o.start(Math.max(when, c.currentTime)); x.o.stop(Math.max(when, c.currentTime) + dur + 0.3); });
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vel, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.35, t0 + 0.35); g.gain.exponentialRampToValueAtTime(vel * 0.12, Math.max(end, t0 + 0.4));
    g.gain.exponentialRampToValueAtTime(0.0008, end + tail);
    [a, b, d].forEach((x) => { x.o.start(t0); x.o.stop(end + tail + 0.02); });
  } else if (timbre === 'guitar') {
    const a = osc('sawtooth', 1, 0.5), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t0); lp.frequency.exponentialRampToValueAtTime(700, t0 + 0.5);
    a.og.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vel, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, Math.max(end, t0 + 0.5) + tail);
    a.o.start(t0); a.o.stop(Math.max(end, t0 + 0.5) + tail + 0.02);
  } else if (timbre === 'strings') {
    const a = osc('sawtooth', 1, 0.3, -6), b = osc('sawtooth', 1, 0.3, 6), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1900; a.og.connect(lp); b.og.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vel * 0.8, t0 + 0.08); g.gain.setValueAtTime(vel * 0.8, end); g.gain.linearRampToValueAtTime(0, end + 0.18);
    [a, b].forEach((x) => { x.o.start(t0); x.o.stop(end + 0.2); }); tail = 0.2;
  } else {
    const a = osc('sine', 1, 0.8); a.og.connect(g);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vel, t0 + 0.01); g.gain.setValueAtTime(vel, end); g.gain.linearRampToValueAtTime(0, end + 0.06);
    a.o.start(t0); a.o.stop(end + 0.08); tail = 0.08;
  }
  if (prompt) busyUntil = Math.max(busyUntil, end + 0.15);
}
/** The beat. A short, soft piano note (not a beep): a higher one on the first beat of the bar. Uses the metronome volume. */
export function click(when: number, accent = false) {
  ac();
  // While the microphone listens, the beat moves high and very short so it is not mistaken for a note you played.
  if (micActive) playNote(accent ? 96 : 91, when, 0.03, 'piano', accent ? 0.4 : 0.28, false, metGain);
  else playNote(accent ? 72 : 67, when, 0.09, 'piano', accent ? 0.55 : 0.36, false, metGain);
}
/** Arcade backing, also piano: a low note on the beat, a light high one off it. */
export function drum(when: number, kind: 'kick' | 'hat') {
  if (kind === 'kick') playNote(48, when, 0.1, 'piano', 0.4); else playNote(84, when, 0.05, 'piano', 0.1);
}
/** Short interface sounds: a right answer, a win, a lost life. Off when sound effects are disabled. */
export function sfx(kind: 'ok' | 'win' | 'life') {
  if (!sfxOn) return;
  try {
    const t = now() + 0.01;
    if (kind === 'ok') { playNote(84, t, 0.08, 'piano', 0.3); playNote(88, t + 0.08, 0.14, 'piano', 0.3); }
    else if (kind === 'win') [72, 76, 79, 84].forEach((m, i) => playNote(m, t + i * 0.09, 0.16, 'piano', 0.34));
    else { playNote(64, t, 0.16, 'piano', 0.4); playNote(59, t + 0.14, 0.24, 'piano', 0.4); }
  } catch { /* audio not ready */ }
}
export interface SeqEv { t: number; d: number; midis: number[] } // beats
/** Schedule a sequence; returns its length in seconds. `prompt` mutes the mic while it sounds. */
export function playSeq(evs: SeqEv[], tempo: number, timbre: Timbre = 'piano', delay = 0.05, prompt = true): number {
  // A just-started audio device can swallow the first few hundred milliseconds, so give it a moment.
  const c = ac(), warm = c.currentTime < 0.35 ? 0.35 - c.currentTime : 0;
  delay += warm;
  const spb = 60 / tempo, t0 = c.currentTime + delay; let end = 0;
  for (const e of evs) {
    e.midis.forEach((m) => playNote(m, t0 + e.t * spb, Math.max(0.12, e.d * spb * 0.95), timbre, e.midis.length > 2 ? 0.45 : 0.65, prompt));
    end = Math.max(end, (e.t + e.d) * spb);
  }
  return end + delay;
}
