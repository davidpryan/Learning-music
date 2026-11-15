// The exercise catalog: 27 generators. Each returns a Question that the shared Runner can ask and grade.
import {
  Rng, Pitch, P, midi, pc, di, fromDi, label, pname, pretty, addInterval, IVS, ivLong, intervalName, SCALES, scale, key, Key, allKeys, keyLabel,
  QUAL, INV, chordTones, chordSym, diatonic, rnMap, voicing, DEG, SOLF, pick, rint, shuffle, enharmonicLabel, isBlack, LETTERS,
} from './music';
import { Passage, PNote, onsets } from './passage';
import type { ScoreSpec } from './notation';
import { playSeq, SeqEv, Timbre, click, playNote, now } from './audio';
import { genPhrase, genRhythm, LEVELS, patterns } from './gen';
import { PIECES } from './content/pieces';
import { get } from './store';

export interface Slot { label: string; choices: string[]; value: string; scores?: ScoreSpec[] }
export type Answer =
  | { kind: 'steps'; steps: number[][]; octaveFree: boolean; bass?: boolean; alt?: Slot[] }
  | { kind: 'slots'; slots: Slot[] }
  | { kind: 'rhythm'; passage: Passage; tempo: number; visual: boolean }
  | { kind: 'perform'; passage: Passage; expect?: Passage; tempo: number; tempoKey?: string };
export interface Question {
  prompt: string; sub?: string; score?: ScoreSpec; kb?: number[]; play?: () => number;
  answer: Answer; item: string; explain: string; reveal?: ScoreSpec; kbRange?: [number, number];
}
export interface ParamDef { key: string; label: string; type: 'multi' | 'select' | 'bool' | 'num'; options?: [string | number, string][]; min?: number; max?: number; step?: number }
export interface ExDef { id: string; name: string; track: 'theory' | 'reading' | 'ear'; blurb: string; target: number; params: ParamDef[]; defaults: Record<string, any>; gen: (p: any, r: Rng) => Question }

// ---------- helpers ----------
type Clef = 'treble' | 'bass';
const free = (notes: PNote[], clef: Clef = 'treble', keyName = 'C'): ScoreSpec => ({ passage: { key: keyName, time: [4, 4], tempo: 80, free: true, staves: [{ clef, notes }] }, showTime: false });
const whole = (ps: Pitch[]): PNote => ({ p: ps, d: 4 });
const RANGES: Record<string, Record<Clef, [number, number] | string[]>> = {
  landmarks: { treble: ['C4', 'G4'], bass: ['F3', 'C4'] },
  low: { treble: ['C4', 'D4', 'E4', 'F4', 'G4'], bass: ['C3', 'D3', 'E3', 'F3', 'G3'] },
  staff: { treble: [30, 38], bass: [18, 26] },
  ledger: { treble: [26, 42], bass: [14, 30] },
  wide: { treble: [28, 40], bass: [16, 28] },
};
function natural(r: Rng, clef: Clef, range: string): Pitch {
  const R = RANGES[range]?.[clef] ?? RANGES.staff[clef];
  if (typeof R[0] === 'string') return P(pick(r, R as string[]));
  return fromDi(rint(r, R[0] as number, R[1] as number));
}
const timbre = (p: any): Timbre => (p?.rot ? (['piano', 'guitar', 'strings'] as Timbre[])[Math.floor(Math.random() * 3)] : get().profile.settings.timbre);
const cadence = (k: Key): SeqEv[] => [0, 3, 4, 0].map((d, i) => ({ t: i, d: i === 3 ? 1.6 : 0.95, midis: voicing(diatonic(k, d)) }));
const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], ROOTS_ACC = ['Db', 'Eb', 'F#', 'Ab', 'Bb'];
const VAL_NAME: Record<string, string> = { 4: 'Whole', 3: 'Dotted half', 2: 'Half', 1.5: 'Dotted quarter', 1: 'Quarter', 0.5: 'Eighth', 0.25: 'Sixteenth' };
const BEATS: Record<string, string> = { 4: '4', 3: '3', 2: '2', 1.5: '1½', 1: '1', 0.5: '½', 0.25: '¼' };
/** The smallest whole-octave keyboard that holds these notes, so keys stay as wide as possible on a phone. */
const kbFor = (ms: number[]): [number, number] => { const lo = 12 * Math.floor(Math.min(...ms) / 12); return [lo, Math.max(lo + 12, 12 * Math.ceil(Math.max(...ms) / 12))]; };
const CLEF_KB: Record<string, Record<Clef, [number, number]>> = { ledger: { treble: [57, 84], bass: [36, 64] }, other: { treble: [60, 84], bass: [36, 60] } };
function pickChord(r: Rng, p: any): { root: Pitch; q: string; inv: number } {
  const roots = [...ROOTS, ...(p.acc ? ROOTS_ACC : [])];
  for (let i = 0; i < 60; i++) {
    const q = pick(r, p.quals as string[]), root = P(pick(r, roots) + '4');
    const inv = Math.min(pick(r, p.invs as number[]), QUAL[q].iv.length - 1);
    if (chordTones(root, q).every((t) => Math.abs(t.a) <= 1)) return { root, q, inv };
  }
  return { root: P('C4'), q: 'maj', inv: 0 };
}
const placeChord = (c: { root: Pitch; q: string; inv: number }, clef: Clef): Pitch[] => {
  const root = { ...c.root, o: clef === 'treble' ? 4 : c.root.l <= 2 ? 3 : 2 };
  const t = chordTones(root, c.q, c.inv); return clef === 'treble' && midi(t[0]) > 69 ? t.map((x) => ({ ...x, o: x.o - 1 })) : t;
};
const invText = (inv: number) => (inv ? `, ${INV[inv].toLowerCase()}` : '');
function rnPool(k: Key, kinds: string[]): string[] {
  const out: string[] = [];
  if (kinds.includes('triads')) for (let d = 0; d < 7; d++) out.push(diatonic(k, d).rn);
  if (kinds.includes('sevenths')) for (let d = 0; d < 7; d++) out.push(diatonic(k, d, true).rn);
  if (!k.minor && kinds.includes('secondary')) out.push('V7/V', 'V7/ii', 'V7/vi', 'V7/IV');
  if (!k.minor && kinds.includes('borrowed')) out.push('iv', '♭VI', '♭VII', '♭III');
  return out;
}
const PROGS: Record<string, string[][]> = {
  basic: [['I', 'IV', 'V', 'I'], ['I', 'V', 'I'], ['I', 'IV', 'I', 'V'], ['I', 'V', 'IV', 'I']],
  pop: [['I', 'V', 'vi', 'IV'], ['I', 'vi', 'IV', 'V'], ['vi', 'IV', 'I', 'V'], ['ii', 'V', 'I'], ['I', 'IV', 'vi', 'V'], ['I', 'iii', 'IV', 'V']],
  minor: [['i', 'iv', 'V', 'i'], ['i', 'VI', 'III', 'V'], ['i', 'iv', 'i', 'V']],
  chromatic: [['I', 'V7/V', 'V', 'I'], ['I', 'V7/vi', 'vi', 'IV'], ['I', 'iv', 'I', 'V'], ['I', '♭VII', 'IV', 'I'], ['I', 'V7/IV', 'IV', 'V'], ['I', '♭VI', '♭VII', 'I']],
};
const degLabel = (i: number) => `${DEG[i]} · ${SOLF[i]}`;
const CHROM: Record<number, string> = { 1: '♭2', 3: '♭3', 6: '♯4', 8: '♭6', 10: '♭7' };
const keyOpts = (minor = false): [string, string][] => allKeys(minor, 7).map((k) => [k, keyLabel(k)]);
const IV_OPTS: [string, string][] = Object.keys(IVS).filter((n) => n !== 'P1' && +n.slice(1) <= 8).map((n) => [n, ivLong(n)]);
const QUAL_OPTS: [string, string][] = Object.keys(QUAL).map((q) => [q, QUAL[q].name]);
const CLEF_OPTS: [string, string][] = [['treble', 'Treble'], ['bass', 'Bass']];
const LEVEL_OPTS = (lo: number, hi: number): [number, string][] => Array.from({ length: hi - lo + 1 }, (_, i) => [lo + i, 'Level ' + (lo + i)]);

