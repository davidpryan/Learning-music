// Core music theory: pitches, intervals, scales, keys, chords, Roman numerals, seeded RNG.
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LPC = [0, 2, 4, 5, 7, 9, 11];
export interface Pitch { l: number; a: number; o: number } // letter index 0-6, alteration, octave

export function P(s: string): Pitch {
  const m = /^([A-Ga-g])(##|#|bb|b)?(-?\d+)?$/.exec(s.trim());
  if (!m) throw new Error('bad pitch ' + s);
  const a = m[2] === '#' ? 1 : m[2] === '##' ? 2 : m[2] === 'b' ? -1 : m[2] === 'bb' ? -2 : 0;
  return { l: LETTERS.indexOf(m[1].toUpperCase() as any), a, o: m[3] !== undefined ? +m[3] : 4 };
}
export const midi = (p: Pitch) => 12 * (p.o + 1) + LPC[p.l] + p.a;
export const pc = (m: number) => ((m % 12) + 12) % 12;
export const di = (p: Pitch) => p.l + 7 * p.o; // diatonic index
export const fromDi = (d: number, a = 0): Pitch => ({ l: ((d % 7) + 7) % 7, o: Math.floor(d / 7), a });
const accStr = (a: number) => (a > 0 ? '#'.repeat(a) : a < 0 ? 'b'.repeat(-a) : '');
export const pname = (p: Pitch, oct = false) => LETTERS[p.l] + accStr(p.a) + (oct ? p.o : '');
export const vfKey = (p: Pitch) => `${LETTERS[p.l].toLowerCase()}${accStr(p.a)}/${p.o}`;
/** Pretty-print a note or chord name (never a sentence): Bb -> B♭, F# -> F♯. */
export const pretty = (s: string) => s.replace(/([A-G])bb/g, '$1𝄫').replace(/([A-G])b/g, '$1♭').replace(/##/g, '𝄪').replace(/#/g, '♯');

let nameSystem: 'letters' | 'solfege' = 'letters';
export const setNameSystem = (n: 'letters' | 'solfege') => { nameSystem = n; };
const FIXED_DO = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
/** A pitch name in the user's chosen naming system. */
export const label = (p: Pitch, oct = false) =>
  nameSystem === 'solfege' ? FIXED_DO[p.l] + pretty(accStr(p.a)) + (oct ? p.o : '') : pretty(pname(p, oct));

export function addInterval(p: Pitch, steps: number, semis: number): Pitch {
  const d = di(p) + steps; const q = fromDi(d);
  return { ...q, a: midi(p) + semis - midi(q) };
}
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export function fromMidi(m: number, flat = false): Pitch {
  const p = P((flat ? FLAT : SHARP)[pc(m)] + '0'); p.o = Math.floor(m / 12) - 1; return p;
}
export const midiName = (m: number, flat = false) => label(fromMidi(m, flat), true);
export const BLACK = [1, 3, 6, 8, 10];
export const isBlack = (m: number) => BLACK.includes(pc(m));
export const enharmonicLabel = (m: number) => isBlack(m) ? `${label(fromMidi(m))}/${label(fromMidi(m, true))}` : label(fromMidi(m));
export const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ---- Intervals ----
export const IVS: Record<string, [number, number]> = {
  P1: [0, 0], m2: [1, 1], M2: [1, 2], m3: [2, 3], M3: [2, 4], P4: [3, 5], A4: [3, 6], d5: [4, 6], P5: [4, 7],
  m6: [5, 8], M6: [5, 9], m7: [6, 10], M7: [6, 11], P8: [7, 12], m9: [8, 13], M9: [8, 14], m10: [9, 15], M10: [9, 16],
};
const QN: Record<string, string> = { P: 'Perfect', M: 'Major', m: 'Minor', A: 'Augmented', d: 'Diminished' };
const NUMN = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave', '9th', '10th', '11th', '12th'];
export const ivLong = (n: string) => `${QN[n[0]] ?? n[0]} ${NUMN[+n.slice(1) - 1] ?? n.slice(1)}`;
export function intervalName(a: Pitch, b: Pitch): string {
  if (midi(b) < midi(a) || (midi(a) === midi(b) && di(b) < di(a))) [a, b] = [b, a];
  const steps = di(b) - di(a), semis = midi(b) - midi(a), n = steps % 7;
  const base = [0, 2, 4, 5, 7, 9, 11][n] + 12 * Math.floor(steps / 7), diff = semis - base;
  const perfect = n === 0 || n === 3 || n === 4;
  const q = perfect ? ({ 0: 'P', 1: 'A', '-1': 'd' } as any)[diff] : ({ 0: 'M', '-1': 'm', 1: 'A', '-2': 'd' } as any)[diff];
  return (q ?? '?') + (steps + 1);
}

// ---- Scales ----
export const SCALES: Record<string, { name: string; iv: [number, number][] }> = {
  major: { name: 'Major', iv: [[0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 11]] },
  minor: { name: 'Natural minor', iv: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10]] },
  harmonic: { name: 'Harmonic minor', iv: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 11]] },
  melodic: { name: 'Melodic minor', iv: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 11]] },
  dorian: { name: 'Dorian', iv: [[0, 0], [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 10]] },
  phrygian: { name: 'Phrygian', iv: [[0, 0], [1, 1], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10]] },
  lydian: { name: 'Lydian', iv: [[0, 0], [1, 2], [2, 4], [3, 6], [4, 7], [5, 9], [6, 11]] },
  mixolydian: { name: 'Mixolydian', iv: [[0, 0], [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 10]] },
  locrian: { name: 'Locrian', iv: [[0, 0], [1, 1], [2, 3], [3, 5], [4, 6], [5, 8], [6, 10]] },
  majpent: { name: 'Major pentatonic', iv: [[0, 0], [1, 2], [2, 4], [4, 7], [5, 9]] },
  minpent: { name: 'Minor pentatonic', iv: [[0, 0], [2, 3], [3, 5], [4, 7], [6, 10]] },
  blues: { name: 'Blues', iv: [[0, 0], [2, 3], [3, 5], [4, 6], [4, 7], [6, 10]] },
};
export const scale = (tonic: Pitch, type = 'major'): Pitch[] => SCALES[type].iv.map(([s, h]) => addInterval(tonic, s, h));

