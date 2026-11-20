// Synth exercises S1 to S14. Each generator returns a Question the shared Runner can ask, play and grade.
import { EX, EX_LIST, ExDef, Question, Slot, MatchCheck } from '../exercises';
import { Rng, pick, shuffle, rint } from '../music';
import { Patch, SeqNote, PD, mkPatch, norm, denorm, fmt, isChoice, isStepped } from './dsp';
import { features } from './analysis';
import { play, playSeries } from './live';
import { QUIZ, FLOW, XLATE, RECIPES } from './bank';

// ---------- phrases the exercises play ----------
export const SEQS: Record<string, { n: SeqNote[]; loop: number }> = {
  hold: { n: [{ t: 0, d: 1.2, note: 48 }], loop: 1.9 },
  low: { n: [{ t: 0, d: 1.2, note: 36 }], loop: 1.9 },
  high: { n: [{ t: 0, d: 1.2, note: 60 }], loop: 1.9 },
  gate: { n: [{ t: 0, d: 1.0, note: 48 }], loop: 2.4 },
  long: { n: [{ t: 0, d: 2.4, note: 48 }], loop: 3.2 },
  stab: { n: [0, 0.5, 1, 1.5].map((t) => ({ t, d: 0.14, note: 48 })), loop: 2 },
  pluck: { n: [48, 55, 60, 55].map((note, i) => ({ t: i * 0.4, d: 0.3, note })), loop: 1.8 },
  riff: { n: [36, 36, 48, 36, 39, 36, 46, 48].map((note, i) => ({ t: i * 0.25, d: 0.2, note })), loop: 2 },
  chord: { n: [48, 55, 64].map((note) => ({ t: 0, d: 1.6, note })), loop: 2.4 },
  lead: { n: [60, 62, 64, 67, 64].map((note, i) => ({ t: i * 0.4, d: 0.38, note })), loop: 2.4 },
  slide: { n: [{ t: 0, d: 0.9, note: 48 }, { t: 0.7, d: 0.9, note: 60 }], loop: 2.2 },
  vel: { n: [0.25, 1, 0.25, 1].map((vel, i) => ({ t: i * 0.5, d: 0.4, note: 48, vel })), loop: 2.2 },
  keys: { n: [36, 48, 60, 72].map((note, i) => ({ t: i * 0.5, d: 0.4, note })), loop: 2.4 },
  drum: { n: [0, 0.5, 1, 1.5].map((t) => ({ t, d: 0.1, note: 36 })), loop: 2 },
};
export const seqOf = (name?: string) => SEQS[name ?? 'hold'] ?? SEQS.hold;
const one = (p: Patch, seq?: string) => () => play(p, seqOf(seq).n);
const two = (a: Patch, b: Patch, seq?: string) => () => playSeries([a, b], seqOf(seq).n);

/** What it means, in a listener's words, when a control goes up. */
const MORE: Record<string, string> = {
  cut: 'is brighter', res: 'has more resonance (more of a whistle at the cutoff)', drive: 'is more driven and gritty', aa: 'fades in more slowly', ad: 'dies away more slowly', as: 'holds at a louder level', ar: 'rings on longer after the note ends',
  o1oct: 'is higher', o2oct: 'has the higher second oscillator', o2semi: 'has the higher second oscillator', o2det: 'is more detuned (beats faster)', pw: 'is fuller (closer to a square wave)', o2lvl: 'has more of the second oscillator', sublvl: 'has more sub bass', nlvl: 'is noisier', ring: 'has more ring modulation (more clang)',
  fenv: 'has the bigger filter sweep', fd: 'has the slower filter sweep', fa: 'has the slower filter rise', penv: 'starts higher before dropping to pitch', pdec: 'takes longer to settle on its pitch', ktrk: 'gets brighter as the notes go up',
  l1r: 'wobbles faster', l1p: 'has deeper vibrato', l1f: 'has the deeper filter wobble', l1a: 'has deeper tremolo', l1w: 'has more movement in the pulse width', l1fade: 'brings the vibrato in later',
  glide: 'slides between notes more slowly', uni: 'has more voices stacked', uspread: 'is wider and more detuned', dist: 'is more distorted', cho: 'has more chorus', pha: 'has more phaser', fla: 'has more flanger',
  dly: 'has louder echoes', dtime: 'has the longer gap between echoes', dfb: 'echoes more times', rev: 'has more reverb', rsize: 'is in the bigger room', eqlo: 'has more bass', eqhi: 'has more treble', comp: 'is more compressed (quiet parts brought up)',
  fmi: 'has more FM (brighter and more metallic)', fmd: 'loses its brightness faster', fmf: 'is harsher and noisier', wtpos: 'is further along the wavetable (brighter and thinner)', ah: 'has more harmonics', atilt: 'is darker (upper harmonics quieter)', aeven: 'has more even harmonics (less hollow)',
  sstart: 'starts later in the recording', slen: 'has the longer loop', gpos: 'reads from later in the recording', gsize: 'has longer, smoother grains', gdens: 'is denser', gjit: 'is more scattered', kdamp: 'is duller', kdecay: 'rings longer', vol: 'is louder', avel: 'reacts more to how hard you play', fvel: 'gets brighter when played harder',
};
const more = (id: string) => MORE[id] ?? `has more ${PD[id].label.toLowerCase()}`;
const name = (id: string, among: string[]) => (among.filter((x) => PD[x].label === PD[id].label).length > 1 ? `${PD[id].group} ${PD[id].label.toLowerCase()}` : PD[id].label);
const rnd = (r: Rng, lo: number, hi: number) => lo + r() * (hi - lo);
const list = (x: string | string[]) => (Array.isArray(x) ? x : [x]);
const slots = (prompt: string, sl: Slot[], item: string, explain: string, extra: Partial<Question> = {}): Question => ({ prompt, answer: { kind: 'slots', slots: sl }, item, explain, ...extra });

