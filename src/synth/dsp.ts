// The teaching synth's sound engine. Pure TypeScript with no browser APIs, so the same code runs in the
// audio worklet (live), on the main thread (offline renders for pictures and grading) and in tests.
export type Patch = Record<string, number>;
export interface PDef { id: string; label: string; group: string; min: number; max: number; def: number; curve: 'lin' | 'exp'; unit: string; opts?: string[]; tol: number }
export interface SeqNote { t: number; d: number; note: number; vel?: number }

const defs: PDef[] = [];
const k = (id: string, label: string, group: string, min: number, max: number, def: number, unit = '', curve: 'lin' | 'exp' = 'lin', tol = 0.07) => defs.push({ id, label, group, min, max, def, curve, unit, tol });
const c = (id: string, label: string, group: string, opts: string[], def = 0) => defs.push({ id, label, group, min: 0, max: opts.length - 1, def, curve: 'lin', unit: '', opts, tol: 0 });
const WAVES = ['Sine', 'Triangle', 'Saw', 'Pulse', 'Wavetable'], LSH = ['Sine', 'Triangle', 'Saw', 'Square', 'Random'];
const SRC = ['None', 'LFO 1', 'LFO 2', 'Mod envelope', 'Velocity', 'Mod wheel', 'Key tracking', 'Aftertouch'], DST = ['None', 'Pitch', 'Cutoff', 'Volume', 'Pulse width', 'FM amount', 'Wavetable position'];
c('eng', 'Engine', 'Engine', ['Subtractive', 'Additive', 'Sampler', 'Granular', 'Plucked string']);
c('o1w', 'Wave', 'Oscillator 1', WAVES, 2); k('o1oct', 'Octave', 'Oscillator 1', -2, 2, 0, 'oct'); k('pw', 'Pulse width', 'Oscillator 1', 0.05, 0.5, 0.5, '%'); k('wtpos', 'Table position', 'Oscillator 1', 0, 1, 0, '%');
c('o2w', 'Wave', 'Oscillator 2', WAVES, 2); k('o2oct', 'Octave', 'Oscillator 2', -2, 2, 0, 'oct'); k('o2semi', 'Semitones', 'Oscillator 2', -12, 12, 0, 'st'); k('o2det', 'Detune', 'Oscillator 2', 0, 50, 0, 'ct');
c('sync', 'Sync', 'Oscillator 2', ['Off', 'On']);
k('o1lvl', 'Osc 1 level', 'Mixer', 0, 1, 0.8, '%'); k('o2lvl', 'Osc 2 level', 'Mixer', 0, 1, 0, '%'); k('sublvl', 'Sub level', 'Mixer', 0, 1, 0, '%'); k('nlvl', 'Noise level', 'Mixer', 0, 1, 0, '%'); k('ring', 'Ring mod', 'Mixer', 0, 1, 0, '%');
c('ft', 'Type', 'Filter', ['Low-pass', 'High-pass', 'Band-pass', 'Notch']); c('fslope', 'Slope', 'Filter', ['12 dB', '24 dB']);
k('cut', 'Cutoff', 'Filter', 40, 16000, 16000, 'Hz', 'exp', 0.06); k('res', 'Resonance', 'Filter', 0, 1, 0, '%', 'lin', 0.1); k('drive', 'Drive', 'Filter', 0, 1, 0, '%', 'lin', 0.12); k('ktrk', 'Key tracking', 'Filter', 0, 1, 0, '%', 'lin', 0.15);
k('aa', 'Attack', 'Amp envelope', 0.002, 4, 0.005, 's', 'exp', 0.09); k('ad', 'Decay', 'Amp envelope', 0.01, 4, 0.2, 's', 'exp', 0.09); k('as', 'Sustain', 'Amp envelope', 0, 1, 1, '%', 'lin', 0.12); k('ar', 'Release', 'Amp envelope', 0.01, 4, 0.1, 's', 'exp', 0.09);
k('avel', 'Velocity to volume', 'Amp envelope', 0, 1, 0.3, '%', 'lin', 0.15);
k('fenv', 'Envelope amount', 'Filter envelope', -1, 1, 0, '%', 'lin', 0.08); k('fa', 'Attack', 'Filter envelope', 0.002, 4, 0.005, 's', 'exp', 0.09); k('fd', 'Decay', 'Filter envelope', 0.01, 4, 0.3, 's', 'exp', 0.09); k('fs', 'Sustain', 'Filter envelope', 0, 1, 0, '%', 'lin', 0.12); k('fr', 'Release', 'Filter envelope', 0.01, 4, 0.2, 's', 'exp', 0.09);
k('fvel', 'Velocity to cutoff', 'Filter envelope', 0, 1, 0, '%', 'lin', 0.15);
k('penv', 'Pitch amount', 'Pitch envelope', -24, 24, 0, 'st', 'lin', 0.06); k('pdec', 'Pitch decay', 'Pitch envelope', 0.01, 2, 0.1, 's', 'exp', 0.1);
k('l1r', 'Rate', 'LFO 1', 0.1, 30, 5, 'Hz', 'exp', 0.08); c('l1s', 'Shape', 'LFO 1', LSH); k('l1p', 'To pitch', 'LFO 1', 0, 12, 0, 'st', 'lin', 0.06); k('l1f', 'To cutoff', 'LFO 1', 0, 4, 0, 'oct', 'lin', 0.1); k('l1a', 'To volume', 'LFO 1', 0, 1, 0, '%', 'lin', 0.12); k('l1w', 'To pulse width', 'LFO 1', 0, 0.4, 0, '%', 'lin', 0.12);
c('l1sync', 'Tempo sync', 'LFO 1', ['Off', 'On']); c('l1div', 'Sync rate', 'LFO 1', ['1 bar', '1/2', '1/4', '1/8', '1/16'], 2); k('l1fade', 'Fade in', 'LFO 1', 0, 3, 0, 's', 'lin', 0.1);
k('l2r', 'Rate', 'LFO 2', 0.1, 30, 1, 'Hz', 'exp', 0.08); c('l2s', 'Shape', 'LFO 2', LSH);
c('mono', 'Voices', 'Voices', ['Poly', 'Mono']); c('leg', 'Legato', 'Voices', ['Off', 'On']); k('glide', 'Glide', 'Voices', 0, 1, 0, 's', 'lin', 0.1); k('uni', 'Unison voices', 'Voices', 1, 5, 1, ''); k('uspread', 'Unison spread', 'Voices', 0, 50, 15, 'ct', 'lin', 0.12);
k('bend', 'Bend range', 'Voices', 0, 12, 2, 'st'); k('mwv', 'Wheel to vibrato', 'Voices', 0, 2, 0.3, 'st');
k('dist', 'Distortion', 'Effects', 0, 1, 0, '%', 'lin', 0.12); k('cho', 'Chorus', 'Effects', 0, 1, 0, '%', 'lin', 0.15); k('pha', 'Phaser', 'Effects', 0, 1, 0, '%', 'lin', 0.15); k('fla', 'Flanger', 'Effects', 0, 1, 0, '%', 'lin', 0.15);
k('dly', 'Delay mix', 'Effects', 0, 1, 0, '%', 'lin', 0.12); k('dtime', 'Delay time', 'Effects', 0.05, 1, 0.3, 's', 'exp', 0.08); k('dfb', 'Delay feedback', 'Effects', 0, 0.9, 0.3, '%', 'lin', 0.12);
k('rev', 'Reverb mix', 'Effects', 0, 1, 0, '%', 'lin', 0.12); k('rsize', 'Reverb size', 'Effects', 0, 1, 0.5, '%', 'lin', 0.15);
k('eqlo', 'EQ low', 'Effects', -12, 12, 0, 'dB', 'lin', 0.12); k('eqhi', 'EQ high', 'Effects', -12, 12, 0, 'dB', 'lin', 0.12); k('comp', 'Compressor', 'Effects', 0, 1, 0, '%', 'lin', 0.15); c('fxo', 'Distortion goes', 'Effects', ['First', 'Last']);
k('fmi', 'FM amount', 'FM', 0, 8, 0, '', 'lin', 0.08); c('fmr', 'Ratio', 'FM', ['0.5', '1', '2', '3', '4', '5', '7'], 1); k('fmd', 'FM decay', 'FM', 0, 1, 0, '%', 'lin', 0.12); k('fmf', 'Feedback', 'FM', 0, 1, 0, '%', 'lin', 0.12); c('fma', 'Algorithm', 'FM', ['Stack', 'Side by side']);
k('ah', 'Harmonics', 'Additive', 1, 16, 8, ''); k('atilt', 'Tilt', 'Additive', 0, 2, 1, '', 'lin', 0.1); k('aeven', 'Even harmonics', 'Additive', 0, 1, 1, '%', 'lin', 0.12);
k('sstart', 'Start', 'Sampler', 0, 0.9, 0, '%', 'lin', 0.1); c('sloop', 'Loop', 'Sampler', ['Off', 'On']); k('slen', 'Loop length', 'Sampler', 0.02, 0.5, 0.2, 's', 'exp', 0.1);
k('gpos', 'Position', 'Granular', 0, 1, 0.3, '%', 'lin', 0.1); k('gsize', 'Grain size', 'Granular', 0.01, 0.3, 0.08, 's', 'exp', 0.1); k('gdens', 'Density', 'Granular', 2, 50, 20, '/s', 'exp', 0.1); k('gjit', 'Scatter', 'Granular', 0, 1, 0.1, '%', 'lin', 0.15);
k('kdamp', 'Damping', 'Plucked string', 0, 1, 0.5, '%', 'lin', 0.12); k('kdecay', 'Ring time', 'Plucked string', 0, 1, 0.7, '%', 'lin', 0.12);
for (const i of [1, 2, 3]) { c(`m${i}s`, `Slot ${i} source`, 'Mod matrix', SRC); c(`m${i}d`, `Slot ${i} destination`, 'Mod matrix', DST); k(`m${i}a`, `Slot ${i} amount`, 'Mod matrix', -1, 1, 0, '%', 'lin', 0.1); }
c('arp', 'Arpeggiator', 'Arp', ['Off', 'Up', 'Down', 'Up and down', 'Random']); c('arpr', 'Arp rate', 'Arp', ['1/4', '1/8', '1/16'], 1); k('bpm', 'Tempo', 'Arp', 60, 180, 120, 'bpm');
k('vol', 'Volume', 'Output', 0, 1, 0.7, '%');

