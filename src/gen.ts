// Rule-based generator for unseen reading material (see the plan's phrase generator table).
import { Rng, key, Key, keyScale, midi, Pitch, pick, rint, diatonic, chordSym, chordTones, mulberry } from './music';
import { Passage, PNote, StaffP } from './passage';

type Pat = number[]; // beats; negative = rest
const P44: Record<number, Pat[]> = {
  1: [[1, 1, 1, 1], [2, 2], [2, 1, 1], [1, 1, 2], [1, 2, 1], [4]],
  2: [[3, 1], [1, 1, 1, -1], [2, -1, 1], [1, -1, 1, 1]],
  3: [[1, 0.5, 0.5, 1, 1], [0.5, 0.5, 1, 2], [1, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 1, 1], [2, -2], [0.5, 0.5, 1, 0.5, 0.5, 1]],
  5: [[1.5, 0.5, 1, 1], [1.5, 0.5, 2], [1, 1, 1.5, 0.5], [2, 1.5, 0.5]],
  6: [[0.25, 0.25, 0.25, 0.25, 1, 2], [0.5, 0.25, 0.25, 1, 1, 1], [1, 0.5, 0.25, 0.25, 2], [0.5, 1, 0.5, 1, 1], [0.5, 1, 0.5, 2]],
};
const P34: Record<number, Pat[]> = {
  2: [[1, 1, 1], [2, 1], [3], [1, 2]],
  3: [[1, 0.5, 0.5, 1], [0.5, 0.5, 1, 1], [2, -1]],
  5: [[1.5, 0.5, 1]],
  6: [[0.25, 0.25, 0.25, 0.25, 1, 1], [0.5, 1, 0.5, 1]],
};
const P68: Record<number, Pat[]> = { 5: [[1.5, 1.5], [0.5, 0.5, 0.5, 1.5], [1, 0.5, 1.5], [1.5, 1, 0.5], [0.5, 0.5, 0.5, 0.5, 0.5, 0.5], [1, 0.5, 1, 0.5], [3]] };
export function patterns(level: number, time: [number, number]): Pat[] {
  const src = time[1] === 8 ? P68 : time[0] === 3 ? P34 : P44;
  const out: Pat[] = [];
  for (const l of Object.keys(src).map(Number)) if (l <= level) out.push(...src[l]);
  return out.length ? out : (src[Math.min(...Object.keys(src).map(Number))] ?? P44[1]);
}
const finalBar = (time: [number, number]): Pat => (time[1] === 8 ? [3] : time[0] === 3 ? [3] : [4]);

export interface LevelSpec { keys: string[]; times: [number, number][]; lo: number; hi: number; leap: number; bars: number[]; tempo: number; mode: 'rh' | 'onehand' | 'rhythm' | 'five' | 'alt' | 'held' | 'broken' | 'lead' }
export const LEVELS: Record<number, LevelSpec> = {
  1: { keys: ['C'], times: [[4, 4]], lo: 60, hi: 67, leap: 1, bars: [4], tempo: 60, mode: 'rh' },
  2: { keys: ['C', 'G'], times: [[4, 4], [3, 4]], lo: 60, hi: 72, leap: 2, bars: [4], tempo: 60, mode: 'onehand' },
  3: { keys: ['C'], times: [[4, 4], [3, 4]], lo: 71, hi: 71, leap: 0, bars: [4], tempo: 66, mode: 'rhythm' },
  4: { keys: ['C', 'G', 'F'], times: [[4, 4], [3, 4]], lo: 0, hi: 0, leap: 4, bars: [4, 8], tempo: 66, mode: 'five' },
  5: { keys: ['C', 'G', 'F', 'D', 'Bb', 'Am', 'Dm'], times: [[4, 4], [3, 4], [6, 8]], lo: 60, hi: 72, leap: 5, bars: [8], tempo: 72, mode: 'alt' },
  6: { keys: ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'Am', 'Dm', 'Em', 'Gm'], times: [[4, 4], [3, 4], [6, 8]], lo: 60, hi: 81, leap: 7, bars: [8], tempo: 72, mode: 'held' },
  7: { keys: ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'E', 'Ab', 'Am', 'Dm', 'Em', 'Gm', 'Bm', 'Cm'], times: [[4, 4], [3, 4], [6, 8]], lo: 60, hi: 81, leap: 7, bars: [8, 16], tempo: 80, mode: 'broken' },
  8: { keys: ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'E', 'Ab', 'Am', 'Dm', 'Em', 'Gm', 'Bm', 'Cm'], times: [[4, 4], [3, 4]], lo: 60, hi: 81, leap: 7, bars: [8, 16], tempo: 80, mode: 'lead' },
};
const SKEL: Record<number, number[]> = { 1: [0], 2: [0, 4], 4: [0, 3, 4, 0], 8: [0, 5, 3, 4, 0, 3, 4, 0], 16: [0, 5, 3, 4, 0, 3, 4, 4, 0, 5, 3, 4, 0, 3, 4, 0] };
const mod7 = (d: number) => ((d % 7) + 7) % 7;
/** Scale degree index (0 = tonic in octave 4) to a pitch. In minor, the 7th is raised over a V chord. */
export function degPitch(k: Key, d: number, raise7 = false): Pitch {
  const s = keyScale(k)[mod7(d)], p = { ...s, o: s.o + Math.floor(d / 7) };
  if (k.minor && raise7 && mod7(d) === 6) p.a += 1;
  return p;
}
const recent: number[] = [];