const def = (d: Omit<ExDef, 'track' | 'params'>) => { const e: ExDef = { ...d, track: 'synth', params: [] }; EX[d.id] = e; EX_LIST.push(e); };

def({ id: 'S1', name: 'A/B compare', blurb: 'Two sounds, one control apart. Pick the one that fits the description.', target: 8000, defaults: { ctl: ['cut', 'res', 'aa', 'ar'], base: { cut: 1500 }, lo: 0.15, hi: 0.85, gap: 0.3, seq: 'hold' },
  gen: (p, r) => {
    const ctl = pick(r, list(p.ctl)), a = rnd(r, p.lo, Math.max(p.lo, p.hi - p.gap)), b = Math.min(1, a + p.gap + r() * 0.1), firstHigh = r() < 0.5, base = mkPatch(p.base);
    const lo = { ...base, [ctl]: denorm(ctl, a) }, hi = { ...base, [ctl]: denorm(ctl, b) };
    return slots(`Which one ${more(ctl)}?`, [{ label: 'Answer', choices: ['First', 'Second'], value: firstHigh ? 'First' : 'Second' }], ctl, `The ${firstHigh ? 'first' : 'second'} had ${PD[ctl].label.toLowerCase()} at ${fmt(ctl, hi[ctl])}; the other was at ${fmt(ctl, lo[ctl])}.`, { play: firstHigh ? two(hi, lo, p.seq) : two(lo, hi, p.seq), sub: 'You will hear two sounds.' });
  } });

def({ id: 'S2', name: 'Name the sound', blurb: 'Hear one sound and say which setting made it.', target: 6000, defaults: { opts: [['Sine', { o1w: 0 }], ['Triangle', { o1w: 1 }], ['Saw', { o1w: 2 }], ['Square', { o1w: 3 }]], base: {}, seq: 'hold', q: 'Which waveform is this?' },
  gen: (p, r) => {
    const o = pick(r, p.opts as [string, Patch][]);
    return slots(p.q ?? 'Which one is this?', [{ label: 'Answer', choices: (p.opts as [string, Patch][]).map((x) => x[0]) , value: o[0] }], o[0], `That was ${o[0].toLowerCase()}.`, { play: one(mkPatch({ ...p.base, ...o[1] }), p.seq) });
  } });

def({ id: 'S3', name: 'Name the change', blurb: 'Hear a sound before and after one control moves. Say which control it was.', target: 9000, defaults: { ctls: ['cut', 'res', 'aa', 'ar'], base: { cut: 1500, res: 0.2 }, seq: 'hold', gap: 0.38 },
  gen: (p, r) => {
    const ctl = pick(r, p.ctls as string[]), base = mkPatch(p.base), n0 = norm(ctl, base[ctl]), up = n0 + p.gap <= 1 && (n0 - p.gap < 0 || r() < 0.5);
    const after = { ...base, [ctl]: isChoice(ctl) ? (base[ctl] + 1 + rint(r, 0, PD[ctl].max - 1)) % (PD[ctl].max + 1) : denorm(ctl, n0 + (up ? p.gap : -p.gap)) };
    return slots('What changed between the first sound and the second?', [{ label: 'Control', choices: (p.ctls as string[]).map((x) => name(x, p.ctls)), value: name(ctl, p.ctls) }], ctl, `${name(ctl, p.ctls)} went from ${fmt(ctl, base[ctl])} to ${fmt(ctl, after[ctl])}.`, { play: two(base, after, p.seq), sub: 'Before, then after.' });
  } });