export const PARAMS = defs;
export const PD: Record<string, PDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const INIT: Patch = Object.fromEntries(defs.map((d) => [d.id, d.def]));
export const mkPatch = (over: Patch = {}): Patch => ({ ...INIT, ...over });
const INT = new Set(['o1oct', 'o2oct', 'o2semi', 'uni', 'ah', 'bend']);
export const isChoice = (id: string) => !!PD[id].opts;
export const isStepped = (id: string) => isChoice(id) || INT.has(id);
/** Position of a value along its control, 0 to 1, in the units the ear cares about (octaves for Hz and seconds). */
export function norm(id: string, v: number): number { const d = PD[id]; return d.curve === 'exp' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min); }
export function denorm(id: string, n: number): number {
  const d = PD[id], x = Math.min(1, Math.max(0, n)), v = d.curve === 'exp' ? d.min * Math.pow(d.max / d.min, x) : d.min + x * (d.max - d.min);
  return isStepped(id) ? Math.round(v) : v;
}
export function fmt(id: string, v: number): string {
  const d = PD[id];
  if (d.opts) return d.opts[Math.round(v)];
  if (d.unit === '%') return `${Math.round(v * 100)}%`;
  if (d.unit === 'Hz') return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} kHz` : `${v >= 100 ? Math.round(v) : v.toFixed(1)} Hz`;
  if (d.unit === 's') return v < 1 ? `${Math.round(v * 1000)} ms` : `${v.toFixed(1)} s`;
  if (d.unit === 'dB' || d.unit === 'st' || d.unit === 'oct' || d.unit === 'ct') return `${v > 0 && d.min < 0 ? '+' : ''}${isStepped(id) ? Math.round(v) : v.toFixed(d.unit === 'oct' ? 1 : 0)} ${d.unit}`;
  return `${isStepped(id) ? Math.round(v) : v.toFixed(1)}${d.unit ? ' ' + d.unit : ''}`;
}

const TAU = Math.PI * 2, FM_RATIO = [0.5, 1, 2, 3, 4, 5, 7], LDIV = [4, 2, 1, 0.5, 0.25], ADIV = [1, 0.5, 0.25], BLK = 16, MAXV = 8, BASE_HZ = 261.63;
const blep = (t: number, dt: number) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
function wave(w: number, ph: number, dt: number, pw: number, pos: number): number {
  switch (w) {
    case 0: return Math.sin(TAU * ph);
    case 1: return 4 * Math.abs(ph - 0.5) - 1;
    case 2: return 2 * ph - 1 - blep(ph, dt);
    case 3: { let q = ph + 1 - pw; if (q >= 1) q -= 1; return (ph < pw ? 1 : -1) + blep(ph, dt) - blep(q, dt); }
    default: { // wavetable: sine, triangle, saw, square, thin pulse, crossfaded by position
      const x = Math.min(0.9999, Math.max(0, pos)) * 4, i = Math.floor(x), f = x - i;
      const a = i === 4 ? wave(3, ph, dt, 0.12, 0) : wave(i, ph, dt, 0.5, 0), b = i + 1 === 4 ? wave(3, ph, dt, 0.12, 0) : wave(i + 1, ph, dt, 0.5, 0);
      return a + (b - a) * f;
    }
  }
}
class Env {
  v = 0; st = 0;
  on(retrig: boolean) { if (retrig || this.st === 0) { this.st = 1; } }
  off() { if (this.st) this.st = 4; }
  step(a: number, d: number, s: number, r: number, sr: number): number {
    switch (this.st) {
      case 1: this.v += 1 / (a * sr); if (this.v >= 1) { this.v = 1; this.st = 2; } break;
      case 2: this.v += (s - this.v) * (1 - Math.exp(-4 / (d * sr))); if (Math.abs(this.v - s) < 0.0005) { this.v = s; this.st = 3; } break;
      case 3: this.v = s; break;
      case 4: this.v -= this.v * (1 - Math.exp(-4 / (r * sr))); if (this.v < 0.0004) { this.v = 0; this.st = 0; } break;
    }
    return this.v;
  }
}
class Svf {
  a = 0; b = 0;
  run(x: number, g: number, kq: number, type: number): number {
    const a1 = 1 / (1 + g * (g + kq)), a2 = g * a1, a3 = g * a2, v3 = x - this.b, v1 = a1 * this.a + a2 * v3, v2 = this.b + a2 * this.a + a3 * v3;
    this.a = 2 * v1 - this.a; this.b = 2 * v2 - this.b;
    return type === 0 ? v2 : type === 1 ? x - kq * v1 - v2 : type === 2 ? v1 : x - kq * v1;
  }
}
/** A short built-in recording for the sampler and granular engines: a breathy attack, then a tone that darkens and wobbles. */
let SAMPLE: Float32Array | null = null;
export function sample(sr: number): Float32Array {
  if (SAMPLE && SAMPLE.length === Math.floor(sr * 1.2)) return SAMPLE;
  const n = Math.floor(sr * 1.2), out = new Float32Array(n); let seed = 7, ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr; seed = (seed * 1664525 + 1013904223) >>> 0; const nz = seed / 2147483648 - 1;
    ph += (BASE_HZ * (1 + 0.006 * Math.sin(TAU * 5.5 * t) * Math.min(1, t * 2))) / sr;
    const bright = Math.exp(-t * 2.2); let v = 0;
    for (let h = 1; h <= 10; h++) v += (Math.sin(TAU * h * ph) / h) * (h === 1 ? 1 : 0.15 + bright * (h % 2 ? 1 : 0.6));
    out[i] = (v * 0.45 * Math.min(1, t * 40) + nz * 0.5 * Math.exp(-t * 28)) * Math.min(1, (1.2 - t) * 12);
  }
  return (SAMPLE = out);
}
class Voice {
  note = 60; cur = 60; vel = 0.8; gate = false; age = 0; id = 0;
  amp = new Env(); fil = new Env(); menv = 0;
  ph1 = new Float32Array(5); ph2 = new Float32Array(5); sub = 0; mph = 0; mprev = 0;
  f1 = new Svf(); f2 = new Svf();
  ks: Float32Array | null = null; ksi = 0; ksn = 0; spos = 0; grains: { p: number; n: number; len: number }[] = []; gclock = 0;
  get live() { return this.amp.st !== 0; }
}

export class Engine {
  p: Patch = mkPatch(); sr: number; voices: Voice[] = []; private rnd = 12345; private vid = 0;
  private l1 = 0; private l2 = 0; private sh1 = 0; private sh2 = 0; private lastNote = 60;
  bendV = 0; wheel = 0; after = 0;
  private seq: SeqNote[] = []; private loop = 0; private pos = 0; private seqOn = false; private pend: { at: number; note: number }[] = [];
  private held: number[] = []; private arpI = 0; private arpT = 0; private arpNote = -1; private arpDir = 1;
  // effects state
  private dl: Float32Array; private dli = 0; private ch: Float32Array; private chi = 0; private fl: Float32Array; private fli = 0; private fxph = 0;
  private ap = new Float32Array(4); private combs: Float32Array[]; private ci = [0, 0, 0, 0]; private cd = [0, 0, 0, 0]; private aps: Float32Array[]; private ai = [0, 0];
  private elo = 0; private ehi = 0; private cenv = 0;
  constructor(sr: number) {
    this.sr = sr; for (let i = 0; i < MAXV; i++) this.voices.push(new Voice());
    this.dl = new Float32Array(Math.ceil(sr * 1.05)); this.ch = new Float32Array(2048); this.fl = new Float32Array(512);
    this.combs = [1557, 1617, 1491, 1422].map((n) => new Float32Array(Math.ceil((n * sr) / 44100 * 1.6)));
    this.aps = [225, 556].map((n) => new Float32Array(Math.ceil((n * sr) / 44100)));
  }
  private rand() { this.rnd = (this.rnd * 1664525 + 1013904223) >>> 0; return this.rnd / 2147483648 - 1; }
  setPatch(p: Patch) { this.p = p; }
  /** Play a list of notes (times in seconds), optionally looping. Replaces whatever was playing. */
  setSeq(seq: SeqNote[], loopSec = 0) { this.allOff(); this.seq = seq; this.loop = loopSec; this.pos = 0; this.seqOn = seq.length > 0; this.pend = []; }
  allOff(hard = false) { this.seqOn = false; this.pend = []; this.held = []; this.arpNote = -1; for (const v of this.voices) { v.gate = false; if (hard) { v.amp.st = 0; v.amp.v = 0; } else { v.amp.off(); v.fil.off(); } } }
  noteOn(note: number, vel = 0.8) { if (this.p.arp > 0) { if (!this.held.includes(note)) this.held.push(note); return; } this.trig(note, vel); }
  noteOff(note: number) { if (this.p.arp > 0) { this.held = this.held.filter((n) => n !== note); if (!this.held.length && this.arpNote >= 0) { this.rel(this.arpNote); this.arpNote = -1; } return; } this.rel(note); }
  private trig(note: number, vel: number) {
    const p = this.p, mono = p.mono > 0.5;
    let v: Voice | undefined, legato = false;
    if (mono) { v = this.voices[0]; legato = p.leg > 0 && v.gate; for (let i = 1; i < MAXV; i++) { this.voices[i].amp.off(); this.voices[i].gate = false; } }
    else { const max = p.uni > 1 ? 4 : MAXV, pool = this.voices.slice(0, max); v = pool.find((x) => !x.live) ?? pool.reduce((a, b) => (a.id < b.id ? a : b)); }
    const from = p.glide > 0.001 && (mono ? v.live : true) ? (mono ? v.cur : this.lastNote) : note;
    v.note = note; v.cur = from; v.vel = vel; v.gate = true; v.id = ++this.vid; this.lastNote = note;
    if (!legato) {
      v.age = 0; v.menv = 1; v.amp.on(true); v.fil.on(true);
      v.mph = 0; v.spos = p.sstart * sample(this.sr).length; v.grains = []; v.gclock = 0;
      if (p.eng === 4) { const n = Math.max(8, Math.round(this.sr / (440 * Math.pow(2, (note - 69) / 12)))); if (!v.ks || v.ks.length < n) v.ks = new Float32Array(n + 4); v.ksn = n; v.ksi = 0; let lp = 0; const br = 1 - p.kdamp * 0.85; for (let i = 0; i < n; i++) { lp += (this.rand() - lp) * br; v.ks[i] = lp; } }
    }
  }
  private rel(note: number) { for (const v of this.voices) if (v.gate && v.note === note) { v.gate = false; v.amp.off(); v.fil.off(); } }
  private lfo(ph: number, shape: number, sh: number) { return shape === 0 ? Math.sin(TAU * ph) : shape === 1 ? 4 * Math.abs(ph - 0.5) - 1 : shape === 2 ? 1 - 2 * ph : shape === 3 ? (ph < 0.5 ? 1 : -1) : sh; }

  render(L: Float32Array, R: Float32Array, n: number) {
    for (let o = 0; o < n; o += BLK) this.block(L, R, o, Math.min(BLK, n - o));
  }
  private events(len: number) {
    const dt = len / this.sr;
    if (this.seqOn) {
      const a = this.pos, b = a + dt;
      for (const s of this.seq) { if (s.t >= a && s.t < b) { this.noteOn(s.note, s.vel ?? 0.8); this.pend.push({ at: s.t + s.d, note: s.note }); } }
      this.pend = this.pend.filter((e) => { if (e.at < b) { this.noteOff(e.note); return false; } return true; });
      this.pos = b;
      if (this.loop > 0 && this.pos >= this.loop) {
        // wrap, and start any note that falls in the sliver of the new pass this block already covers
        this.pos -= this.loop; this.pend.forEach((e) => (e.at -= this.loop));
        for (const s of this.seq) if (s.t < this.pos) { this.noteOn(s.note, s.vel ?? 0.8); this.pend.push({ at: s.t + s.d, note: s.note }); }
      } else if (!this.loop && !this.pend.length && this.seq.every((s) => s.t < a)) this.seqOn = false;
    }
    const p = this.p;
    if (p.arp > 0 && this.held.length) {
      this.arpT -= dt;
      if (this.arpT <= 0) {
        const step = (60 / p.bpm) * ADIV[Math.round(p.arpr)]; this.arpT += step; if (this.arpT < -step) this.arpT = 0;
        if (this.arpNote >= 0) this.rel(this.arpNote);
        const ns = [...this.held].sort((x, y) => x - y), m = Math.round(p.arp);
        if (m === 4) this.arpI = Math.floor(((this.rand() + 1) / 2) * ns.length) % ns.length;
        else if (m === 3 && ns.length > 1) { this.arpI += this.arpDir; if (this.arpI >= ns.length - 1) { this.arpI = ns.length - 1; this.arpDir = -1; } else if (this.arpI <= 0) { this.arpI = 0; this.arpDir = 1; } }
        else this.arpI = (this.arpI + 1) % ns.length;
        this.arpNote = ns[m === 2 ? ns.length - 1 - (this.arpI % ns.length) : this.arpI % ns.length]; this.trig(this.arpNote, 0.8);
      }
    } else { this.arpT = 0; if (this.arpNote >= 0 && !(p.arp > 0)) { this.rel(this.arpNote); this.arpNote = -1; this.held = []; } }
  }
  private block(L: Float32Array, R: Float32Array, off: number, len: number) {
    this.events(len);
    const p = this.p, sr = this.sr, dtB = len / sr;
    // modulators, once per block
    const r1 = p.l1sync > 0 ? p.bpm / 60 / LDIV[Math.round(p.l1div)] : p.l1r;
    this.l1 += r1 * dtB; if (this.l1 >= 1) { this.l1 -= Math.floor(this.l1); this.sh1 = this.rand(); }
    this.l2 += p.l2r * dtB; if (this.l2 >= 1) { this.l2 -= Math.floor(this.l2); this.sh2 = this.rand(); }
    const lf1 = this.lfo(this.l1, Math.round(p.l1s), this.sh1), lf2 = this.lfo(this.l2, Math.round(p.l2s), this.sh2);
    for (let i = 0; i < len; i++) L[off + i] = 0;
    const eng = Math.round(p.eng), uni = eng === 0 ? Math.max(1, Math.round(p.uni)) : 1, w1 = Math.round(p.o1w), w2 = Math.round(p.o2w), ft = Math.round(p.ft), two = p.fslope > 0.5;
    const kq = 2 * (1 - Math.min(1, p.res) * 0.985), dgain = 1 + p.drive * 7, smp = eng === 2 || eng === 3 ? sample(sr) : null;
    for (const v of this.voices) {
      if (!v.live) continue;
      const fade = p.l1fade > 0.01 ? Math.min(1, v.age / sr / p.l1fade) : 1, l1 = lf1 * fade;
      v.menv *= Math.exp(-4 * dtB / p.pdec);
      // mod matrix
      let mP = 0, mC = 0, mA = 0, mW = 0, mF = 0, mT = 0;
      for (let s = 1; s <= 3; s++) {
        const src = Math.round(p[`m${s}s`]), dst = Math.round(p[`m${s}d`]); if (!src || !dst) continue;
        const sv = src === 1 ? l1 : src === 2 ? lf2 : src === 3 ? v.menv : src === 4 ? v.vel : src === 5 ? this.wheel : src === 6 ? (v.note - 60) / 24 : this.after, a = sv * p[`m${s}a`];
        if (dst === 1) mP += a * 12; else if (dst === 2) mC += a * 4; else if (dst === 3) mA += a; else if (dst === 4) mW += a * 0.4; else if (dst === 5) mF += a * 4; else mT += a;
      }
      if (p.glide > 0.001) v.cur += (v.note - v.cur) * (1 - Math.exp(-4 * dtB / p.glide)); else v.cur = v.note;
      const semis = v.cur - 69 + this.bendV * p.bend + p.penv * v.menv + l1 * (p.l1p + this.wheel * p.mwv) + mP;
      const f0 = 440 * Math.pow(2, semis / 12), f1 = f0 * Math.pow(2, Math.round(p.o1oct)), f2 = f0 * Math.pow(2, Math.round(p.o2oct) + (Math.round(p.o2semi) + p.o2det / 100) / 12);
      const pw = Math.min(0.95, Math.max(0.05, p.pw + l1 * p.l1w + mW)), wt = p.wtpos + mT;
      const fmIdx = Math.max(0, p.fmi + mF) * (p.fmd > 0.01 ? Math.exp(-(v.age / sr) / (0.03 + 3 * (1 - p.fmd) * (1 - p.fmd))) : 1), fmHz = f1 * FM_RATIO[Math.round(p.fmr)], side = p.fma > 0.5;
      const fenvV = v.fil.v, velC = p.fvel * (v.vel - 0.5) * 4;
      let fc = p.cut * Math.pow(2, p.fenv * 7 * fenvV + (p.ktrk * (v.note - 60)) / 12 + l1 * p.l1f + mC + velC);
      fc = Math.min(sr * 0.45, Math.max(20, fc)); const g = Math.tan((Math.PI * fc) / sr);
      const velA = 1 - p.avel + p.avel * v.vel, ampMod = Math.max(0, 1 - p.l1a * (0.5 - 0.5 * l1) + mA), un = 1 / Math.sqrt(uni);
      const d1 = f1 / sr, d2 = f2 / sr, dS = f0 / 2 / sr;
      for (let i = 0; i < len; i++) {
        let x = 0;
        if (eng === 0) {
          v.mph += fmHz / sr; if (v.mph >= 1) v.mph -= 1;
          const mod = Math.sin(TAU * (v.mph + p.fmf * v.mprev * 0.35)); v.mprev = mod; const pm = side ? 0 : (fmIdx * mod) / TAU;
          for (let u = 0; u < uni; u++) {
            const det = uni > 1 ? Math.pow(2, (p.uspread * ((u / (uni - 1)) * 2 - 1)) / 1200) : 1;
            let a = v.ph1[u] + d1 * det, wrapped = false; if (a >= 1) { a -= 1; wrapped = true; } v.ph1[u] = a;
            let q = a + pm; q -= Math.floor(q); const s1 = wave(w1, q, d1, pw, wt);
            let b = v.ph2[u] + d2 * det; if (b >= 1) b -= 1; if (wrapped && p.sync > 0.5) b = (a / d1) * d2; v.ph2[u] = b;
            const s2 = p.o2lvl > 0 || p.ring > 0 ? wave(w2, b, d2, pw, wt) : 0;
            x += (s1 * p.o1lvl + s2 * p.o2lvl + s1 * s2 * p.ring) * un;
          }
          if (side) x += mod * Math.min(1, fmIdx / 4) * 0.7;
          if (p.sublvl > 0) { v.sub += dS; if (v.sub >= 1) v.sub -= 1; x += ((v.sub < 0.5 ? 1 : -1) + blep(v.sub, dS) - blep((v.sub + 0.5) % 1, dS)) * p.sublvl; }
          if (p.nlvl > 0) x += this.rand() * p.nlvl;
        } else if (eng === 1) {
          let a = v.ph1[0] + f0 / sr; if (a >= 1) a -= 1; v.ph1[0] = a; let sum = 0, tot = 0; const nh = Math.round(p.ah);
          for (let h = 1; h <= nh && h * f0 < sr * 0.45; h++) { const am = (h % 2 ? 1 : p.aeven) / Math.pow(h, p.atilt); sum += Math.sin(TAU * h * a) * am; tot += am; }
          x = (sum / Math.max(1, Math.sqrt(tot))) * 0.9;
        } else if (eng === 2 && smp) {
          const i0 = Math.floor(v.spos); x = i0 + 1 < smp.length ? (smp[i0] + (smp[i0 + 1] - smp[i0]) * (v.spos - i0)) * 1.4 : 0;
          v.spos += f0 / BASE_HZ; const ls = p.sstart * smp.length, le = Math.min(smp.length - 2, ls + p.slen * sr);
          if (p.sloop > 0.5 && v.spos >= le) v.spos -= le - ls;
        } else if (eng === 3 && smp) {
          v.gclock -= 1; if (v.gclock <= 0 && v.grains.length < 24) { v.gclock += sr / p.gdens; const st = Math.min(0.95, Math.max(0, p.gpos + this.rand() * p.gjit * 0.3)) * (smp.length - 1); v.grains.push({ p: st, n: 0, len: p.gsize * sr }); }
          for (let gi = v.grains.length - 1; gi >= 0; gi--) { const gr = v.grains[gi], i0 = Math.floor(gr.p); if (gr.n >= gr.len || i0 + 1 >= smp.length) { v.grains.splice(gi, 1); continue; } x += smp[i0] * (0.5 - 0.5 * Math.cos((TAU * gr.n) / gr.len)); gr.p += f0 / BASE_HZ; gr.n++; }
          x *= 1.2 / Math.sqrt(Math.max(1, p.gdens * p.gsize));
        } else if (v.ks) {
          const nI = (v.ksi + 1) % v.ksn, y = v.ks[v.ksi], w = 0.5 * (0.15 + 0.85 * p.kdamp), fb = v.gate ? 0.94 + 0.0595 * p.kdecay : 0.9;
          v.ks[v.ksi] = fb * ((1 - w) * y + w * v.ks[nI]); v.ksi = nI; x = y * 1.4;
        }
        if (p.drive > 0) x = Math.tanh(x * dgain) / Math.tanh(dgain) * (1 - p.drive * 0.3);
        let y = v.f1.run(x, g, kq, ft); if (two) y = v.f2.run(y, g, 1.2, ft === 3 ? 0 : ft);
        if (p.res > 0.9) y = Math.tanh(y);
        const av = eng === 4 ? (v.amp.step(0.002, 4, 1, Math.max(0.05, p.ar), sr)) : v.amp.step(p.aa, p.ad, p.as, p.ar, sr);
        v.fil.step(p.fa, p.fd, p.fs, p.fr, sr);
        L[off + i] += y * av * velA * ampMod * 0.5;
        v.age++;
      }
    }
    // effects
    const dFirst = p.fxo < 0.5, dg = 1 + p.dist * 24, dn = 1 / (1 + p.dist * 1.5), dT = Math.min(this.dl.length - 2, Math.floor(p.dtime * sr));
    const gLo = Math.pow(10, p.eqlo / 20), gHi = Math.pow(10, p.eqhi / 20), cLo = 1 - Math.exp((-TAU * 220) / sr), cHi = 1 - Math.exp((-TAU * 3000) / sr);
    const thr = 0.5 - p.comp * 0.42, ratio = 1 + p.comp * 9, makeup = 1 + p.comp * 1.8, rfb = 0.72 + p.rsize * 0.25, sc = sr / 44100;
    for (let i = 0; i < len; i++) {
      let x = L[off + i];
      if (dFirst && p.dist > 0) x = Math.tanh(x * dg) * dn;
      this.fxph += 1 / sr; const lc = Math.sin(TAU * 0.8 * this.fxph), lfz = Math.sin(TAU * 0.25 * this.fxph), lpz = Math.sin(TAU * 0.4 * this.fxph);
      if (p.cho > 0) { this.ch[this.chi] = x; const d = (0.016 + 0.005 * lc) * sr, rp = this.chi - d + 4096, i0 = Math.floor(rp), fr = rp - i0; x += p.cho * 0.8 * (this.ch[i0 & 2047] * (1 - fr) + this.ch[(i0 + 1) & 2047] * fr); this.chi = (this.chi + 1) & 2047; }
      if (p.pha > 0) { const cf = 0.2 + 0.6 * (0.5 + 0.5 * lpz); let a = x; for (let s = 0; s < 4; s++) { const o = -cf * a + this.ap[s]; this.ap[s] = a + cf * o; a = o; } x += p.pha * a; }
      if (p.fla > 0) { const d = (0.001 + 0.004 * (0.5 + 0.5 * lfz)) * sr, rp = this.fli - d + 1024, i0 = Math.floor(rp), fr = rp - i0, dv = this.fl[i0 & 511] * (1 - fr) + this.fl[(i0 + 1) & 511] * fr; this.fl[this.fli] = x + dv * 0.65; this.fli = (this.fli + 1) & 511; x += p.fla * dv; }
      this.elo += (x - this.elo) * cLo; this.ehi += (x - this.ehi) * cHi; x = x + (gLo - 1) * this.elo + (gHi - 1) * (x - this.ehi);
      if (p.dly > 0) { let ri = this.dli - dT; if (ri < 0) ri += this.dl.length; const dv = this.dl[ri]; this.dl[this.dli] = x + dv * p.dfb; x += dv * p.dly; } else this.dl[this.dli] = 0;
      this.dli = (this.dli + 1) % this.dl.length;
      if (p.rev > 0) {
        let wet = 0;
        for (let cI = 0; cI < 4; cI++) { const buf = this.combs[cI], n = Math.min(buf.length, Math.floor([1557, 1617, 1491, 1422][cI] * sc * (0.6 + p.rsize))), o = buf[this.ci[cI]]; this.cd[cI] = o * 0.75 + this.cd[cI] * 0.25; buf[this.ci[cI]] = x * 0.3 + this.cd[cI] * rfb; this.ci[cI] = (this.ci[cI] + 1) % n; wet += o; }
        for (let aI = 0; aI < 2; aI++) { const buf = this.aps[aI], o = buf[this.ai[aI]]; buf[this.ai[aI]] = wet + o * 0.5; wet = o - wet * 0.5; this.ai[aI] = (this.ai[aI] + 1) % buf.length; }
        x += wet * p.rev * 0.6;
      }
      if (!dFirst && p.dist > 0) x = Math.tanh(x * dg) * dn;
      if (p.comp > 0) { const ax = Math.abs(x); this.cenv += (ax - this.cenv) * (ax > this.cenv ? 0.02 : 0.0004); if (this.cenv > thr) x *= (thr + (this.cenv - thr) / ratio) / this.cenv; x *= makeup; }
      x *= p.vol * 1.3; if (x > 1.2 || x < -1.2) x = Math.tanh(x);
      L[off + i] = x; if (R !== L) R[off + i] = x;
    }
  }
}

/** Render a patch playing some notes to a mono buffer, without a browser. */
export function renderOffline(patch: Patch, seq: SeqNote[], seconds: number, sr = 44100): Float32Array {
  const e = new Engine(sr), n = Math.floor(seconds * sr), out = new Float32Array(n);
  e.setPatch(mkPatch(patch)); e.setSeq(seq, 0); e.render(out, out, n); return out;
}
