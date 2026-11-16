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
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    metGain = ctx.createGain(); metGain.gain.value = metVol; metGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
export const now = () => ac().currentTime;
export function setVolumes(v: number, m: number, fx = true) { vol = v; metVol = m; sfxOn = fx; if (ctx) { master.gain.value = v; metGain.gain.value = m; } }
function track(n: AudioScheduledSourceNode) { live.add(n); n.onended = () => live.delete(n); }
export function stopAll() { live.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }); live.clear(); busyUntil = 0; }

export function playNote(m: number, when = now(), dur = 0.8, timbre: Timbre = 'piano', vel = 0.7, prompt = false) {
  const c = ac(), f = freq(m), g = c.createGain(); g.connect(master);
  const t0 = Math.max(when, c.currentTime), end = t0 + dur;
  const osc = (type: OscillatorType, mult: number, gain: number, detune = 0) => {
    const o = c.createOscillator(), og = c.createGain();
    o.type = type; o.frequency.value = f * mult; o.detune.value = detune; og.gain.value = gain;
    o.connect(og); track(o); return { o, og };
  };
  let tail = 0.25;
  if (timbre === 'piano') {
    const a = osc('triangle', 1, 0.7), b = osc('sine', 2, 0.22), d = osc('sine', 3, 0.08);
    [a, b, d].forEach((x) => x.og.connect(g));
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
export function click(when: number, accent = false) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1600 : 1100;
  g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  o.connect(g); g.connect(metGain); track(o); o.start(when); o.stop(when + 0.06);
}
export function drum(when: number, kind: 'kick' | 'hat') {
  const c = ac(), g = c.createGain(); g.connect(master);
  if (kind === 'kick') {
    const o = c.createOscillator(); o.frequency.setValueAtTime(140, when); o.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    g.gain.setValueAtTime(0.6, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    o.connect(g); track(o); o.start(when); o.stop(when + 0.2);
  } else {
    const o = c.createOscillator(), hp = c.createBiquadFilter(); o.type = 'square'; o.frequency.value = 6500; hp.type = 'highpass'; hp.frequency.value = 6000;
    g.gain.setValueAtTime(0.08, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
    o.connect(hp); hp.connect(g); track(o); o.start(when); o.stop(when + 0.05);
  }
}
/** Short interface sounds: a right answer, a win, a lost life. Off when sound effects are disabled. */
export function sfx(kind: 'ok' | 'win' | 'life') {
  if (!sfxOn) return;
  try {
    const t = now() + 0.01;
    if (kind === 'ok') { playNote(88, t, 0.07, 'sine', 0.22); playNote(93, t + 0.07, 0.1, 'sine', 0.22); }
    else if (kind === 'win') [72, 76, 79, 84].forEach((m, i) => playNote(m, t + i * 0.09, 0.14, 'sine', 0.28));
    else { playNote(52, t, 0.16, 'sine', 0.4); playNote(47, t + 0.14, 0.22, 'sine', 0.4); }
  } catch { /* audio not ready */ }
}
export interface SeqEv { t: number; d: number; midis: number[] } // beats
/** Schedule a sequence; returns its length in seconds. `prompt` mutes the mic while it sounds. */
export function playSeq(evs: SeqEv[], tempo: number, timbre: Timbre = 'piano', delay = 0.05, prompt = true): number {
  const spb = 60 / tempo, t0 = now() + delay; let end = 0;
  for (const e of evs) {
    e.midis.forEach((m) => playNote(m, t0 + e.t * spb, Math.max(0.12, e.d * spb * 0.95), timbre, e.midis.length > 2 ? 0.45 : 0.65, prompt));
    end = Math.max(end, (e.t + e.d) * spb);
  }
  return end + delay;
}