export interface GenOpts { key?: string; time?: [number, number]; bars?: number; hand?: 'rh' | 'lh'; mode?: LevelSpec['mode']; tempo?: number; lo?: number; hi?: number }
export function genRhythm(level: number, r: Rng, bars: number, time: [number, number]): PNote[] {
  const pats = patterns(level, time), out: PNote[] = [];
  for (let b = 0; b < bars; b++) {
    let pat = b === bars - 1 ? (bars > 1 ? finalBar(time) : pick(r, pats)) : pick(r, pats);
    if (b === 0 && pat[0] < 0) pat = pats[0];
    for (const d of pat) out.push(d < 0 ? { p: [], d: -d, rest: true } : { p: [{ l: 6, a: 0, o: 4 }], d });
  }
  return out;
}

export function genPhrase(level: number, r: Rng, o: GenOpts = {}): Passage {
  const L = LEVELS[Math.min(8, Math.max(1, level))];
  const mode = o.mode ?? L.mode;
  const time = o.time ?? pick(r, L.times), bars = o.bars ?? pick(r, L.bars), kname = o.key ?? pick(r, L.keys), k = key(kname);
  const tempo = o.tempo ?? L.tempo;
  if (mode === 'rhythm') return { key: 'C', time, tempo, staves: [{ clef: 'percussion', notes: genRhythm(Math.max(level, 1), r, bars, time) }] };
  const skel = SKEL[bars] ?? Array.from({ length: bars }, (_, i) => (i === bars - 1 ? 0 : [0, 3, 4, 5][i % 4]));
  const pats = patterns(level, time);
  const lh = mode === 'onehand' ? (o.hand ? o.hand === 'lh' : r() < 0.4) : mode === 'five' ? (o.hand ? o.hand === 'lh' : r() < 0.4) : false;
  // candidate degrees
  let lo = o.lo ?? L.lo, hi = o.hi ?? L.hi;
  if (mode === 'five') { const t = midi(k.tonic) > 65 ? midi(k.tonic) - 12 : midi(k.tonic); lo = t; hi = t + 7; }
  if (mode === 'alt' || mode === 'lead' || mode === 'held' || mode === 'broken') { const t = midi(k.tonic) > 65 ? midi(k.tonic) - 12 : midi(k.tonic); lo = Math.max(lo, t - 3); hi = Math.min(hi, mode === 'alt' ? t + 12 : t + 17); }
  const D: number[] = [];
  for (let d = -14; d <= 21; d++) { const m = midi(degPitch(k, d)); if (m >= lo && m <= hi) D.push(d); }
  const inD = (d: number) => D.includes(d);
  const leap = Math.max(1, L.leap);

  for (let attempt = 0; attempt < 30; attempt++) {
    const mel: PNote[] = []; const barOf: number[] = [];
    let prev = pick(r, D.filter((d) => [0, 2, 4].includes(mod7(d))).slice(0, 4).concat(D.filter((d) => mod7(d) === 0).slice(0, 1)));
    if (prev === undefined) prev = D[0];
    let lastMove = 0, rep = 0, bad = false, firstNote = true;
    for (let b = 0; b < bars; b++) {
      const root = skel[b], ct = [root, root + 2, root + 4].map(mod7);
      let pat = b === bars - 1 ? finalBar(time) : pick(r, pats);
      if (b === 0 && pat[0] < 0) pat = pats[0];
      let t = 0; const half = (time[0] * 4) / time[1] / 2;
      pat.forEach((dur, j) => {
        if (dur < 0) { mel.push({ p: [], d: -dur, rest: true }); barOf.push(b); t += -dur; return; }
        let d = prev;
        const lastNote = b === bars - 1 && j === pat.length - 1;
        if (firstNote) firstNote = false;
        else if (lastNote) d = D.filter((x) => mod7(x) === 0).sort((a, c) => Math.abs(a - prev) - Math.abs(c - prev))[0] ?? prev;
        else {
          const strong = Math.abs(t) < 1e-6 || Math.abs(t - half) < 1e-6;
          const cands = D.filter((x) => Math.abs(x - prev) <= leap);
          const chordC = cands.filter((x) => ct.includes(mod7(x)) && (x !== prev || rep < 2));
          const stepDir = Math.abs(lastMove) > 1 ? -Math.sign(lastMove) : r() < 0.6 && lastMove ? Math.sign(lastMove) : r() < 0.5 ? 1 : -1;
          const step = inD(prev + stepDir) ? prev + stepDir : inD(prev - stepDir) ? prev - stepDir : prev;
          if (Math.abs(lastMove) > 1) d = step;
          else if (strong && chordC.length) { chordC.sort((a, c) => Math.abs(a - prev) - Math.abs(c - prev)); d = chordC[Math.min(chordC.length - 1, Math.floor(r() * Math.min(3, chordC.length)))]; }
          else if (r() < 0.7 || !chordC.length) d = leap === 1 && r() < 0.2 && rep < 2 ? prev : step;
          else d = pick(r, chordC);
          if (d === prev && rep >= 2) d = step;
        }
        rep = d === prev ? rep + 1 : 0; if (rep > 3) bad = true;
        lastMove = d - prev; prev = d;
        mel.push({ p: [degPitch(k, d, root === 4)], d: dur }); barOf.push(b); t += dur;
      });
    }
    if (bad) continue;
    // occasional tie inside a bar (level 5+)
    if (level >= 5) for (let i = 0; i + 1 < mel.length; i++) if (!mel[i].rest && !mel[i + 1].rest && barOf[i] === barOf[i + 1] && mel[i].d === 1 && mel[i + 1].d === 1 && r() < 0.06) { mel[i + 1] = { ...mel[i + 1], p: mel[i].p }; mel[i] = { ...mel[i], tie: true }; }
    const bl = (time[0] * 4) / time[1];
    const down = (n: PNote): PNote => (n.rest ? n : { ...n, p: n.p.map((p) => ({ ...p, o: p.o - 1 })) });
    const restBar = (): PNote => ({ p: [], d: bl, rest: true });
    let staves: StaffP[];
    if (mode === 'rh' || ((mode === 'onehand' || mode === 'five') && !lh)) staves = [{ clef: 'treble', notes: mel }];
    else if (mode === 'onehand' || mode === 'five') staves = [{ clef: 'bass', notes: mel.map(down) }];
    else if (mode === 'alt') {
      const rhN: PNote[] = [], lhN: PNote[] = [];
      for (let b = 0; b < bars; b++) {
        const seg = mel.filter((_, i) => barOf[i] === b), left = Math.floor(b / 2) % 2 === 1;
        if (left) { lhN.push(...seg.map(down)); rhN.push(restBar()); } else { rhN.push(...seg); lhN.push(restBar()); }
      }
      // ties must not cross into a rest bar
      staves = [{ clef: 'treble', notes: rhN }, { clef: 'bass', notes: lhN }];
    } else if (mode === 'lead') {
      const seen = new Set<number>();
      const notes = mel.map((n, i) => { if (seen.has(barOf[i])) return n; seen.add(barOf[i]); const c = diatonic(k, skel[barOf[i]]); return { ...n, sym: chordSym(c.root, c.q) }; });
      staves = [{ clef: 'treble', notes }];
      const harm = skel.map((deg) => { const c = diatonic(k, deg); const root = { ...c.root, o: midi({ ...c.root, o: 4 }) > 65 ? 3 : 4 }; return chordTones(root, c.q).map(midi); });
      return { key: kname, time, tempo, staves, harm };
    } else {
      const lhN: PNote[] = [];
      for (let b = 0; b < bars; b++) {
        const root = skel[b], base = root - 7 + (midi(degPitch(k, root - 7)) < 43 ? 7 : 0) - (midi(degPitch(k, root - 7)) > 55 ? 7 : 0);
        const tone = (off: number) => degPitch(k, base + off, root === 4);
        if (mode === 'held') lhN.push({ p: b % 2 === 1 || bars - 1 === b ? [tone(0), tone(4)] : [tone(0)], d: bl });
        else if (time[1] === 8) lhN.push({ p: [tone(0), tone(2), tone(4)], d: 1.5 }, { p: [tone(0), tone(2), tone(4)], d: 1.5 });
        else if (time[0] === 3) lhN.push({ p: [tone(0)], d: 1 }, { p: [tone(2), tone(4)], d: 1 }, { p: [tone(2), tone(4)], d: 1 });
        else if (b === bars - 1) lhN.push({ p: [tone(0), tone(2), tone(4)], d: 4 });
        else if (b % 4 < 2) lhN.push({ p: [tone(0), tone(2), tone(4)], d: 2 }, { p: [tone(0), tone(2), tone(4)], d: 2 });
        else lhN.push({ p: [tone(0)], d: 1 }, { p: [tone(4)], d: 1 }, { p: [tone(2)], d: 1 }, { p: [tone(4)], d: 1 });
      }
      staves = [{ clef: 'treble', notes: mel }, { clef: 'bass', notes: lhN }];
    }
    return { key: kname, time, tempo, staves };
  }
  return genPhrase(Math.max(1, level - 1), r, o);
}
/** A fresh seed that has not been used in the last 50 generations. */
export function freshSeed(): number { let s = 0; do { s = (Math.random() * 2 ** 31) | 0; } while (recent.includes(s)); recent.push(s); if (recent.length > 50) recent.shift(); return s; }
export const seeded = (seed: number) => mulberry(seed);
export { rint };