const AMT = ['Up a little', 'Up a lot', 'Down a little', 'Down a lot'];
def({ id: 'S4', name: 'Direction and amount', blurb: 'One control moves. Say which way, and how far.', target: 9000, defaults: { ctl: ['cut'], base: {}, seq: 'hold' },
  gen: (p, r) => {
    const ctl = pick(r, list(p.ctl)), n0 = rnd(r, 0.36, 0.64), k = rint(r, 0, 3), d = [0.1, 0.32, -0.1, -0.32][k], base = { ...mkPatch(p.base), [ctl]: denorm(ctl, n0) }, after = { ...base, [ctl]: denorm(ctl, n0 + d) };
    return slots(`The ${PD[ctl].label.toLowerCase()} moved. Which way, and how far?`, [{ label: 'Move', choices: AMT, value: AMT[k] }], ctl + k, `It went from ${fmt(ctl, base[ctl])} to ${fmt(ctl, after[ctl])}.`, { play: two(base, after, p.seq), sub: 'Before, then after.' });
  } });

/** Pick a target and a clearly different starting point for one control. */
function aim(r: Rng, id: string, lo: number, hi: number, base: Patch): [number, number] {
  if (isChoice(id)) { const n = PD[id].max + 1, t = rint(r, 0, n - 1); return [t, (t + 1 + rint(r, 0, n - 2)) % n]; }
  const span = hi - lo, fromTop = r() < 0.5, t = fromTop ? rnd(r, lo, lo + span * 0.62) : rnd(r, lo + span * 0.38, hi), s = fromTop ? hi : lo;
  const tv = denorm(id, t); let sv = denorm(id, s);
  if (isStepped(id) && sv === tv) sv = tv === PD[id].max ? tv - 1 : tv + 1;
  void base; return [tv, sv];
}
function matchQ(p: any, r: Rng, ctls: string[], prompt: string): Question {
  const target = mkPatch(p.base), start = mkPatch(p.base), rg = p.ranges ?? {};
  for (const id of ctls) { const [lo, hi] = rg[id] ?? [p.lo ?? 0.2, p.hi ?? 0.85], [t, s] = aim(r, id, lo, hi, target); target[id] = t; start[id] = s; }
  return { prompt, sub: 'Listen to the target, then to yours. Adjust until they sound the same.', answer: { kind: 'match', target, start, ctls, seq: p.seq ?? 'hold', view: p.view ?? 'spectrum', showTarget: p.show ?? false, tolK: p.tolK ?? 1 }, item: ctls.join('+'), explain: 'The target was ' + ctls.map((id) => `${name(id, ctls).toLowerCase()} ${fmt(id, target[id])}`).join(', ') + '.' };
}
def({ id: 'S5', name: 'One-knob match', blurb: 'Move a single control until your sound matches the target.', target: 0, defaults: { ctl: ['cut'], base: {}, lo: 0.25, hi: 0.9, seq: 'hold', view: 'spectrum', show: true, tolK: 1 },
  gen: (p, r) => { const ctl = pick(r, list(p.ctl)); return matchQ(p, r, [ctl], `Match the target with the ${PD[ctl].label.toLowerCase()}.`); } });
def({ id: 'S6', name: 'Multi-knob match', blurb: 'Match a target with several controls in play.', target: 0, defaults: { ctls: ['cut', 'res'], base: {}, ranges: { cut: [0.35, 0.8], res: [0.1, 0.8] }, seq: 'hold', view: 'spectrum', show: false, tolK: 1.3 },
  gen: (p, r) => matchQ(p, r, p.ctls, 'Match the target. Every control shown may need to move.') });