// ---- Keys ----
export interface Key { name: string; tonic: Pitch; minor: boolean; acc: number }
const MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
const MIN = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'];
const ACC = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
export function key(name: string): Key {
  const minor = /m$/.test(name), t = name.replace(/m$/, '');
  const i = (minor ? MIN : MAJ).indexOf(t);
  if (i < 0) throw new Error('bad key ' + name);
  return { name, tonic: P(t + '4'), minor, acc: ACC[i] };
}
export const allKeys = (minor: boolean, maxAcc = 7, kinds: 'both' | 'sharps' | 'flats' = 'both') =>
  (minor ? MIN : MAJ).map((t, i) => ({ t, a: ACC[i] }))
    .filter((k) => Math.abs(k.a) <= maxAcc && (kinds === 'both' || k.a === 0 || (kinds === 'sharps' ? k.a > 0 : k.a < 0)))
    .map((k) => k.t + (minor ? 'm' : ''));
export const keyLabel = (name: string) => `${pretty(name.replace(/m$/, ''))} ${/m$/.test(name) ? 'minor' : 'major'}`;
export const keyScale = (k: Key) => scale(k.tonic, k.minor ? 'minor' : 'major');
/** Spell a MIDI number the way the key would. */
export function spell(m: number, k: Key): Pitch {
  const hit = [...keyScale(k), addInterval(k.tonic, 6, 11)].find((p) => pc(midi(p)) === pc(m));
  const base = hit ?? fromMidi(m, k.acc < 0);
  const out = { ...base, o: 0 }; out.o = Math.round((m - midi(out)) / 12); return out;
}

