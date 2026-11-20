import { describe, it, expect } from 'vitest';
import { mkPatch, renderOffline, norm, denorm, PARAMS, fmt } from '../src/synth/dsp';
import { fftMag, features, spectrum } from '../src/synth/analysis';

const peakHz = (buf: Float32Array, sr: number) => { const m = fftMag(buf); let bi = 1; for (let i = 1; i < m.length; i++) if (m[i] > m[bi]) bi = i; return (bi * sr) / buf.length; };
describe('synth engine', () => {
  it('plays the right pitch', () => {
    const sr = 44100, buf = renderOffline(mkPatch({ o1w: 0 }), [{ t: 0, d: 1, note: 69 }], 0.6, sr);
    expect(Math.abs(peakHz(buf.subarray(8192, 8192 + 16384), sr) - 440)).toBeLessThan(4);
  });
  it('stays finite and within range for every parameter at both extremes', () => {
    for (const d of PARAMS) for (const v of [d.min, d.max]) {
      const buf = renderOffline(mkPatch({ [d.id]: v, o2lvl: 0.5 }), [{ t: 0, d: 0.2, note: 48 }, { t: 0.1, d: 0.2, note: 55 }], 0.4, 22050);
      let pk = 0; for (const x of buf) { expect(Number.isFinite(x)).toBe(true); pk = Math.max(pk, Math.abs(x)); }
      expect(pk, d.id).toBeLessThanOrEqual(1.25);
    }
  });
  it('low-pass cutoff removes highs', () => {
    expect(features(mkPatch({ cut: 400 })).centroid).toBeLessThan(features(mkPatch({ cut: 6000 })).centroid * 0.5);
  });
  it('attack and release shape the loudness', () => {
    expect(features(mkPatch({ aa: 0.4 })).attack).toBeGreaterThan(features(mkPatch({ aa: 0.005 })).attack + 0.15);
    expect(features(mkPatch({ ar: 2 })).tail).toBeGreaterThan(features(mkPatch({ ar: 0.02 })).tail + 0.2);
  });
  it('every engine makes sound', () => { for (let e = 0; e < 5; e++) expect(features(mkPatch({ eng: e })).level, 'engine ' + e).toBeGreaterThan(0.02); });
  it('norm and denorm are inverses and labels format', () => {
    for (const d of PARAMS) { for (const n of [0, 0.5, 1]) expect(Math.abs(norm(d.id, denorm(d.id, n)) - n)).toBeLessThan(d.opts || ['o1oct', 'o2oct', 'o2semi', 'uni', 'ah', 'bend'].includes(d.id) ? 0.51 : 1e-6); expect(fmt(d.id, d.def).length).toBeGreaterThan(0); }
  });
  it('spectrum has the fundamental', () => { const s = spectrum(mkPatch({ o1w: 0 })); expect(Math.max(...s)).toBeGreaterThan(0.7); });
});