def({ id: 'S7', name: 'Patch from scratch', blurb: 'Rebuild a complete sound starting from a plain patch.', target: 0, defaults: { pats: [['Soft pad', { cut: 900, aa: 0.5, ar: 1.2 }], ['Bright pluck', { cut: 2500, ad: 0.15, as: 0, ar: 0.15 }]], ctls: ['cut', 'aa', 'ad', 'as', 'ar'], base: {}, seq: 'gate', view: 'none', tolK: 1.7 },
  gen: (p, r) => {
    const o = pick(r, p.pats as [string, Patch][]), start = mkPatch(p.base), target = mkPatch({ ...p.base, ...o[1] });
    return { prompt: `Rebuild this sound: ${o[0].toLowerCase()}.`, sub: 'You start from a plain patch. Use any of the controls shown.', answer: { kind: 'match', target, start, ctls: p.ctls, seq: p.seq, view: p.view, showTarget: false, tolK: p.tolK }, item: o[0], explain: 'The target used ' + (p.ctls as string[]).filter((id) => target[id] !== start[id]).map((id) => `${name(id, p.ctls).toLowerCase()} ${fmt(id, target[id])}`).join(', ') + '.' };
  } });

def({ id: 'S8', name: 'Read the picture', blurb: 'Pair a sound with its waveform, spectrum or envelope picture.', target: 8000, defaults: { opts: [['Sine', { o1w: 0 }], ['Triangle', { o1w: 1 }], ['Saw', { o1w: 2 }], ['Square', { o1w: 3 }]], base: {}, view: 'wave', seq: 'hold', mode: 'both' },
  gen: (p, r) => {
    const opts = p.opts as [string, Patch][], o = pick(r, opts), byName = p.mode === 'name' || (p.mode === 'both' && r() < 0.5), mk = (x: Patch) => mkPatch({ ...p.base, ...x });
    if (byName) return slots(`Which sound makes this ${p.view === 'wave' ? 'waveform' : p.view === 'env' ? 'loudness shape' : 'spectrum'}?`, [{ label: 'Answer', choices: opts.map((x) => x[0]), value: o[0] }], 'n' + o[0], `That picture is ${o[0].toLowerCase()}.`, { viz: { kind: p.view, patch: mk(o[1]), seq: p.seq } });
    const sh = shuffle(r, opts.slice()), letters = sh.map((_, i) => 'ABCD'[i]);
    return slots('Which picture shows the sound you hear?', [{ label: 'Picture', choices: letters, value: letters[sh.indexOf(o)], viz: sh.map((x) => ({ kind: p.view, patch: mk(x[1]), seq: p.seq })) }], 'p' + o[0], `The sound was ${o[0].toLowerCase()}.`, { play: one(mk(o[1]), p.seq) });
  } });

const bankQ = (rows: string[][], r: Rng, tag: string): Question => { const q = pick(r, rows); return slots(q[0], [{ label: 'Answer', choices: shuffle(r, q.slice(1)), value: q[1] }], tag + q[0].slice(0, 24), `${q[1]}.`); };
def({ id: 'S9', name: 'Signal flow', blurb: 'Put the parts of a synth in order, or work out why a patch is silent.', target: 12000, defaults: { set: 'basic' }, gen: (p, r) => bankQ(FLOW[p.set] ?? FLOW.basic, r, 'f') });

def({ id: 'S10', name: 'Draw the envelope', blurb: 'Shape attack, decay, sustain and release until your note has the same loudness shape as the target.', target: 0, defaults: { base: { cut: 3000 }, ctls: ['aa', 'ad', 'as', 'ar'], ranges: { aa: [0.1, 0.62], ad: [0.3, 0.68], as: [0.15, 0.7], ar: [0.3, 0.75], fa: [0.1, 0.62], fd: [0.3, 0.7], fs: [0.1, 0.7], fr: [0.3, 0.75] }, seq: 'gate', tolK: 1.6 },
  gen: (p, r) => ({ ...matchQ({ ...p, view: 'env', show: false }, r, p.ctls, 'Draw the envelope you hear.'), sub: 'The picture shows the loudness of your own note over time.' }) });