// ---- Chords ----
export const QUAL: Record<string, { iv: [number, number][]; sym: string; name: string }> = {
  maj: { iv: [[0, 0], [2, 4], [4, 7]], sym: '', name: 'Major' },
  min: { iv: [[0, 0], [2, 3], [4, 7]], sym: 'm', name: 'Minor' },
  dim: { iv: [[0, 0], [2, 3], [4, 6]], sym: '°', name: 'Diminished' },
  aug: { iv: [[0, 0], [2, 4], [4, 8]], sym: '+', name: 'Augmented' },
  maj7: { iv: [[0, 0], [2, 4], [4, 7], [6, 11]], sym: 'maj7', name: 'Major 7th' },
  dom7: { iv: [[0, 0], [2, 4], [4, 7], [6, 10]], sym: '7', name: 'Dominant 7th' },
  min7: { iv: [[0, 0], [2, 3], [4, 7], [6, 10]], sym: 'm7', name: 'Minor 7th' },
  hdim7: { iv: [[0, 0], [2, 3], [4, 6], [6, 10]], sym: 'ø7', name: 'Half-diminished 7th' },
  dim7: { iv: [[0, 0], [2, 3], [4, 6], [6, 9]], sym: '°7', name: 'Diminished 7th' },
};
export const INV = ['Root position', '1st inversion', '2nd inversion', '3rd inversion'];
export function chordTones(root: Pitch, q: string, inv = 0): Pitch[] {
  const t = QUAL[q].iv.map(([s, h]) => addInterval(root, s, h));
  for (let i = 0; i < inv; i++) { const f = t.shift()!; t.push({ ...f, o: f.o + 1 }); }
  return t;
}
export const chordSym = (root: Pitch, q: string, inv = 0) =>
  label(root) + QUAL[q].sym + (inv ? '/' + label(chordTones(root, q, inv)[0]) : '');

// ---- Roman numerals ----
export interface RChord { root: Pitch; q: string; rn: string }
const RN_MAJ: [string, string, string, string][] = [['I', 'maj', 'Imaj7', 'maj7'], ['ii', 'min', 'ii7', 'min7'], ['iii', 'min', 'iii7', 'min7'], ['IV', 'maj', 'IVmaj7', 'maj7'], ['V', 'maj', 'V7', 'dom7'], ['vi', 'min', 'vi7', 'min7'], ['vii°', 'dim', 'viiø7', 'hdim7']];
const RN_MIN: [string, string, string, string][] = [['i', 'min', 'i7', 'min7'], ['ii°', 'dim', 'iiø7', 'hdim7'], ['III', 'maj', 'IIImaj7', 'maj7'], ['iv', 'min', 'iv7', 'min7'], ['V', 'maj', 'V7', 'dom7'], ['VI', 'maj', 'VImaj7', 'maj7'], ['vii°', 'dim', 'vii°7', 'dim7']];
export function diatonic(k: Key, deg: number, seventh = false): RChord {
  const t = (k.minor ? RN_MIN : RN_MAJ)[deg];
  const root = k.minor && deg === 6 ? addInterval(k.tonic, 6, 11) : keyScale(k)[deg];
  return { root, q: seventh ? t[3] : t[1], rn: seventh ? t[2] : t[0] };
}
/** Every Roman numeral this app knows for a key: diatonic triads and sevenths, plus secondary dominants and borrowed chords in major. */
export function rnMap(k: Key): Record<string, RChord> {
  const out: Record<string, RChord> = {};
  for (let d = 0; d < 7; d++) for (const s of [false, true]) { const c = diatonic(k, d, s); out[c.rn] = c; }
  if (!k.minor) {
    for (const [name, d] of [['V/V', 4], ['V/ii', 1], ['V/vi', 5], ['V/IV', 3], ['V/iii', 2]] as [string, number][]) {
      const root = addInterval(diatonic(k, d).root, 4, 7); root.o -= 1;
      out[name] = { root, q: 'maj', rn: name }; out[name.replace('V/', 'V7/')] = { root, q: 'dom7', rn: name.replace('V/', 'V7/') };
    }
    out['iv'] = { root: addInterval(k.tonic, 3, 5), q: 'min', rn: 'iv' };
    out['♭VI'] = { root: addInterval(k.tonic, 5, 8), q: 'maj', rn: '♭VI' };
    out['♭VII'] = { root: addInterval(k.tonic, 6, 10), q: 'maj', rn: '♭VII' };
    out['♭III'] = { root: addInterval(k.tonic, 2, 3), q: 'maj', rn: '♭III' };
  }
  return out;
}
/** A playable voicing: root in the bass octave, close-position tones above it. */
export function voicing(c: { root: Pitch; q: string }, inv = 0): number[] {
  const tones = chordTones({ ...c.root, o: 4 }, c.q, inv).map(midi);
  const shift = tones[0] > 67 ? -12 : 0;
  return [midi({ ...c.root, o: 3 }) + (midi({ ...c.root, o: 3 }) > 55 ? -12 : 0), ...tones.map((t) => t + shift)];
}
export const DEG = ['1', '2', '3', '4', '5', '6', '7'];
export const SOLF = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];

// ---- Seeded RNG ----
export type Rng = () => number;
export const mulberry = (seed: number): Rng => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const rint = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export function shuffle<T>(r: Rng, a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
export const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
