import { it, expect } from 'vitest';
import { Engine, mkPatch } from '../src/synth/dsp';
import { waveform, spectrum, distance } from '../src/synth/analysis';
const rms = (b: Float32Array, a: number, z: number) => { let s = 0; for (let i = a; i < z; i++) s += b[i] * b[i]; return Math.sqrt(s / (z - a)); };
it('a looped phrase sounds again on the second pass', () => {
  const sr = 44100, e = new Engine(sr), out = new Float32Array(sr * 4); e.setPatch(mkPatch()); e.setSeq([{ t: 0, d: 1.2, note: 48 }], 1.9); e.render(out, out, out.length);

  expect(rms(out, 2.1 * sr, 2.9 * sr)).toBeGreaterThan(0.05);
});
it('arp at 1/8 and 120 bpm plays 4 notes a second', () => {
  const sr = 44100, e = new Engine(sr), out = new Float32Array(sr * 2); e.setPatch(mkPatch({ arp: 1, arpr: 1, bpm: 120, ad: 0.05, as: 0, ar: 0.02 })); [48, 55, 64].forEach((n) => e.noteOn(n)); e.render(out, out, out.length);
  let onsets = 0, prev = 0; for (let i = 0; i + 441 < out.length; i += 441) { const r = rms(out, i, i + 441); if (r > 0.05 && prev <= 0.05) onsets++; prev = r; }
  expect(onsets).toBeGreaterThanOrEqual(7);
});
it('a quiet sound draws a smaller wave than a loud one', () => {
  const q = Math.max(...waveform(mkPatch({ o1w: 0, vol: 0.25 })).map(Math.abs)), l = Math.max(...waveform(mkPatch({ o1w: 0, vol: 0.8 })).map(Math.abs));
  expect(q).toBeLessThan(l * 0.6);
});
it('the six FM algorithms make six different sounds from the same four operators', () => {
  const base = { o1w: 0, fmi: 2, f3i: 2, f3r: 2, f4i: 1.5, f4r: 3 }, sounds = [0, 1, 2, 3, 4, 5].map((fma) => mkPatch({ ...base, fma }));
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) expect(distance(sounds[i], sounds[j]), `algorithms ${i} and ${j}`).toBeGreaterThan(0.01);
  expect(Math.max(...spectrum(sounds[0]))).toBeGreaterThan(0.5);
});
it('with operators 3 and 4 silent, the algorithm choice between stack and the later ones changes nothing', () => {
  const a = mkPatch({ o1w: 0, fmi: 2.5, fma: 0 }); for (const fma of [2, 3, 4, 5]) expect(distance(a, mkPatch({ o1w: 0, fmi: 2.5, fma }))).toBeLessThan(0.001);
});