const DEST: Record<string, [string, Patch]> = { l1p: ['Pitch (vibrato)', { l1p: 0.8 }], l1f: ['Cutoff (filter wobble)', { l1f: 2, cut: 700, res: 0.3 }], l1a: ['Volume (tremolo)', { l1a: 0.85 }], l1w: ['Pulse width', { l1w: 0.38, o1w: 3, pw: 0.5 }] };
const LSHAPE = ['Sine', 'Triangle', 'Saw', 'Square', 'Random'];
def({ id: 'S11', name: 'Find the modulation', blurb: 'An LFO is moving something. Say what it moves, and how.', target: 9000, defaults: { dests: ['l1p', 'l1f', 'l1a'], base: {}, shapes: false, rates: false, seq: 'long' },
  gen: (p, r) => {
    const d = pick(r, p.dests as string[]), fast = r() < 0.5, shape = p.shapes ? pick(r, [0, 3, 4]) : 0, patch = mkPatch({ ...p.base, ...DEST[d][1], l1r: p.rates ? (fast ? 9 : 1.2) : rnd(r, 3, 6), l1s: shape });
    const sl: Slot[] = [{ label: 'What is the LFO moving?', choices: (p.dests as string[]).map((x) => DEST[x][0]), value: DEST[d][0] }];
    if (p.rates) sl.push({ label: 'How fast?', choices: ['Slow', 'Fast'], value: fast ? 'Fast' : 'Slow' });
    if (p.shapes) sl.push({ label: 'LFO shape', choices: ['Sine', 'Square', 'Random'], value: LSHAPE[shape] });
    return slots(sl.length > 1 ? 'Describe the modulation you hear.' : 'What is the LFO moving?', sl, d + shape + (p.rates ? fast : ''), `It was a ${LSHAPE[shape].toLowerCase()} LFO on ${DEST[d][0].toLowerCase()} at ${fmt('l1r', patch.l1r)}.`, { play: one(patch, p.seq) });
  } });

def({ id: 'S12', name: 'Recipe', blurb: 'Build a named kind of sound from a short brief. Any patch that fits the brief passes.', target: 0, defaults: { recipe: 'sub' },
  gen: (p) => {
    const rc = RECIPES[p.recipe] ?? RECIPES.sub, checks: MatchCheck[] = rc.checks.map((c) => ({ say: c.say, test: (x: Patch) => c.test(x, features(mkPatch(x), rc.note)) }));
    return { prompt: `Build ${rc.name}.`, sub: rc.brief, answer: { kind: 'match', target: mkPatch({ ...rc.base, ...rc.ref }), start: mkPatch(rc.base), ctls: rc.ctls, seq: rc.seq, view: 'none', showTarget: false, tolK: 1, checks, example: true }, item: p.recipe, explain: 'One patch that fits: ' + Object.keys(rc.ref).map((id) => `${PD[id].label.toLowerCase()} ${fmt(id, rc.ref[id])}`).join(', ') + '.' };
  } });

def({ id: 'S13', name: 'Quick-fire concepts', blurb: 'Fast checks on what each part of a synth does.', target: 7000, defaults: { topic: 'sound' }, gen: (p, r) => bankQ(QUIZ[p.topic] ?? QUIZ.sound, r, 'q') });
def({ id: 'S14', name: 'Translate', blurb: 'Other synths use other names for the same controls. Find the one you know.', target: 7000, defaults: { set: 'basic' }, gen: (p, r) => { const q = pick(r, XLATE[p.set] ?? XLATE.basic); return slots(`Another synth labels a control "${q[0]}". Which control is that here?`, [{ label: 'Answer', choices: shuffle(r, q.slice(1)), value: q[1] }], 'x' + q[0], `"${q[0]}" is ${q[1].toLowerCase()}.`); } });

// ---------- grading a match ----------
export interface MatchResult { ok: boolean; score: number; worst: string | null; up: boolean; say: string }
/** Compare the learner's settings with the target, control by control, in perceptual units. */
export function gradeMatch(a: { target: Patch; ctls: string[]; tolK: number; checks?: MatchCheck[] }, mine: Patch): MatchResult {
  if (a.checks) { const bad = a.checks.filter((c) => !c.test(mine)); return { ok: !bad.length, score: 1 - bad.length / a.checks.length, worst: null, up: false, say: bad[0]?.say ?? '' }; }
  let worst: string | null = null, wr = 0, sum = 0, up = false;
  for (const id of a.ctls) {
    const tol = isChoice(id) ? 0.5 / (PD[id].max || 1) : isStepped(id) ? 0.5 / (PD[id].max - PD[id].min) : PD[id].tol * a.tolK, d = norm(id, mine[id]) - norm(id, a.target[id]), rel = Math.abs(d) / tol;
    sum += Math.max(0, 1 - Math.abs(d) / (tol * 4)); if (rel > wr) { wr = rel; worst = id; up = d < 0; }
  }
  const ok = wr <= 1;
  return { ok, score: sum / a.ctls.length, worst: ok ? null : worst, up, say: worst && !ok ? `${name(worst, a.ctls)} is furthest off` : '' };
}