// ---------- the catalog ----------
export const EX: Record<string, ExDef> = {};
const def = (d: ExDef) => { EX[d.id] = d; };

def({
  id: 'T1', name: 'Note identification', track: 'theory', blurb: 'A note on the staff: play or name it.', target: 3000,
  params: [{ key: 'clefs', label: 'Clefs', type: 'multi', options: CLEF_OPTS }, { key: 'range', label: 'Range', type: 'select', options: [['landmarks', 'Landmark notes'], ['low', 'C to G'], ['staff', 'On the staff'], ['wide', 'Staff plus one ledger line'], ['ledger', 'Ledger lines']] }, { key: 'acc', label: 'Sharps and flats', type: 'bool' }],
  defaults: { clefs: ['treble'], range: 'staff', acc: false },
  gen(p, r) {
    const clef = pick(r, p.clefs as Clef[]), n = natural(r, clef, p.range);
    if (p.acc && r() < 0.5) n.a = r() < 0.5 ? 1 : -1;
    if ((n.l === 2 || n.l === 6) && n.a === 1) n.a = 0; if ((n.l === 3 || n.l === 0) && n.a === -1) n.a = 0;
    const letters = LETTERS.map((l) => pretty(l + (n.a === 1 ? '#' : n.a === -1 ? 'b' : '')));
    const choices = n.a ? [...LETTERS.map((l) => pretty(l)), ...letters] : LETTERS.map((l) => pretty(l));
    return {
      prompt: 'Play or name this note', score: free([whole([n])], clef), kbRange: p.range === 'low' || p.range === 'landmarks' ? kbFor([midi(n)]) : (CLEF_KB[p.range === 'ledger' ? 'ledger' : 'other'][clef]),
      answer: { kind: 'steps', steps: [[midi(n)]], octaveFree: false, alt: [{ label: 'Note', choices, value: pretty(pname(n)) }] },
      item: `${clef}:${pname(n, true)}`, explain: `${label(n, true)} on the ${clef} staff`,
    };
  },
});
def({
  id: 'T2', name: 'Keyboard identification', track: 'theory', blurb: 'A highlighted key: name it.', target: 3000,
  params: [{ key: 'black', label: 'Black keys', type: 'bool' }], defaults: { black: true },
  gen(p, r) {
    let m = rint(r, 48, 71); while (!p.black && isBlack(m)) m = rint(r, 48, 71);
    const all = Array.from({ length: 12 }, (_, i) => 60 + i).filter((x) => p.black || !isBlack(x)).map(enharmonicLabel);
    return { prompt: 'Which key is highlighted?', kb: [m], kbRange: [48, 72], answer: { kind: 'slots', slots: [{ label: 'Key', choices: all, value: enharmonicLabel(m) }] }, item: 'key:' + pc(m), explain: enharmonicLabel(m) };
  },
});
def({
  id: 'T3', name: 'Key signature identification', track: 'theory', blurb: 'A key signature: name the key.', target: 3000,
  params: [{ key: 'maxAcc', label: 'Most sharps or flats', type: 'num', min: 0, max: 7, step: 1 }, { key: 'kinds', label: 'Signatures', type: 'select', options: [['both', 'Sharps and flats'], ['sharps', 'Sharps only'], ['flats', 'Flats only']] }, { key: 'mode', label: 'Ask for', type: 'select', options: [['major', 'Major key'], ['minor', 'Minor key'], ['both', 'Either']] }],
  defaults: { maxAcc: 7, kinds: 'both', mode: 'major' },
  gen(p, r) {
    const minor = p.only ? /m$/.test(p.only) : p.mode === 'minor' || (p.mode === 'both' && r() < 0.5);
    const pool = p.only ? allKeys(minor, 7) : allKeys(minor, p.maxAcc, p.kinds), k = p.only ?? pick(r, pool);
    return {
      prompt: `Which ${minor ? 'minor' : 'major'} key has this signature?`, score: free([], pick(r, ['treble', 'bass'] as Clef[]), k),
      answer: { kind: 'slots', slots: [{ label: 'Key', choices: pool.map(keyLabel), value: keyLabel(k) }] }, item: 'sig:' + k, explain: keyLabel(k),
    };
  },
});
def({
  id: 'T4', name: 'Note value identification', track: 'theory', blurb: 'A note or rest: name it or count its beats.', target: 3000,
  params: [{ key: 'values', label: 'Values', type: 'multi', options: Object.keys(VAL_NAME).map((v) => [+v, VAL_NAME[v]] as [number, string]).sort((a, b) => b[0] - a[0]) }, { key: 'rests', label: 'Include rests', type: 'bool' }, { key: 'ask', label: 'Ask for', type: 'select', options: [['name', 'Name'], ['beats', 'Beats in 4/4']] }],
  defaults: { values: [4, 2, 1], rests: false, ask: 'name' },
  gen(p, r) {
    const v = pick(r, p.values as number[]), rest = !!p.rests && r() < 0.4;
    const vals = (p.values as number[]).slice().sort((a, b) => b - a);
    const nm = (x: number) => (p.ask === 'beats' ? BEATS[x] : VAL_NAME[x] + (rest ? ' rest' : ' note'));
    return {
      prompt: p.ask === 'beats' ? `How many quarter-note beats does this ${rest ? 'rest' : 'note'} last?` : `What is this ${rest ? 'rest' : 'note'} called?`,
      score: free([{ p: rest ? [] : [P('B4')], d: v, rest }]), answer: { kind: 'slots', slots: [{ label: p.ask === 'beats' ? 'Beats' : 'Name', choices: vals.map(nm), value: nm(v) }] },
      item: `val:${v}${rest ? 'r' : ''}`, explain: `${VAL_NAME[v]} ${rest ? 'rest' : 'note'}: ${BEATS[v]} beat${v === 1 ? '' : 's'}`,
    };
  },
});
def({
  id: 'T5', name: 'Measure completion', track: 'theory', blurb: 'A measure is missing beats: choose the note that fills it.', target: 6000,
  params: [{ key: 'times', label: 'Time signatures', type: 'multi', options: [['4/4', '4/4'], ['3/4', '3/4'], ['2/4', '2/4'], ['6/8', '6/8']] }, { key: 'level', label: 'Rhythm vocabulary', type: 'select', options: LEVEL_OPTS(1, 6) }],
  defaults: { times: ['4/4', '3/4'], level: 2 },
  gen(p, r) {
    const ts = pick(r, p.times as string[]), time = ts.split('/').map(Number) as [number, number];
    const pats = (time[0] === 2 ? [[1, 1], [2], [1, 0.5, 0.5], [0.5, 0.5, 1]] : patterns(Math.max(p.level, time[1] === 8 ? 5 : time[0] === 3 ? 2 : 1), time)).filter((x) => x.every((d) => d > 0) && x.length > 1);
    const pat = [...pick(r, pats)], miss = pat.splice(rint(r, 0, pat.length - 1), 1)[0];
    const vals = [4, 3, 2, 1.5, 1, 0.5, 0.25];
    return {
      prompt: `This ${ts} measure is incomplete. Which note fills it?`,
      score: { passage: { key: 'C', time, tempo: 80, staves: [{ clef: 'treble', notes: pat.map((d) => ({ p: [P('B4')], d })) }] }, showTime: true },
      answer: { kind: 'slots', slots: [{ label: 'Missing note', choices: vals.map((v) => VAL_NAME[v]), value: VAL_NAME[miss] }] }, item: `fill:${ts}:${miss}`, explain: `${VAL_NAME[miss]} note (${BEATS[miss]} beat${miss === 1 ? '' : 's'})`,
    };
  },
});
function pickInterval(r: Rng, p: any, down = false): { a: Pitch; b: Pitch; iv: string; clef: Clef } {
  for (let i = 0; i < 80; i++) {
    const clef = pick(r, (p.clefs ?? ['treble']) as Clef[]), iv = pick(r, p.ivs as string[]), a = natural(r, clef, 'staff');
    if (p.acc && r() < 0.3) a.a = r() < 0.5 ? 1 : -1;
    const [s, h] = IVS[iv], b = down ? addInterval(a, -s, -h) : addInterval(a, s, h);
    const R = RANGES.ledger[clef] as [number, number];
    if (Math.abs(b.a) <= 1 && di(b) >= R[0] && di(b) <= R[1]) return { a, b, iv, clef };
  }
  return { a: P('C4'), b: P('G4'), iv: 'P5', clef: 'treble' };
}
def({
  id: 'T6', name: 'Interval identification', track: 'theory', blurb: 'Two written notes: name the interval.', target: 3000,
  params: [{ key: 'ivs', label: 'Intervals', type: 'multi', options: IV_OPTS }, { key: 'clefs', label: 'Clefs', type: 'multi', options: CLEF_OPTS }, { key: 'form', label: 'Shown as', type: 'select', options: [['melodic', 'One after the other'], ['harmonic', 'Stacked'], ['both', 'Either']] }, { key: 'numbers', label: 'Number only (2nd, 3rd…)', type: 'bool' }, { key: 'acc', label: 'Sharps and flats', type: 'bool' }],
  defaults: { ivs: ['M2', 'M3', 'P4', 'P5', 'M6', 'M7', 'P8'], clefs: ['treble'], form: 'both', numbers: false, acc: false },
  gen(p, r) {
    const { a, b, iv, clef } = pickInterval(r, p), harm = p.form === 'harmonic' || (p.form === 'both' && r() < 0.5);
    const nm = (n: string) => (p.numbers ? ivLong(n).split(' ').slice(1).join(' ') : ivLong(n));
    const choices = [...new Set((p.ivs as string[]).map(nm))];
    return {
      prompt: 'What interval is this?', score: free(harm && iv !== 'P1' ? [whole([a, b])] : [whole([a]), whole([b])], clef),
      answer: { kind: 'slots', slots: [{ label: 'Interval', choices, value: nm(iv) }] }, item: 'iv:' + iv, explain: `${ivLong(intervalName(a, b))}: ${label(a)} to ${label(b)}`,
    };
  },
});
def({
  id: 'T7', name: 'Interval construction', track: 'theory', blurb: 'A note and an interval name: play the second note.', target: 6000,
  params: [{ key: 'ivs', label: 'Intervals', type: 'multi', options: IV_OPTS }, { key: 'dir', label: 'Direction', type: 'select', options: [['up', 'Above'], ['down', 'Below'], ['both', 'Either']] }, { key: 'clefs', label: 'Clefs', type: 'multi', options: CLEF_OPTS }],
  defaults: { ivs: ['M2', 'M3', 'P4', 'P5', 'M6', 'M7', 'P8'], dir: 'up', clefs: ['treble'] },
  gen(p, r) {
    const down = p.dir === 'down' || (p.dir === 'both' && r() < 0.5), { a, b, iv, clef } = pickInterval(r, p, down);
    return {
      prompt: `Play the note a ${ivLong(iv).toLowerCase()} ${down ? 'below' : 'above'} ${label(a)}`, score: free([whole([a])], clef), kbRange: kbFor([midi(a), midi(b)]),
      answer: { kind: 'steps', steps: [[midi(b)]], octaveFree: false }, item: `ivc:${iv}${down ? 'd' : ''}`, explain: label(b, true), reveal: free([whole([a]), whole([b])], clef),
    };
  },
});
def({
  id: 'T8', name: 'Scale construction', track: 'theory', blurb: 'A tonic and scale type: play the scale.', target: 14000,
  params: [{ key: 'types', label: 'Scale types', type: 'multi', options: Object.keys(SCALES).map((s) => [s, SCALES[s].name]) }, { key: 'tonics', label: 'Tonics', type: 'multi', options: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'].map((t) => [t, pretty(t)]) }, { key: 'dir', label: 'Direction', type: 'select', options: [['up', 'Up'], ['down', 'Down']] }],
  defaults: { types: ['major'], tonics: ['C', 'G', 'F'], dir: 'up' },
  gen(p, r) {
    const type = pick(r, p.types as string[]), t = P(pick(r, p.tonics as string[]) + '4');
    if (midi(t) > 66) t.o = 3;
    let s = [...scale(t, type), { ...t, o: t.o + 1 }]; if (p.dir === 'down') s = s.reverse();
    return {
      prompt: `Play the ${label(t)} ${SCALES[type].name.toLowerCase()} scale, ${p.dir === 'down' ? 'down' : 'up'} one octave`, kbRange: kbFor(s.map(midi)),
      answer: { kind: 'steps', steps: s.map((x) => [midi(x)]), octaveFree: true }, item: `scale:${type}:${pname(t)}`, explain: s.map((x) => label(x)).join(' '), reveal: free(s.map((x) => ({ p: [x], d: 1 }))),
    };
  },
});
const CHORD_PARAMS: ParamDef[] = [{ key: 'quals', label: 'Chord types', type: 'multi', options: QUAL_OPTS }, { key: 'invs', label: 'Inversions', type: 'multi', options: [[0, 'Root position'], [1, '1st inversion'], [2, '2nd inversion'], [3, '3rd inversion']] }, { key: 'acc', label: 'Sharp and flat roots', type: 'bool' }];
def({
  id: 'T9', name: 'Chord identification', track: 'theory', blurb: 'A written chord: give root, quality and inversion.', target: 5000,
  params: [...CHORD_PARAMS, { key: 'clefs', label: 'Clefs', type: 'multi', options: CLEF_OPTS }], defaults: { quals: ['maj', 'min'], invs: [0], acc: false, clefs: ['treble'] },
  gen(p, r) {
    const c = pickChord(r, p), clef = pick(r, p.clefs as Clef[]), tones = placeChord(c, clef);
    const roots = [...ROOTS, ...(p.acc ? ROOTS_ACC : [])].map(pretty);
    const slots: Slot[] = [{ label: 'Root', choices: roots, value: pretty(pname(c.root)) }, { label: 'Quality', choices: (p.quals as string[]).map((q) => QUAL[q].name), value: QUAL[c.q].name }];
    if (p.invs.length > 1) slots.push({ label: 'Inversion', choices: (p.invs as number[]).map((i) => INV[i]), value: INV[c.inv] });
    return { prompt: 'Name this chord', score: free([whole(tones)], clef), answer: { kind: 'slots', slots }, item: `chord:${c.q}:${c.inv}`, explain: `${chordSym(c.root, c.q, c.inv)} (${QUAL[c.q].name.toLowerCase()}${invText(c.inv)})` };
  },
});
def({
  id: 'T10', name: 'Chord construction', track: 'theory', blurb: 'A chord symbol: play it.', target: 6000, params: CHORD_PARAMS, defaults: { quals: ['maj', 'min'], invs: [0], acc: false },
  gen(p, r) {
    const c = p.fixed ? { root: P(p.fixed.root + '4'), q: p.fixed.q as string, inv: 0 } : pickChord(r, p), tones = placeChord(c, 'treble'), ms = tones.map(midi);
    return {
      prompt: `Play ${chordSym(c.root, c.q)}${invText(c.inv)}`, sub: c.inv ? `Lowest note: ${label(tones[0])}` : QUAL[c.q].name, kbRange: [48, 72],
      answer: { kind: 'steps', steps: [ms], octaveFree: true, bass: (p.invs as number[]).some((i) => i > 0) }, item: `chordc:${c.q}:${c.inv}`, explain: tones.map((t) => label(t)).join(' – '), reveal: free([whole(tones)]),
    };
  },
});
def({
  id: 'T11', name: 'Roman numeral analysis', track: 'theory', blurb: 'A chord in a stated key: give its numeral.', target: 5000,
  params: [{ key: 'keys', label: 'Keys', type: 'multi', options: [...keyOpts(), ...keyOpts(true)] }, { key: 'kinds', label: 'Chords', type: 'multi', options: [['triads', 'Diatonic triads'], ['sevenths', 'Diatonic sevenths'], ['secondary', 'Secondary dominants'], ['borrowed', 'Borrowed chords']] }],
  defaults: { keys: ['C', 'G', 'F'], kinds: ['triads'] },
  gen(p, r) {
    const k = key(pick(r, p.keys as string[])); let pool = rnPool(k, p.kinds); if (!pool.length) pool = rnPool(k, ['triads']);
    const rn = pick(r, pool), c = rnMap(k)[rn], tones = placeChord({ root: c.root, q: c.q, inv: 0 }, 'treble');
    return {
      prompt: `In ${keyLabel(k.name)}, which chord is this?`, score: free([whole(tones)], 'treble', k.name),
      answer: { kind: 'slots', slots: [{ label: 'Numeral', choices: pool, value: rn }] }, item: `rn:${rn}`, explain: `${rn}: ${chordSym(c.root, c.q)}`,
    };
  },
});
def({
  id: 'T12', name: 'Progression building', track: 'theory', blurb: 'A numeral sequence in a key: play each chord.', target: 20000,
  params: [{ key: 'keys', label: 'Keys', type: 'multi', options: [...keyOpts(), ...keyOpts(true)] }, { key: 'set', label: 'Progressions', type: 'select', options: [['basic', 'I, IV and V'], ['pop', 'Common four-chord'], ['minor', 'Minor key'], ['chromatic', 'Secondary and borrowed']] }],
  defaults: { keys: ['C', 'G', 'F'], set: 'basic' },
  gen(p, r) {
    let k = key(pick(r, p.keys as string[])); const set = p.set as string;
    if (set === 'minor' && !k.minor) k = key('Am'); if (set !== 'minor' && k.minor) k = key('C');
    const prog = pick(r, PROGS[set] ?? PROGS.basic), map = rnMap(k), cs = prog.map((rn) => map[rn]);
    return {
      prompt: `In ${keyLabel(k.name)}, play: ${prog.join(' – ')}`, sub: 'One chord at a time, any octave', kbRange: [48, 72],
      answer: { kind: 'steps', steps: cs.map((c) => chordTones({ ...c.root, o: 4 }, c.q).map(midi)), octaveFree: true }, item: `prog:${prog.join('-')}`, explain: cs.map((c) => chordSym(c.root, c.q)).join(' – '),
    };
  },
});

// ---------- reading ----------
def({
  id: 'R1', name: 'Rhythm reading', track: 'reading', blurb: 'A notated rhythm: tap it with the metronome.', target: 0,
  params: [{ key: 'level', label: 'Rhythm vocabulary', type: 'select', options: LEVEL_OPTS(1, 6) }, { key: 'bars', label: 'Bars', type: 'select', options: [[2, '2'], [4, '4'], [8, '8']] }, { key: 'time', label: 'Time signature', type: 'select', options: [['4/4', '4/4'], ['3/4', '3/4'], ['6/8', '6/8']] }, { key: 'tempo', label: 'Tempo (0 = adaptive)', type: 'num', min: 0, max: 160, step: 4 }],
  defaults: { level: 3, bars: 4, time: '4/4', tempo: 0 },
  gen(p, r) {
    const time = String(p.time).split('/').map(Number) as [number, number], lv = Math.max(p.level, time[1] === 8 ? 5 : time[0] === 3 ? 2 : 1);
    const passage: Passage = { key: 'C', time, tempo: p.tempo || 66, staves: [{ clef: 'percussion', notes: genRhythm(lv, r, p.bars, time) }] };
    return { prompt: 'Tap this rhythm', sub: 'Scan it, then tap after the count-in', answer: { kind: 'rhythm', passage, tempo: p.tempo || 0, visual: true }, item: `rhythm:${lv}`, explain: 'Rhythm reading' };
  },
});
const readQ = (passage: Passage, p: any, level: number, prompt: string, expect?: Passage): Question => ({
  prompt, sub: 'Scan first. Keep going, even after a mistake.', kbRange: kbFor(onsets(expect ?? passage).flatMap((o) => o.midis)),
  answer: { kind: 'perform', passage, expect, tempo: p.tempo || 0, tempoKey: 'L' + level }, item: `read:${level}`, explain: 'Reading at tempo',
});
def({
  id: 'R2', name: 'One-hand phrase', track: 'reading', blurb: 'An unseen melody: play it at tempo after a count-in.', target: 0,
  params: [{ key: 'level', label: 'Level', type: 'select', options: LEVEL_OPTS(1, 7) }, { key: 'hand', label: 'Hand', type: 'select', options: [['any', 'Either'], ['rh', 'Right (treble)'], ['lh', 'Left (bass)']] }, { key: 'tempo', label: 'Tempo (0 = adaptive)', type: 'num', min: 0, max: 160, step: 4 }],
  defaults: { level: 1, hand: 'any', tempo: 0 },
  gen(p, r) {
    const lv = p.level as number, mode = lv <= 1 ? 'rh' : lv === 4 ? 'five' : 'onehand';
    const passage = genPhrase(lv, r, { mode, hand: p.hand === 'any' ? undefined : p.hand, bars: lv >= 5 ? 8 : undefined, key: p.key });
    return readQ(passage, p, lv, 'Play this phrase');
  },
});
def({
  id: 'R3', name: 'Two-hand phrase', track: 'reading', blurb: 'An unseen grand-staff phrase: play it at tempo.', target: 0,
  params: [{ key: 'level', label: 'Level', type: 'select', options: LEVEL_OPTS(5, 7) }, { key: 'tempo', label: 'Tempo (0 = adaptive)', type: 'num', min: 0, max: 160, step: 4 }], defaults: { level: 5, tempo: 0 },
  gen(p, r) { const lv = Math.max(5, Math.min(7, p.level)); return readQ(genPhrase(lv, r), p, lv, 'Play this phrase with both hands'); },
});
def({
  id: 'R4', name: 'Piece reading', track: 'reading', blurb: 'A real piece from the library: play it through once.', target: 0,
  params: [{ key: 'piece', label: 'Piece', type: 'select', options: [['random', 'Surprise me'], ...PIECES.map((x) => [x.id, `${x.title} (level ${x.level})`] as [string, string])] }, { key: 'level', label: 'If random, level', type: 'select', options: [[0, 'Any'], ...LEVEL_OPTS(1, 8)] }, { key: 'hands', label: 'Play', type: 'select', options: [['both', 'Everything written'], ['rh', 'Melody only']] }, { key: 'pct', label: 'Tempo %', type: 'num', min: 40, max: 120, step: 10 }],
  defaults: { piece: 'random', level: 0, hands: 'both', pct: 100 },
  gen(p, r) {
    const user = get().userPieces;
    const pool = PIECES.filter((x) => !p.level || x.level === p.level);
    const pc_ = p.piece === 'random' ? pick(r, pool.length ? pool : PIECES) : PIECES.find((x) => x.id === p.piece) ?? PIECES[0];
    const up = user.find((u) => u.id === p.piece);
    const passage = up ? JSON.parse(up.xml) as Passage : pc_.passage;
    const shown = p.hands === 'rh' ? { ...passage, staves: [passage.staves[0]] } : passage;
    const q = readQ(shown, { tempo: Math.round((passage.tempo * (p.pct || 100)) / 100) }, up ? 4 : pc_.level, up ? up.title : `${pc_.title}${pc_.by ? ' · ' + pc_.by : ''}`);
    (q.answer as any).tempoKey = undefined; q.item = 'piece:' + (up ? up.id : pc_.id); return q;
  },
});
def({
  id: 'R5', name: 'Lead sheet', track: 'reading', blurb: 'A melody with chord symbols: play melody or chords.', target: 0,
  params: [{ key: 'part', label: 'Play', type: 'select', options: [['melody', 'Melody'], ['chords', 'Chords, one per bar']] }, { key: 'bars', label: 'Bars', type: 'select', options: [[8, '8'], [16, '16']] }, { key: 'tempo', label: 'Tempo (0 = adaptive)', type: 'num', min: 0, max: 160, step: 4 }],
  defaults: { part: 'melody', bars: 8, tempo: 0 },
  gen(p, r) {
    const passage = genPhrase(8, r, { bars: p.bars, key: p.key }), bl = (passage.time[0] * 4) / passage.time[1];
    const expect: Passage | undefined = p.part === 'chords' ? { ...passage, staves: [{ clef: 'treble', notes: (passage.harm ?? []).map((ms) => ({ p: ms.map((m) => fromMidiSimple(m)), d: bl })) }] } : undefined;
    return readQ(passage, p, 8, p.part === 'chords' ? 'Play the chords, one at the start of each bar' : 'Play the melody', expect);
  },
});
function fromMidiSimple(m: number): Pitch { const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; const p = P(names[pc(m)] + '0'); p.o = Math.floor(m / 12) - 1; return p; }
def({
  id: 'R6', name: 'Sight-singing', track: 'reading', blurb: 'A notated phrase and its starting pitch: sing it.', target: 0,
  params: [{ key: 'level', label: 'Level', type: 'select', options: [[1, 'Steps, C to G'], [2, 'Thirds, one octave'], [4, 'Leaps to a fifth']] }, { key: 'key', label: 'Key', type: 'select', options: [['C', 'C major'], ['G', 'G major'], ['F', 'F major'], ['D', 'D major']] }],
  defaults: { level: 1, key: 'C' },
  gen(p, r) {
    const passage = genPhrase(p.level, r, { mode: p.level === 4 ? 'five' : 'rh', hand: 'rh', bars: 2, key: p.level === 1 ? 'C' : p.key, time: [4, 4] });
    const os = onsets(passage), k = key(passage.key);
    return {
      prompt: 'Sing this phrase', sub: 'You will hear the key and your first note. Any octave is fine.', score: { passage }, kbRange: kbFor(os.flatMap((o) => o.midis)),
      play: () => playSeq([{ t: 0, d: 1.5, midis: voicing(diatonic(k, 0)) }, { t: 2, d: 1.5, midis: os[0].midis }], 80, 'piano'),
      answer: { kind: 'steps', steps: os.map((o) => o.midis), octaveFree: true }, item: `sing:${p.level}`, explain: os.map((o) => label(fromMidiSimple(o.midis[0]))).join(' '),
    };
  },
});

// ---------- ear ----------
def({
  id: 'E1', name: 'Pitch comparison', track: 'ear', blurb: 'Two notes: is the second higher, lower or the same?', target: 10000,
  params: [{ key: 'max', label: 'Largest gap (semitones)', type: 'num', min: 1, max: 12, step: 1 }, { key: 'same', label: 'Include "same"', type: 'bool' }], defaults: { max: 12, same: true },
  gen(p, r) {
    const a = rint(r, 55, 76), d = p.same && r() < 0.2 ? 0 : rint(r, 1, p.max) * (r() < 0.5 ? 1 : -1), tb = timbre(p);
    const v = d === 0 ? 'Same' : d > 0 ? 'Higher' : 'Lower';
    return {
      prompt: 'Is the second note higher, lower or the same?', play: () => playSeq([{ t: 0, d: 1, midis: [a] }, { t: 1.2, d: 1, midis: [a + d] }], 80, tb),
      answer: { kind: 'slots', slots: [{ label: 'Second note', choices: p.same ? ['Higher', 'Lower', 'Same'] : ['Higher', 'Lower'], value: v }] }, item: `cmp:${Math.abs(d)}`, explain: `${v}${d ? ` by ${Math.abs(d)} semitone${Math.abs(d) > 1 ? 's' : ''}` : ''}`,
    };
  },
});
def({
  id: 'E2', name: 'Pitch matching', track: 'ear', blurb: 'A note: sing or play it back.', target: 10000,
  params: [{ key: 'white', label: 'White keys only', type: 'bool' }], defaults: { white: true },
  gen(p, r) {
    const vr = get().profile.settings.input === 'mic' ? get().profile.voiceRange : null, lo = vr ? vr[0] : 57, hi = vr ? Math.max(vr[0] + 4, vr[1]) : 72;
    let m = rint(r, lo, hi); while (p.white && isBlack(m)) m = rint(r, lo, hi); const tb = timbre(p);
    return { prompt: 'Sing or play this note back', sub: 'Any octave counts', play: () => playSeq([{ t: 0, d: 2, midis: [m] }], 80, tb), kbRange: [48, 72], answer: { kind: 'steps', steps: [[m]], octaveFree: true }, item: 'match', explain: label(fromMidiSimple(m), true) };
  },
});
def({
  id: 'E3', name: 'Scale degree identification', track: 'ear', blurb: 'A cadence, then a note: name or play its degree.', target: 10000,
  params: [{ key: 'keys', label: 'Keys', type: 'multi', options: [...keyOpts(), ...keyOpts(true)] }, { key: 'degs', label: 'Degrees', type: 'multi', options: DEG.map((d, i) => [i, degLabel(i)] as [number, string]) }, { key: 'chrom', label: 'Chromatic notes', type: 'bool' }, { key: 'n', label: 'Notes per question', type: 'num', min: 1, max: 4, step: 1 }],
  defaults: { keys: ['C'], degs: [0, 2, 4], chrom: false, n: 1 },
  gen(p, r) {
    const k = key(pick(r, p.keys as string[])), sc = (k.minor ? SCALES.minor : SCALES.major).iv.map((x) => x[1]), tonic = midi(k.tonic) > 65 ? midi(k.tonic) - 12 : midi(k.tonic), tb = timbre(p);
    const pool: { semi: number; name: string }[] = (p.degs as number[]).map((d) => ({ semi: sc[d], name: degLabel(d) }));
    if (p.chrom) for (const s of Object.keys(CHROM).map(Number)) if (!sc.includes(s)) pool.push({ semi: s, name: CHROM[s] });
    const picks = Array.from({ length: p.n }, () => pick(r, pool)), ms = picks.map((x) => tonic + x.semi + (r() < 0.25 ? 12 : 0));
    const cad = cadence(k);
    return {
      prompt: p.n > 1 ? 'Which scale degrees do you hear after the cadence?' : 'Which scale degree do you hear after the cadence?', sub: keyLabel(k.name), kbRange: kbFor([tonic, tonic + 12]),
      play: () => playSeq([...cad, ...ms.map((m, i) => ({ t: 5.5 + i * 1.1, d: 1, midis: [m] }))], 100, tb),
      answer: { kind: 'steps', steps: ms.map((m) => [m]), octaveFree: true, alt: picks.map((x, i) => ({ label: p.n > 1 ? `Note ${i + 1}` : 'Degree', choices: pool.map((y) => y.name), value: x.name })) },
      item: 'deg:' + picks[0].name, explain: picks.map((x) => x.name).join(', '),
    };
  },
});
def({
  id: 'E4', name: 'Interval identification by ear', track: 'ear', blurb: 'Two sounded notes: name the interval.', target: 10000,
  params: [{ key: 'ivs', label: 'Intervals', type: 'multi', options: IV_OPTS.filter((x) => x[0] !== 'd5') }, { key: 'mode', label: 'Played', type: 'select', options: [['asc', 'Rising'], ['desc', 'Falling'], ['harm', 'Together'], ['mix', 'Any']] }, { key: 'fixed', label: 'Always start on C', type: 'bool' }],
  defaults: { ivs: ['M2', 'M3', 'P4', 'P5', 'P8'], mode: 'asc', fixed: false },
  gen(p, r) {
    const iv = pick(r, p.ivs as string[]), semis = IVS[iv][1], mode = p.mode === 'mix' ? pick(r, ['asc', 'desc', 'harm']) : p.mode, root = p.fixed ? 60 : rint(r, 52, 67), tb = timbre(p);
    const a = mode === 'desc' ? root + semis : root, b = mode === 'desc' ? root : root + semis;
    const nm = (n: string) => (n === 'A4' ? 'Tritone' : ivLong(n));
    return {
      prompt: 'What interval do you hear?', play: () => playSeq(mode === 'harm' ? [{ t: 0, d: 2, midis: [a, b] }] : [{ t: 0, d: 1, midis: [a] }, { t: 1.1, d: 1.4, midis: [b] }], 80, tb),
      answer: { kind: 'slots', slots: [{ label: 'Interval', choices: (p.ivs as string[]).map(nm), value: nm(iv) }] }, item: `eiv:${iv}:${mode}`, explain: `${nm(iv)} (${semis} semitone${semis === 1 ? '' : 's'})`,
    };
  },
});
def({
  id: 'E5', name: 'Chord quality', track: 'ear', blurb: 'A sounded chord: name the quality.', target: 10000,
  params: [{ key: 'quals', label: 'Chord types', type: 'multi', options: QUAL_OPTS }, { key: 'invs', label: 'Inversions', type: 'multi', options: [[0, 'Root position'], [1, '1st inversion'], [2, '2nd inversion']] }, { key: 'broken', label: 'Play as broken chord', type: 'bool' }, { key: 'askInv', label: 'Ask for the inversion too', type: 'bool' }],
  defaults: { quals: ['maj', 'min'], invs: [0], broken: false, askInv: false },
  gen(p, r) {
    const q = pick(r, p.quals as string[]), inv = Math.min(pick(r, p.invs as number[]), QUAL[q].iv.length - 1), root = rint(r, 52, 64), tb = timbre(p);
    let ms = QUAL[q].iv.map((x) => root + x[1]); for (let i = 0; i < inv; i++) ms.push(ms.shift()! + 12);
    const slots: Slot[] = [{ label: 'Quality', choices: (p.quals as string[]).map((x) => QUAL[x].name), value: QUAL[q].name }];
    if (p.askInv) slots.push({ label: 'Inversion', choices: (p.invs as number[]).map((i) => INV[i]), value: INV[inv] });
    return {
      prompt: 'What kind of chord is this?', play: () => playSeq(p.broken ? [...ms.map((m, i) => ({ t: i * 0.5, d: 0.5, midis: [m] })), { t: ms.length * 0.5 + 0.2, d: 2, midis: ms }] : [{ t: 0, d: 2.4, midis: ms }], 80, tb),
      answer: { kind: 'slots', slots }, item: `eq:${q}:${inv}`, explain: QUAL[q].name + invText(inv),
    };
  },
});
def({
  id: 'E6', name: 'Rhythm dictation', track: 'ear', blurb: 'A played rhythm: tap it back.', target: 0,
  params: [{ key: 'level', label: 'Rhythm vocabulary', type: 'select', options: LEVEL_OPTS(1, 6) }, { key: 'bars', label: 'Bars', type: 'select', options: [[1, '1'], [2, '2'], [4, '4']] }, { key: 'tempo', label: 'Tempo', type: 'num', min: 50, max: 140, step: 4 }, { key: 'mode', label: 'Answer by', type: 'select', options: [['auto', 'Tapping (or picking, if your input is Choices)'], ['tap', 'Tapping it back'], ['pick', 'Picking the written rhythm']] }],
  defaults: { level: 1, bars: 1, tempo: 80, mode: 'auto' },
  gen(p, r) {
    const mkP = (): Passage => ({ key: 'C', time: [4, 4], tempo: p.tempo, staves: [{ clef: 'percussion', notes: genRhythm(p.level, r, p.bars, [4, 4]) }] });
    const passage = mkP();
    if (p.mode === 'pick' || (p.mode !== 'tap' && get().profile.settings.input === 'choice')) {
      const sig = (x: Passage) => x.staves[0].notes.map((n) => (n.rest ? -n.d : n.d)).join(',');
      const opts = [passage]; for (let i = 0; i < 40 && opts.length < 3; i++) { const c = mkP(); if (!opts.some((o) => sig(o) === sig(c))) opts.push(c); }
      const order = shuffle(r, opts), names = ['A', 'B', 'C'].slice(0, order.length), spb = 60 / p.tempo, os = onsets(passage), len = p.bars * 4;
      return {
        prompt: 'Which rhythm did you hear?', sub: 'One bar of clicks, then the rhythm',
        play: () => { const t0 = now() + 0.15; for (let i = 0; i < 4 + len; i++) click(t0 + i * spb, i % 4 === 0); os.forEach((o) => playNote(79, t0 + (4 + o.t) * spb, 0.14, 'sine', 0.8, true)); return (4 + len) * spb + 0.3; },
        answer: { kind: 'slots', slots: [{ label: 'Rhythm', choices: names, value: names[order.indexOf(passage)], scores: order.map((o) => ({ passage: o, showTime: true })) }] }, item: `erh:${p.level}`, explain: 'The matching rhythm is marked',
      };
    }
    return { prompt: 'Listen, then tap the rhythm back', sub: 'You will hear it once with the beat, then it is your turn', answer: { kind: 'rhythm', passage, tempo: p.tempo, visual: false }, item: `erh:${p.level}`, explain: 'Rhythm echo' };
  },
});
function melody(r: Rng, k: Key, len: number, leap: number): number[] {
  const out: number[] = []; let d = pick(r, [0, 2, 4, 7]);
  for (let i = 0; i < len; i++) {
    if (i) { let step = rint(r, 1, r() < 0.7 ? 1 : leap) * (r() < 0.5 ? 1 : -1); if (d + step < -1 || d + step > 8) step = -step; d += step; }
    if (i === len - 1 && len > 3) d = Math.abs(d - 7) < Math.abs(d) ? 7 : 0;
    out.push(d);
  }
  return out;
}
def({
  id: 'E7', name: 'Melodic dictation', track: 'ear', blurb: 'A played melody: play it back or name its degrees.', target: 20000,
  params: [{ key: 'keys', label: 'Keys', type: 'multi', options: [...keyOpts(), ...keyOpts(true)] }, { key: 'len', label: 'Notes', type: 'num', min: 2, max: 8, step: 1 }, { key: 'leap', label: 'Largest leap (scale steps)', type: 'num', min: 1, max: 5, step: 1 }],
  defaults: { keys: ['C'], len: 3, leap: 2 },
  gen(p, r) {
    const k = key(pick(r, p.keys as string[])), sc = keyScale_(k), ds = melody(r, k, p.len, p.leap), tb = timbre(p);
    const tonicShift = midi(k.tonic) > 65 ? -12 : 0;
    const ms = ds.map((d) => midi(sc[((d % 7) + 7) % 7]) + 12 * Math.floor(d / 7) + tonicShift), names = ds.map((d) => degLabel(((d % 7) + 7) % 7));
    return {
      prompt: 'Play this melody back', sub: `${keyLabel(k.name)} · ${p.len} notes`, kbRange: kbFor(ms), play: () => playSeq([...cadence(k), ...ms.map((m, i) => ({ t: 5.5 + i * 0.9, d: 0.85, midis: [m] }))], 100, tb),
      answer: { kind: 'steps', steps: ms.map((m) => [m]), octaveFree: true, alt: names.map((n, i) => ({ label: `Note ${i + 1}`, choices: DEG.map((_, j) => degLabel(j)), value: n })) },
      item: `mel:${p.len}`, explain: names.join(', '), reveal: free(ms.map((m) => ({ p: [spellIn(m, k)], d: 1 })), 'treble', k.name),
    };
  },
});
const keyScale_ = (k: Key) => scale(k.tonic, k.minor ? 'minor' : 'major');
function spellIn(m: number, k: Key): Pitch { const hit = keyScale_(k).find((x) => pc(midi(x)) === pc(m)) ?? fromMidiSimple(m); const o = { ...hit, o: 0 }; o.o = Math.round((m - midi(o)) / 12); return o; }
const chordVoice = (c: { root: Pitch; q: string }) => voicing(c);
def({
  id: 'E8', name: 'Chord function', track: 'ear', blurb: 'A cadence, then one chord: give its Roman numeral.', target: 10000,
  params: [{ key: 'keys', label: 'Keys', type: 'multi', options: [...keyOpts(), ...keyOpts(true)] }, { key: 'pool', label: 'Chords', type: 'multi', options: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'V7', 'i', 'iv', 'VI', 'III', 'V7/V', 'V7/vi', '♭VII', '♭VI'].map((x) => [x, x]) }],
  defaults: { keys: ['C'], pool: ['I', 'IV', 'V'] },
  gen(p, r) {
    const k = key(pick(r, p.keys as string[])), map = rnMap(k), pool = (p.pool as string[]).filter((x) => map[x]), rn = pick(r, pool.length ? pool : Object.keys(map).slice(0, 3)), c = map[rn], tb = timbre(p);
    return {
      prompt: 'Which chord do you hear after the cadence?', sub: keyLabel(k.name), kbRange: [48, 72], play: () => playSeq([...cadence(k), { t: 5.5, d: 2.4, midis: chordVoice(c) }], 100, tb),
      answer: { kind: 'steps', steps: [chordTones({ ...c.root, o: 4 }, c.q).map(midi)], octaveFree: true, alt: [{ label: 'Numeral', choices: pool, value: rn }] }, item: `fn:${rn}`, explain: `${rn}: ${chordSym(c.root, c.q)}`,
    };
  },
});
export function bandEvents(chords: number[][], beatsPer: number, style: string): SeqEv[] {
  const evs: SeqEv[] = [];
  chords.forEach((ms, i) => {
    const t = i * beatsPer;
    if (style === 'band') { evs.push({ t, d: beatsPer * 0.5, midis: [ms[0] - 12] }, { t: t + beatsPer / 2, d: beatsPer * 0.5, midis: [ms[0] - 12] }); for (let b = 0; b < beatsPer; b++) evs.push({ t: t + b, d: 0.9, midis: ms.slice(1) }); }
    else evs.push({ t, d: beatsPer * 0.95, midis: ms });
  });
  return evs;
}
def({
  id: 'E9', name: 'Progression dictation', track: 'ear', blurb: 'A played progression: give each chord in order.', target: 30000,
  params: [{ key: 'keys', label: 'Keys', type: 'multi', options: [...keyOpts(), ...keyOpts(true)] }, { key: 'pool', label: 'Chords', type: 'multi', options: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'V7', 'i', 'iv', 'VI', 'III', 'V7/V', 'V7/vi', '♭VII', '♭VI', 'iv'].filter((x, i, a) => a.indexOf(x) === i).map((x) => [x, x]) }, { key: 'len', label: 'Chords', type: 'num', min: 2, max: 8, step: 1 }, { key: 'style', label: 'Arrangement', type: 'select', options: [['piano', 'Block chords'], ['band', 'Band']] }, { key: 'tempo', label: 'Tempo', type: 'num', min: 60, max: 140, step: 4 }],
  defaults: { keys: ['C'], pool: ['I', 'IV', 'V'], len: 4, style: 'piano', tempo: 96 },
  gen(p, r) {
    const k = key(pick(r, p.keys as string[])), map = rnMap(k), pool = (p.pool as string[]).filter((x) => map[x]);
    const fixed = p.prog as string[] | undefined; const tonicRn = k.minor ? 'i' : 'I';
    const seq: string[] = fixed ?? [];
    if (!fixed) for (let i = 0; i < p.len; i++) { let c = i === 0 && pool.includes(tonicRn) && r() < 0.7 ? tonicRn : pick(r, pool); for (let t = 0; t < 5 && c === seq[i - 1]; t++) c = pick(r, pool); seq.push(c); }
    const cs = seq.map((rn) => map[rn]), tb = p.style === 'band' ? 'guitar' : timbre(p), evs = bandEvents(cs.map(chordVoice), 2, p.style);
    return {
      prompt: 'Which chords do you hear, in order?', sub: `${keyLabel(k.name)} · ${seq.length} chords`, kbRange: [48, 72], play: () => playSeq(evs, p.tempo, tb as Timbre),
      answer: { kind: 'steps', steps: cs.map((c) => chordTones({ ...c.root, o: 4 }, c.q).map(midi)), octaveFree: true, alt: seq.map((rn, i) => ({ label: `Chord ${i + 1}`, choices: pool, value: rn })) },
      item: `prog:${seq.length}`, explain: seq.join(' – ') + '  (' + cs.map((c) => chordSym(c.root, c.q)).join(' – ') + ')',
    };
  },
});
export const EX_LIST = Object.values(EX);
export const exParams = (id: string, preset: Record<string, any> = {}) => ({ ...EX[id].defaults, ...preset });
export { LEVELS, shuffle };
