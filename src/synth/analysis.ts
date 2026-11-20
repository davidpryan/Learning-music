// Offline measurements of a patch: its spectrum and waveform for pictures, and a few features for grading recipes.
import { Patch, SeqNote, renderOffline } from './dsp';

/** In-place radix-2 FFT; returns magnitudes of the first half. */
export function fftMag(x: Float32Array): Float32Array {
  const n = x.length, re = Float32Array.from(x), im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] *= 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
  const out = new Float32Array(n / 2); for (let i = 0; i < n / 2; i++) out[i] = Math.hypot(re[i], im[i]) / (n / 4); return out;
}
export const HOLD: SeqNote[] = [{ t: 0, d: 1.2, note: 60 }];
const SR = 22050, N = 4096, cache = new Map<string, any>();
export const clearAnalysis = () => cache.clear();
const memo = <T,>(key: string, f: () => T): T => { if (!cache.has(key)) { if (cache.size > 300) cache.clear(); cache.set(key, f()); } return cache.get(key); };
const keyOf = (p: Patch, seq: SeqNote[]) => JSON.stringify(p) + JSON.stringify(seq);
const dry = (p: Patch): Patch => ({ ...p, dly: 0, rev: 0 });

/** Level in each of `bins` log-spaced bands from 40 Hz to 10 kHz, 0 to 1 (a 60 dB window), taken while the note is held. */
export function spectrum(p: Patch, seq: SeqNote[] = HOLD, bins = 56): number[] {
  return memo('s' + bins + keyOf(p, seq), () => {
    const at = Math.min(0.5, (seq[0]?.d ?? 1) * 0.5), buf = renderOffline(dry(p), seq, at + N / SR + 0.05, SR), mag = fftMag(buf.subarray(Math.floor(at * SR), Math.floor(at * SR) + N));
    const out: number[] = [];
    for (let b = 0; b < bins; b++) {
      const f0 = 40 * Math.pow(250, b / bins), f1 = 40 * Math.pow(250, (b + 1) / bins), i0 = Math.max(1, Math.floor((f0 * N) / SR)), i1 = Math.max(i0 + 1, Math.ceil((f1 * N) / SR));
      let m = 0; for (let i = i0; i < i1 && i < mag.length; i++) m = Math.max(m, mag[i]);
      out.push(Math.min(1, Math.max(0, 1 + (20 * Math.log10(m + 1e-9)) / 60)));
    }
    // Widen each peak by one band so harmonics read as humps and the overall outline is easy to follow.
    return out.map((_, i) => Math.max(out[i], 0.85 * Math.max(out[i - 1] ?? 0, out[i + 1] ?? 0)));
  });
}
/** Two cycles of the held waveform, -1 to 1. */
export function waveform(p: Patch, seq: SeqNote[] = HOLD, points = 160): number[] {
  return memo('w' + points + keyOf(p, seq), () => {
    const sr = 44100, note = seq[0]?.note ?? 60, hz = 440 * Math.pow(2, (note - 69) / 12), per = sr / hz, at = Math.min(0.4, (seq[0]?.d ?? 1) * 0.5), buf = renderOffline(dry({ ...p, uni: 1, l1p: 0 }), seq, at + (3 * per) / sr + 0.05, sr);
    let st = Math.floor(at * sr); for (let i = st; i < st + per; i++) if (buf[i] <= 0 && buf[i + 1] > 0) { st = i; break; }
    // Loud sounds fill the picture; quiet ones are drawn smaller, so loudness can be seen.
    let pk = 0.3; for (let i = 0; i < 2 * per; i++) pk = Math.max(pk, Math.abs(buf[st + i] || 0));
    return Array.from({ length: points }, (_, i) => (buf[st + Math.floor((i / points) * 2 * per)] || 0) / pk);
  });
}
/** Loudness over time for one note: the shape the amp envelope makes. */
export function loudness(p: Patch, seq: SeqNote[], seconds: number, points = 120): number[] {
  return memo('l' + points + seconds + keyOf(p, seq), () => {
    const buf = renderOffline(dry(p), seq, seconds, SR), hop = Math.floor(buf.length / points), out: number[] = [];
    for (let i = 0; i < points; i++) { let m = 0; for (let j = 0; j < hop; j++) m = Math.max(m, Math.abs(buf[i * hop + j])); out.push(m); }
    const pk = Math.max(0.05, ...out); return out.map((v) => v / pk);
  });
}
export interface Features { centroid: number; attack: number; sustain: number; tail: number; level: number; low: number }
/** Measured from a 0.8 s note followed by 0.8 s of silence. */
export function features(p: Patch, note = 60): Features {
  return memo('f' + note + JSON.stringify(p), () => {
    const buf = renderOffline(p, [{ t: 0, d: 0.8, note }], 1.6, SR), env: number[] = [], hop = 220;
    for (let i = 0; i + hop <= buf.length; i += hop) { let m = 0; for (let j = 0; j < hop; j++) m += buf[i + j] * buf[i + j]; env.push(Math.sqrt(m / hop)); }
    const held = env.slice(0, Math.floor((0.8 * SR) / hop)), pk = Math.max(1e-6, ...held), ai = held.findIndex((v) => v >= 0.8 * pk);
    const at = (t: number) => env[Math.min(env.length - 1, Math.floor((t * SR) / hop))];
    const mag = fftMag(buf.subarray(Math.floor(0.15 * SR), Math.floor(0.15 * SR) + N)); let num = 0, den = 0, low = 0, tot = 0;
    for (let i = 1; i < mag.length; i++) { const f = (i * SR) / N, e = mag[i] * mag[i]; num += f * mag[i]; den += mag[i]; tot += e; if (f < 150) low += e; }
    return { centroid: den > 1e-9 ? num / den : 0, attack: (ai * hop) / SR, sustain: at(0.7) / pk, tail: at(1.1) / pk, level: pk, low: tot > 1e-12 ? low / tot : 0 };
  });
}
/** How different two patches sound, 0 (identical) upwards: mean spectral and loudness-shape difference. */
export function distance(a: Patch, b: Patch, seq: SeqNote[] = HOLD): number {
  const sa = spectrum(a, seq), sb = spectrum(b, seq), la = loudness(a, seq, 2, 60), lb = loudness(b, seq, 2, 60);
  let d = 0; for (let i = 0; i < sa.length; i++) d += Math.abs(sa[i] - sb[i]); let e = 0; for (let i = 0; i < la.length; i++) e += Math.abs(la[i] - lb[i]);
  return d / sa.length + e / la.length;
}
