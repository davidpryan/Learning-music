// Synth mode, units 1 to 6: sound, oscillators, filters, envelopes, shaping over time, LFOs.
import { L, s, tr, u, Lesson, Fig, Step, Unlock } from './types';
import '../synth/exercises'; // registers exercises S1 to S14 before the skills table is built

export type P = Record<string, number>;
const TOPIC = ['', 'sound', 'osc', 'filter', 'env', 'shape', 'lfo', 'voices', 'fx', 'fx', 'fm', 'engines', 'panel'];
const SLOW = ['S6', 'S7', 'S10', 'S12', 'S15'];
/** A synth lesson. Its 5-question check asks each slow exercise (a full match or a recipe) once and fills the rest with quick ones. */
export const Y = (id: string, level: number, title: string, steps: Step[], unlocks: Unlock[], adds: string[] = []): Lesson => {
  const quick = unlocks.filter((x) => !SLOW.includes(x.ex)), fill = quick.length ? quick : [{ ex: 'S13', preset: { topic: TOPIC[level] } }];
  const quiz: { ex: string; preset: Record<string, any> }[] = unlocks.map((x) => ({ ex: x.ex, preset: x.preset }));
  for (let i = 0; quiz.length < 5; i++) quiz.push(fill[i % fill.length]);
  return L('S' + id, 'synth', level, title, steps, unlocks, { adds, quiz: unlocks.some((x) => SLOW.includes(x.ex)) ? quiz : undefined });
};
export const pf = (label: string, patch: P = {}, view?: 'wave' | 'spectrum' | 'env', seq?: string, vs?: P, vsLabel?: string): Fig => ({ patch, label, view, seq, vs, vsLabel });
export const pn = (panel: string[], patch: P = {}, view?: 'wave' | 'spectrum' | 'env', seq?: string, label?: string): Fig => ({ panel, patch, view, seq, label });
export const ab = (title: string, ctl: string | string[], base: P = {}, more: Record<string, any> = {}) => u('S1', title, { ctl: Array.isArray(ctl) ? ctl : [ctl], base, ...more });
export const nm = (title: string, q: string, opts: [string, P][], base: P = {}, seq = 'hold') => u('S2', title, { opts, base, seq, q });
export const chg = (title: string, ctls: string[], base: P = {}, seq = 'hold') => u('S3', title, { ctls, base, seq });
export const dir = (title: string, ctl: string, base: P = {}, seq = 'hold') => u('S4', title, { ctl: [ctl], base, seq });
export const m1 = (title: string, ctl: string, base: P = {}, more: Record<string, any> = {}) => u('S5', title, { ctl: [ctl], base, ...more });
export const mN = (title: string, ctls: string[], base: P = {}, more: Record<string, any> = {}) => u('S6', title, { ctls, base, ranges: {}, ...more });
export const scratch = (title: string, pats: [string, P][], ctls: string[], more: Record<string, any> = {}) => u('S7', title, { pats, ctls, ...more });
export const pic = (title: string, opts: [string, P][], view: string, base: P = {}, more: Record<string, any> = {}) => u('S8', title, { opts, view, base, ...more });
export const flow = (title: string, set: string) => u('S9', title, { set });
export const modq = (title: string, dests: string[], more: Record<string, any> = {}) => u('S11', title, { dests, ...more });
export const recipe = (title: string, id: string) => u('S12', title, { recipe: id });
export const quiz = (title: string, topic: string) => u('S13', title, { topic });
export const xl = (title: string, set: string) => u('S14', title, { set });

const WAVES4: [string, P][] = [['Sine', { o1w: 0 }], ['Triangle', { o1w: 1 }], ['Saw', { o1w: 2 }], ['Square', { o1w: 3 }]];
const SHAPES: [string, P][] = [['Pluck', { ad: 0.15, as: 0, ar: 0.1 }], ['Organ', { aa: 0.002, as: 1, ar: 0.02 }], ['Pad', { aa: 0.6, ar: 1.2 }], ['Swell', { aa: 0.95, ar: 0.25 }]];
const FTYPES: [string, P][] = [['Low-pass', { ft: 0 }], ['High-pass', { ft: 1 }], ['Band-pass', { ft: 2 }], ['Notch', { ft: 3 }]];

export const SYNTH_A: Lesson[] = [
  // ---------------- Unit 1: Sound itself ----------------
  Y('1.1', 1, 'Pitch is speed', [
    s('Sound is air vibrating. A synthesizer makes that vibration with electronics, and you shape it. Press play to hear the simplest sound there is.', pf('A plain tone', { o1w: 0 })),
    s('How fast the air vibrates sets the pitch. Faster is higher. We count the speed in hertz (Hz): vibrations per second.', pf('Slower: lower', { o1w: 0 }, 'wave', 'hold', { o1oct: 1 }, 'Faster: higher')),
    s('Doubling the speed raises the note by exactly one octave. Try telling two notes apart.', undefined, tr('S1', { ctl: ['o1oct'], base: { o1w: 0 }, lo: 0.5, hi: 1, gap: 0.25 })),
  ], [ab('Higher or lower', 'o1oct', { o1w: 0 }, { lo: 0.5, hi: 1, gap: 0.25 }), quiz('What sound is', 'sound')]),
  Y('1.2', 1, 'Loudness is size', [
    s('How far the air swings sets the loudness. A bigger swing is louder. The size of the swing is called amplitude.', pf('Quiet', { o1w: 0, vol: 0.25 }, 'wave', 'hold', { vol: 0.8 }, 'Loud')),
    s('Pitch and loudness are separate. You can change one without touching the other. Turn the volume and listen: the note stays the same.', pn(['vol'], { o1w: 0 })),
  ], [ab('Louder or quieter', 'vol', { o1w: 0 }, { lo: 0.15, hi: 0.8 })], ['vol']),
  Y('1.3', 1, 'Tone colour', [
    s('These two sounds have the same pitch and the same loudness. They still sound different. That difference is called timbre, or tone colour.', pf('Pure', { o1w: 0 }, undefined, 'hold', { o1w: 2 }, 'Buzzy')),
    s('Most of what a synthesizer does is shape timbre. Before any of the controls, train your ear on the two extremes: pure and buzzy.', undefined, tr('S2', { opts: [['Pure', { o1w: 0 }], ['Buzzy', { o1w: 2 }]], q: 'Is this tone pure or buzzy?' })),
  ], [nm('Pure or buzzy', 'Is this tone pure or buzzy?', [['Pure', { o1w: 0 }], ['Buzzy', { o1w: 2 }]])]),
  Y('1.4', 1, 'Harmonics', [
    s('A buzzy sound is really many pure tones stacked up. The lowest is the fundamental: the note you hear. The ones above are harmonics, at 2, 3, 4… times its frequency.', pf('One pure tone', { o1w: 0 }, 'spectrum', 'hold', { o1w: 2 }, 'A stack of harmonics')),
    s('The picture is a spectrum: low frequencies on the left, high on the right. The pure tone is one hump. The buzzy tone has a hump for every harmonic.'),
    s('More and louder harmonics mean a brighter sound. Fewer mean a darker one. That is the whole idea behind timbre.', pf('Dark', { cut: 400 }, 'spectrum', 'hold', { cut: 16000 }, 'Bright')),
  ], [quiz('Harmonics and timbre', 'sound'), pic('Pure or buzzy, from the spectrum', [['Pure', { o1w: 0 }], ['Buzzy', { o1w: 2 }]], 'spectrum')]),
  Y('1.5', 1, 'Reading a waveform', [
    s('A waveform picture shows the vibration itself: the air pressure going up and down over time. This one is smooth, so the sound is pure.', pf('A smooth wave', { o1w: 0 }, 'wave')),
    s('Sharp corners in a wave mean harmonics. The sharper the corners, the brighter the sound.', pf('Smooth', { o1w: 0 }, 'wave', 'hold', { o1w: 2 }, 'Sharp-cornered')),
    s('Match a picture to what you hear.', undefined, tr('S8', { opts: [['Pure', { o1w: 0 }], ['Buzzy', { o1w: 2 }]], view: 'wave', mode: 'pick' })),
  ], [pic('Smooth or sharp waveform', [['Pure', { o1w: 0 }], ['Buzzy', { o1w: 2 }]], 'wave')]),
  Y('1.6', 1, 'Reading a spectrum', [
    s('A spectrum shows what a sound is made of, not how it moves. It is the picture to reach for when you ask "how bright is this?"', pf('Dark', { cut: 400 }, 'spectrum', 'hold', { cut: 3000 }, 'Brighter')),
    s('The further the humps reach to the right, the brighter the sound. Here are three sounds: dark, medium and bright. Learn to tell them apart by eye and by ear.', pf('Medium', { cut: 1500 }, 'spectrum')),
  ], [pic('Dark, medium or bright', [['Dark', { cut: 350 }], ['Medium', { cut: 1500 }], ['Bright', { cut: 16000 }]], 'spectrum'), nm('Dark, medium or bright, by ear', 'How bright is this sound?', [['Dark', { cut: 350 }], ['Medium', { cut: 1500 }], ['Bright', { cut: 16000 }]])]),

  // ---------------- Unit 2: Oscillators ----------------
  Y('2.1', 2, 'The oscillator: sine and triangle', [
    s('The oscillator is where the sound starts. It repeats one wave shape over and over at the pitch of the note. The shape decides the raw tone.', pn(['o1w'], { o1w: 0 }, 'wave')),
    s('A sine is the pure tone from unit 1: no harmonics at all. A triangle adds a few quiet ones, so it is a touch brighter while staying soft.', pf('Sine', { o1w: 0 }, 'spectrum', 'hold', { o1w: 1 }, 'Triangle')),
  ], [nm('Sine or triangle', 'Which waveform is this?', [['Sine', { o1w: 0 }], ['Triangle', { o1w: 1 }]]), pic('Sine and triangle pictures', [['Sine', { o1w: 0 }], ['Triangle', { o1w: 1 }]], 'wave')], ['o1w']),
  Y('2.2', 2, 'Saw and square', [
    s('A saw wave has every harmonic. It is the brightest, buzziest shape, and the usual starting point for strings, brass and big leads.', pf('Saw', { o1w: 2 }, 'wave')),
    s('A square wave has only the odd harmonics: 1, 3, 5… That gap makes it sound hollow, a bit like a clarinet.', pf('Saw', { o1w: 2 }, 'spectrum', 'hold', { o1w: 3 }, 'Square')),
    s('Four shapes cover most of what you will meet: sine, triangle, saw, square.', undefined, tr('S2', { opts: WAVES4, q: 'Which waveform is this?' })),
  ], [nm('Name the waveform', 'Which waveform is this?', WAVES4), pic('Waveform pictures', WAVES4, 'wave')]),
  Y('2.3', 2, 'Pulse width', [
    s('A square wave spends half its time up and half down. A pulse wave lets you change that split. The control is called pulse width.', pn(['pw'], { o1w: 3 }, 'wave')),
    s('At 50% it is a square: full and hollow. As the pulse narrows, the sound gets thinner and more nasal.', pf('50%: square', { o1w: 3, pw: 0.5 }, 'spectrum', 'hold', { pw: 0.1 }, '10%: thin')),
  ], [ab('Fuller or thinner pulse', 'pw', { o1w: 3 }, { lo: 0.05, hi: 0.95 }), m1('Match the pulse width', 'pw', { o1w: 3 }, { view: 'wave', lo: 0.05, hi: 0.95, tolK: 1.3 })], ['pw']),
  Y('2.4', 2, 'Noise', [
    s('Noise is every frequency at once, with no pitch: a hiss. Synths use it for wind, breath, snares and hi-hats.', pf('Noise', { o1lvl: 0, nlvl: 0.8 }, 'spectrum')),
    s('The mixer sets how much of each source goes on to the rest of the synth. Blend a little noise into a tone to roughen it.', pn(['o1lvl', 'nlvl'], {}, 'spectrum')),
  ], [nm('Tone, noise or both', 'What is the source?', [['Tone only', {}], ['Tone and noise', { nlvl: 0.5 }], ['Noise only', { o1lvl: 0, nlvl: 0.8 }]]), ab('More or less noise', 'nlvl', {}, { lo: 0.05, hi: 0.9 })], ['o1lvl', 'nlvl']),
  Y('2.5', 2, 'Octaves', [
    s('The octave switch moves the oscillator up or down in whole octaves. Each step doubles or halves the frequency.', pn(['o1oct'], {}, undefined, 'hold')),
    s('On old synths the octave is marked in feet, like organ pipes: 16\' is low, 8\' is the middle, 4\' is high. Match an octave by ear.', undefined, tr('S5', { ctl: ['o1oct'], base: {}, view: 'none' })),
  ], [m1('Match the octave', 'o1oct', {}, { view: 'none', lo: 0, hi: 1 }), ab('Higher or lower octave', 'o1oct', {}, { gap: 0.25 })], ['o1oct']),
  Y('2.6', 2, 'Two oscillators', [
    s('Most synths have a second oscillator. Mixed in at the same pitch it just makes the sound louder. Tuned to a different pitch, it makes the sound bigger.', pn(['o2lvl', 'o2oct'], { o2lvl: 0.8 }, 'spectrum')),
    s('An octave up adds brightness. An octave down adds weight. Seven semitones up, a fifth, gives a hollow, powerful "power chord" on one key.', pf('An octave apart', { o2lvl: 0.8, o2oct: 1 }, undefined, 'hold', { o2oct: 0, o2semi: 7 }, 'A fifth apart')),
  ], [nm('One oscillator or two', 'How are the oscillators set?', [['One oscillator', {}], ['Two, an octave apart', { o2lvl: 0.8, o2oct: 1 }], ['Two, a fifth apart', { o2lvl: 0.8, o2semi: 7 }]]), m1('Match the oscillator 2 level', 'o2lvl', { o2oct: 1 }, { lo: 0.05, hi: 0.95, tolK: 1.6 })], ['o2w', 'o2lvl', 'o2oct', 'o2semi']),
  Y('2.7', 2, 'Detune', [
    s('Tune the second oscillator a tiny bit away from the first and the two drift in and out of step. You hear a slow beating that makes the sound thick and alive.', pn(['o2det'], { o2lvl: 0.8 }, undefined, 'long')),
    s('Detune is measured in cents: hundredths of a semitone. A few cents is a gentle shimmer. Twenty or more is a wide, wobbly chorus.', pf('5 cents', { o2lvl: 0.8, o2det: 5 }, undefined, 'long', { o2det: 30 }, '30 cents')),
  ], [ab('More or less detuned', 'o2det', { o2lvl: 0.8 }, { seq: 'long', lo: 0.05, hi: 0.9, gap: 0.35 }), m1('Match the detune', 'o2det', { o2lvl: 0.8 }, { seq: 'long', view: 'none', lo: 0.05, hi: 0.9, tolK: 1.8 })], ['o2det']),
  Y('2.8', 2, 'Sub oscillator and a two-oscillator tone', [
    s('A sub oscillator is a simple square wave one octave below the note. It adds weight without changing the character on top.', pn(['sublvl'], {}, 'spectrum')),
    s('You now have the whole sound source: two oscillators, a sub, noise, and a mixer. Rebuild a two-oscillator tone by ear.', undefined, tr('S6', { ctls: ['o1w', 'o2w', 'o2lvl'], base: { o2oct: 1 }, ranges: { o2lvl: [0.3, 0.95] }, view: 'wave', show: true, tolK: 2 })),
  ], [ab('More or less sub', 'sublvl', {}, { lo: 0.05, hi: 0.9 }), mN('Match a two-oscillator tone', ['o1w', 'o2w', 'o2lvl'], { o2oct: 1 }, { ranges: { o2lvl: [0.3, 0.95] }, view: 'wave', show: true, tolK: 2 })], ['sublvl']),

  // ---------------- Unit 3: Filters ----------------
  Y('3.1', 3, 'The low-pass filter', [
    s('The oscillator makes a bright sound. The filter takes parts of it away. This way of working, start bright and remove, is called subtractive synthesis.', pn(['cut'], {}, 'spectrum')),
    s('A low-pass filter lets the lows pass and removes the highs. The cutoff sets where the removing starts. Lower cutoff, darker sound.', pf('Cutoff high', {}, 'spectrum', 'hold', { cut: 500 }, 'Cutoff low')),
    s('Cutoff is the most-used control on any synth. Match one with the picture to help.', undefined, tr('S5', { ctl: ['cut'], base: {}, show: true })),
  ], [ab('Brighter or darker', 'cut', {}, { lo: 0.2, hi: 0.95 }), m1('Match the cutoff', 'cut', {}, { lo: 0.25, hi: 0.95 })], ['cut']),
  Y('3.2', 3, 'Cutoff by ear', [
    s('Pictures help at first, but the skill is hearing it. Listen for where the brightness stops: a low cutoff sounds muffled, a middle one "ooh", a high one "aah".', pf('Muffled', { cut: 300 }, undefined, 'hold', { cut: 2500 }, 'Open')),
    s('When you compare, flip between the target and yours quickly. Your ear remembers brightness for only a second or two.'),
  ], [dir('Cutoff: which way, how far', 'cut'), m1('Match the cutoff by ear', 'cut', {}, { lo: 0.25, hi: 0.95, show: false, view: 'none' })]),
  Y('3.3', 3, 'Resonance', [
    s('Resonance boosts a narrow band right at the cutoff. A little adds a nasal edge. A lot gives a whistle that follows the cutoff as it moves.', pn(['res', 'cut'], { cut: 900 }, 'spectrum')),
    s('In the spectrum, resonance is a peak at the edge of the filter. Listen for that ringing tone on top of the sound.', pf('No resonance', { cut: 900 }, 'spectrum', 'hold', { res: 0.8 }, 'High resonance')),
  ], [ab('More or less resonance', 'res', { cut: 900 }, { lo: 0, hi: 0.95 }), m1('Match the resonance', 'res', { cut: 900 }, { lo: 0, hi: 0.95 })], ['res']),
  Y('3.4', 3, 'Cutoff and resonance together', [
    s('The two controls work as a pair. Cutoff chooses where; resonance chooses how sharply that spot stands out.', pn(['cut', 'res'], { cut: 1200, res: 0.3 }, 'spectrum')),
    s('When matching both, set the cutoff first using the overall brightness. Then listen only for the whistle and set the resonance.'),
  ], [chg('Cutoff or resonance?', ['cut', 'res'], { cut: 1200, res: 0.35 }), mN('Match cutoff and resonance', ['cut', 'res'], {}, { ranges: { cut: [0.35, 0.8], res: [0.05, 0.85] }, show: true })]),
  Y('3.5', 3, 'The high-pass filter', [
    s('A high-pass filter is the reverse: it lets the highs pass and removes the lows. Raise the cutoff and the body of the sound drains away, leaving it thin.', pn(['ft', 'cut'], { ft: 1, cut: 400 }, 'spectrum')),
    s('High-pass is how you make room for a bass under a pad, or turn noise into a hi-hat.', pf('Low-pass at 700 Hz', { cut: 700 }, 'spectrum', 'hold', { ft: 1 }, 'High-pass at 700 Hz')),
  ], [nm('Low-pass or high-pass', 'Which filter type is this?', [['Low-pass', { ft: 0 }], ['High-pass', { ft: 1 }]], { cut: 700 }), m1('Match a high-pass cutoff', 'cut', { ft: 1 }, { lo: 0.15, hi: 0.7 })], ['ft']),
  Y('3.6', 3, 'Band-pass and notch', [
    s('A band-pass filter keeps only a band around the cutoff and removes both sides. It sounds like a voice through a telephone.', pf('Band-pass', { ft: 2, cut: 1000, res: 0.3 }, 'spectrum')),
    s('A notch does the opposite: it removes a narrow band and leaves the rest. It is subtle until the cutoff moves.', pf('Notch', { ft: 3, cut: 1000, res: 0.3 }, 'spectrum')),
  ], [nm('Name the filter type', 'Which filter type is this?', FTYPES, { cut: 900, res: 0.3 }), pic('Filter types from the spectrum', FTYPES, 'spectrum', { cut: 900, res: 0.3 })]),
  Y('3.7', 3, 'Slope: 12 and 24 dB', [
    s('Past the cutoff, a filter does not stop dead: it fades the sound out. The slope says how fast. A 24 dB filter fades twice as steeply as a 12 dB one.', pf('12 dB', { cut: 800 }, 'spectrum', 'hold', { fslope: 1 }, '24 dB')),
    s('12 dB sounds open and buzzy even when closed down. 24 dB sounds rounder and darker at the same cutoff: the classic fat synth bass.', pn(['fslope', 'cut'], { cut: 800 }, 'spectrum')),
  ], [pic('12 or 24 dB', [['12 dB', { fslope: 0 }], ['24 dB', { fslope: 1 }]], 'spectrum', { cut: 800 }), quiz('Filter facts', 'filter')], ['fslope']),
  Y('3.8', 3, 'Key tracking and self-oscillation', [
    s('With a fixed cutoff, high notes lose more of their harmonics than low notes, so the top of the keyboard sounds dull. Key tracking raises the cutoff as you play higher.', pn(['ktrk'], { cut: 500 }, undefined, 'keys')),
    s('Turn resonance all the way up and the filter starts to ring on its own at the cutoff frequency. With full key tracking you can even play that whistle as a note.', pf('Resonance at maximum', { cut: 700, res: 1 }, 'spectrum')),
  ], [ab('More or less key tracking', 'ktrk', { cut: 500 }, { seq: 'keys', lo: 0, hi: 1, gap: 0.6 }), quiz('How filters behave', 'filter')], ['ktrk']),
  Y('3.9', 3, 'Drive, and matching by ear', [
    s('Drive pushes the sound hard into the filter so it starts to clip. That adds grit and makes the sound seem louder and fuller.', pn(['drive'], { cut: 1500 }, 'wave')),
    s('You now know the whole filter. The test for this unit: match both cutoff and resonance with no picture of the target.', undefined, tr('S6', { ctls: ['cut', 'res'], base: {}, ranges: { cut: [0.35, 0.8], res: [0.05, 0.85] }, show: false })),
  ], [ab('More or less drive', 'drive', { cut: 1500 }, { lo: 0, hi: 1, gap: 0.45 }), mN('Match cutoff and resonance by ear', ['cut', 'res'], {}, { ranges: { cut: [0.35, 0.8], res: [0.05, 0.85] }, show: false, tolK: 1.2 })], ['drive']),

  // ---------------- Unit 4: Amp envelope ----------------
  Y('4.1', 4, 'Attack', [
    s('So far every note has switched on and off like a light. The amp envelope shapes the loudness of each note over time. It has four stages. The first is attack.', pn(['aa'], {}, 'env', 'gate')),
    s('Attack is how long the note takes to reach full loudness. Short attack: the note hits. Long attack: it swells in.', pf('Fast attack', {}, 'env', 'gate', { aa: 0.6 }, 'Slow attack')),
  ], [ab('Faster or slower attack', 'aa', {}, { seq: 'gate', lo: 0.1, hi: 0.8 }), m1('Match the attack', 'aa', {}, { seq: 'gate', view: 'env', lo: 0.1, hi: 0.8 })], ['aa']),
  Y('4.2', 4, 'Release', [
    s('Release is what happens after you let go of the key: how long the note takes to fade to silence.', pn(['ar'], {}, 'env', 'gate')),
    s('Short release: the note stops with your finger. Long release: it rings on, and notes overlap into a wash.', pf('Short release', { ar: 0.03 }, 'env', 'gate', { ar: 1.2 }, 'Long release')),
  ], [ab('Shorter or longer release', 'ar', {}, { seq: 'gate', lo: 0.15, hi: 0.85 }), m1('Match the release', 'ar', {}, { seq: 'gate', view: 'env', lo: 0.15, hi: 0.85 })], ['ar']),
  Y('4.3', 4, 'Sustain', [
    s('Sustain is the level the note settles at while the key is held. It is the only one of the four that is a level, not a time.', pn(['as'], { ad: 0.25 }, 'env', 'gate')),
    s('Full sustain: the note holds at full loudness like an organ. Zero sustain: the note dies away even if you keep holding, like a plucked string.', pf('Full sustain', { ad: 0.25 }, 'env', 'gate', { as: 0.2 }, 'Low sustain')),
  ], [ab('Higher or lower sustain', 'as', { ad: 0.25 }, { seq: 'gate', lo: 0.05, hi: 0.95 }), m1('Match the sustain', 'as', { ad: 0.25 }, { seq: 'gate', view: 'env', lo: 0.05, hi: 0.95 })], ['as']),
  Y('4.4', 4, 'Decay', [
    s('Decay is the time the note takes to fall from its peak to the sustain level. Together they shape the body of the note.', pn(['ad', 'as'], { as: 0.2 }, 'env', 'gate')),
    s('If sustain is at full, there is nowhere to fall to, so decay does nothing. Whenever decay seems broken, check the sustain.', pf('Short decay', { as: 0.15, ad: 0.08 }, 'env', 'gate', { ad: 0.6 }, 'Long decay')),
  ], [ab('Shorter or longer decay', 'ad', { as: 0.15 }, { seq: 'gate', lo: 0.3, hi: 0.72 }), m1('Match the decay', 'ad', { as: 0.15 }, { seq: 'gate', view: 'env', lo: 0.3, hi: 0.72 })], ['ad']),
  Y('4.5', 4, 'ADSR, gate and trigger', [
    s('Attack, decay, sustain, release: ADSR. Pressing a key sends a gate, which stays on for as long as the key is down. Attack and decay run, sustain holds, and release starts when the gate ends.', pf('One note, all four stages', { aa: 0.15, ad: 0.3, as: 0.5, ar: 0.6 }, 'env', 'gate')),
    s('A trigger is just the instant a note starts. Drum sounds only need a trigger: with no sustain, it does not matter how long you hold.'),
  ], [chg('Which stage changed?', ['aa', 'ad', 'as', 'ar'], { aa: 0.03, ad: 0.25, as: 0.5, ar: 0.25 }, 'gate'), quiz('Envelope stages', 'env')]),
  Y('4.6', 4, 'Four classic shapes', [
    s('Most sounds use one of four envelope shapes. Pluck: instant on, quick fall, no sustain. Organ: instant on, hold, instant off.', pf('Pluck', SHAPES[0][1], 'env', 'gate', SHAPES[1][1], 'Organ')),
    s('Pad: slow in, hold, slow out. Swell: very slow in, then gone quickly. Learn these four and you can guess any envelope from one listen.', pf('Pad', SHAPES[2][1], 'env', 'gate', SHAPES[3][1], 'Swell')),
  ], [nm('Name the envelope shape', 'Which envelope shape is this?', SHAPES, {}, 'gate'), pic('Envelope shapes as pictures', SHAPES, 'env', {}, { seq: 'gate' })]),
  Y('4.7', 4, 'Draw the envelope', [
    s('Time to set all four stages by ear. Work in order: attack first (how does it start?), then release (how does it end?), then sustain and decay for the middle.', pn(['aa', 'ad', 'as', 'ar'], { ad: 0.3, as: 0.5 }, 'env', 'gate')),
    s('The picture shows your own note only. The target you have to hear.', undefined, tr('S10', {})),
  ], [u('S10', 'Draw the envelope you hear', {}), scratch('Rebuild four envelope shapes', SHAPES, ['aa', 'ad', 'as', 'ar'], { seq: 'gate', view: 'env', tolK: 2 })]),

  // ---------------- Unit 5: Shaping over time ----------------
  Y('5.1', 5, 'The filter envelope', [
    s('A second envelope can move the filter cutoff during each note, so the tone changes as the note plays. Envelope amount sets how far it pushes the cutoff.', pn(['fenv', 'cut'], { cut: 300, fd: 0.4, res: 0.2 }, 'env', 'gate')),
    s('Set the cutoff low, then turn the amount up: each note now starts bright and closes down. This is the sound of most synth basses and plucks.', pf('No envelope', { cut: 300, fd: 0.4 }, undefined, 'gate', { fenv: 0.6 }, 'With envelope')),
  ], [ab('Bigger or smaller filter sweep', 'fenv', { cut: 300, fd: 0.4, res: 0.2 }, { seq: 'gate', lo: 0.5, hi: 1, gap: 0.2 }), m1('Match the envelope amount', 'fenv', { cut: 300, fd: 0.4, res: 0.2 }, { seq: 'gate', view: 'none', lo: 0.5, hi: 1, tolK: 1.4 })], ['fenv', 'fd']),
  Y('5.2', 5, 'Filter decay', [
    s('The filter envelope has its own decay: how long the brightness takes to fall away. Short gives a "pew" or a pluck. Long gives a slow "wow".', pn(['fd'], { cut: 300, fenv: 0.6, res: 0.2 }, undefined, 'gate')),
    s('Because the amp envelope is separate, a note can stay loud while its brightness fades. That independence is what makes synth sounds feel alive.', pf('Fast filter decay', { cut: 300, fenv: 0.6, fd: 0.08 }, undefined, 'gate', { fd: 0.7 }, 'Slow filter decay')),
  ], [ab('Faster or slower filter sweep', 'fd', { cut: 300, fenv: 0.6, res: 0.2 }, { seq: 'gate', lo: 0.3, hi: 0.75 }), m1('Match the filter decay', 'fd', { cut: 300, fenv: 0.6, res: 0.2 }, { seq: 'gate', view: 'none', lo: 0.3, hi: 0.75, tolK: 1.4 })]),
  Y('5.3', 5, 'A full filter envelope', [
    s('The filter envelope has all four stages. Attack makes the tone open up after the note starts, which is the "bwah" of brass. Sustain sets how bright the held note stays.', pn(['fa', 'fd', 'fs', 'fr'], { cut: 300, fenv: 0.6, fd: 0.3 }, undefined, 'gate')),
    s('Listen for two things: does the brightness rise at the start (attack), and where does it settle (sustain)?', pf('Instant brightness', { cut: 300, fenv: 0.6, fd: 0.3 }, undefined, 'gate', { fa: 0.15, fs: 0.6 }, 'Rising, then holding')),
  ], [chg('Which filter envelope stage changed?', ['fa', 'fd', 'fs'], { cut: 300, fenv: 0.6, fa: 0.03, fd: 0.25, fs: 0.4 }, 'gate'), mN('Match filter attack and sustain', ['fa', 'fs'], { cut: 300, fenv: 0.6, fd: 0.3 }, { seq: 'gate', view: 'none', ranges: { fa: [0.15, 0.65], fs: [0.05, 0.9] }, tolK: 1.8 })], ['fa', 'fs', 'fr']),
  Y('5.4', 5, 'Negative amounts', [
    s('Envelope amount can go below zero. Then the envelope pulls the cutoff down at the start of the note and lets it come back up: each note starts dark and opens.', pf('Positive: bright, then dark', { cut: 400, fenv: 0.6, fd: 0.4 }, undefined, 'gate', { cut: 5000, fenv: -0.6 }, 'Negative: dark, then bright')),
    s('Many controls on a synth are like this: zero in the middle, with opposite effects either side.'),
  ], [nm('Positive, negative or none', 'What is the filter envelope doing?', [['Bright, then closing (positive)', { cut: 400, fenv: 0.6 }], ['Dark, then opening (negative)', { cut: 5000, fenv: -0.6 }], ['Nothing (no envelope)', { cut: 1500 }]], { fd: 0.4 }, 'gate')]),
  Y('5.5', 5, 'Velocity', [
    s('Velocity is how hard you hit a key. A synth can use it to change the sound: louder, brighter, or both. This phrase alternates soft and hard notes.', pn(['avel', 'fvel'], { avel: 0, cut: 600 }, undefined, 'vel')),
    s('Velocity to volume makes hard notes louder. Velocity to cutoff makes them brighter, the way a real instrument gets brighter when played harder.', pf('To volume', { avel: 1 }, undefined, 'vel', { avel: 0, fvel: 0.8, cut: 600 }, 'To brightness')),
  ], [nm('Where does velocity go?', 'Soft and hard notes alternate. What does playing harder change?', [['Nothing', { avel: 0 }], ['Volume', { avel: 1 }], ['Brightness', { avel: 0, fvel: 0.8, cut: 600 }]], {}, 'vel')], ['avel', 'fvel']),
  Y('5.6', 5, 'The pitch envelope', [
    s('An envelope can also move pitch. A quick drop at the very start of a note adds a "thwip" or a thump: it is how synth drums and laser sounds are made.', pn(['penv', 'pdec'], { o1w: 0, penv: 12 }, undefined, 'stab')),
    s('Amount sets how far above the note the pitch starts. Decay sets how fast it falls to the real note.', pf('Fast drop', { penv: 12, pdec: 0.04 }, undefined, 'stab', { pdec: 0.5 }, 'Slow drop')),
  ], [nm('Pitch envelope: none, fast or slow', 'What does the pitch do at the start of each note?', [['Nothing', {}], ['Drops fast', { penv: 12, pdec: 0.04 }], ['Drops slowly', { penv: 12, pdec: 0.5 }]], {}, 'stab'), ab('Bigger or smaller pitch drop', 'penv', { pdec: 0.15 }, { seq: 'stab', lo: 0.55, hi: 1, gap: 0.2 })], ['penv', 'pdec']),
  Y('5.7', 5, 'Audio path and control path', [
    s('There are two kinds of signal in a synth. The audio path carries the sound: oscillator, then filter, then amplifier. You can hear it.'),
    s('The control path carries movement: envelopes, velocity and the keyboard. You never hear these directly. They only turn the knobs of the audio path for you.'),
    s('When a patch is silent or will not change, trace the audio path first, then ask what is controlling each stage.', undefined, tr('S9', { set: 'basic' })),
  ], [flow('Trace the signal', 'basic'), quiz('Envelopes, velocity and paths', 'shape')]),
  Y('5.8', 5, 'Build a pluck and a brass stab', [
    s('A brief describes a sound in words. Any patch that fits the brief passes: there is no single right answer. First, a pluck.', pf('One pluck that fits', { ad: 0.18, as: 0, ar: 0.12, cut: 900, fenv: 0.4, fd: 0.15 }, 'env', 'pluck')),
    s('Brass needs the filter to open just after the note starts. That takes a filter envelope with a short attack.', pf('One brass stab that fits', { cut: 400, fenv: 0.45, fa: 0.08, fd: 0.4, fs: 0.6, aa: 0.03 }, undefined, 'stab')),
  ], [recipe('Build a pluck', 'pluck'), recipe('Build a brass stab', 'brass')]),

  // ---------------- Unit 6: LFOs ----------------
  Y('6.1', 6, 'The LFO and vibrato', [
    s('An LFO is a low-frequency oscillator: too slow to hear as a note, so it is used to move other controls back and forth, over and over.', pn(['l1r', 'l1p'], { l1p: 0.5 }, undefined, 'long')),
    s('Sent to pitch, an LFO gives vibrato. Rate is how fast it wobbles. Natural vibrato sits around 5 or 6 times a second.', pf('Slow', { l1p: 0.5, l1r: 2 }, undefined, 'long', { l1r: 8 }, 'Fast')),
  ], [ab('Faster or slower LFO', 'l1r', { l1p: 0.5 }, { seq: 'long', lo: 0.3, hi: 0.9 }), m1('Match the LFO rate', 'l1r', { l1p: 0.5 }, { seq: 'long', view: 'none', lo: 0.3, hi: 0.9, tolK: 1.2 })], ['l1r', 'l1p']),
  Y('6.2', 6, 'Depth', [
    s('Depth is how far the LFO moves its target. A little pitch depth is a gentle vibrato. A lot is a siren.', pn(['l1p'], { l1r: 5.5 }, undefined, 'long')),
    s('Rate and depth are the two questions to ask of any modulation: how fast, and how much?', pf('Shallow', { l1r: 5.5, l1p: 0.2 }, undefined, 'long', { l1p: 2 }, 'Deep')),
  ], [ab('Deeper or shallower vibrato', 'l1p', { l1r: 5.5 }, { seq: 'long', lo: 0.01, hi: 0.25, gap: 0.08 }), chg('Rate or depth?', ['l1r', 'l1p'], { l1r: 4, l1p: 1.2 }, 'long')]),
  Y('6.3', 6, 'Tremolo and filter wobble', [
    s('The same LFO sent to volume gives tremolo: the loudness pulses. Sent to the filter cutoff it gives a rhythmic "wah-wah" or, slowly, a gentle sweep.', pn(['l1a', 'l1f'], { cut: 700, res: 0.3, l1r: 3 }, undefined, 'long')),
    s('What an LFO is sent to is its destination. Hearing the destination is the first step in copying any moving sound.', undefined, tr('S11', { dests: ['l1p', 'l1f', 'l1a'] })),
  ], [modq('What is the LFO moving?', ['l1p', 'l1f', 'l1a'])], ['l1a', 'l1f']),
  Y('6.4', 6, 'LFO shapes', [
    s('An LFO has a wave shape, just like an audio oscillator. Sine and triangle glide smoothly. Saw ramps and then jumps. Square flips between two values.', pn(['l1s'], { l1f: 2, cut: 600, res: 0.3, l1r: 3 }, undefined, 'long')),
    s('Random, also called sample and hold, jumps to a new level every cycle. On the filter it gives the bubbling computer sound of old science fiction.', pf('Square', { l1f: 2, cut: 600, res: 0.3, l1r: 3, l1s: 3 }, undefined, 'long', { l1s: 4 }, 'Random')),
  ], [nm('Name the LFO shape', 'An LFO is moving the filter. Which shape is it?', [['Sine', { l1s: 0 }], ['Saw', { l1s: 2 }], ['Square', { l1s: 3 }], ['Random', { l1s: 4 }]], { l1f: 2, cut: 600, res: 0.3, l1r: 3 }, 'long')], ['l1s']),
  Y('6.5', 6, 'Pulse-width modulation', [
    s('Send a slow LFO to pulse width and one oscillator starts to shimmer and thicken, almost as if there were two. This is pulse-width modulation, or PWM.', pn(['l1w', 'l1r'], { o1w: 3, pw: 0.5, l1r: 1.5, l1w: 0.3 }, 'wave', 'long')),
    s('PWM is the sound of classic string machines and many 1980s pads.', pf('Plain pulse', { o1w: 3 }, undefined, 'long', { l1w: 0.38, l1r: 1.5 }, 'With PWM')),
  ], [modq('Find the destination, including pulse width', ['l1p', 'l1f', 'l1a', 'l1w']), ab('More or less PWM', 'l1w', { o1w: 3, l1r: 1.5 }, { seq: 'long', lo: 0, hi: 0.95, gap: 0.45 })], ['l1w']),
  Y('6.6', 6, 'Tempo sync', [
    s('With sync on, the LFO rate locks to the tempo and is set in note lengths: a quarter note, an eighth, a sixteenth. The wobble now lands on the beat.', pn(['l1sync', 'l1div'], { l1sync: 1, l1f: 2.5, cut: 500, res: 0.3, l1s: 2, l1div: 3 }, undefined, 'long')),
    s('A synced saw LFO on the filter is the rhythmic "wub" of modern bass music.', pf('1/4 notes', { l1sync: 1, l1f: 2.5, cut: 500, l1s: 2, l1div: 2 }, undefined, 'long', { l1div: 4 }, '1/16 notes')),
  ], [nm('How fast is the synced wobble?', 'The tempo is 120. Which note length is the LFO set to?', [['1/4', { l1div: 2 }], ['1/8', { l1div: 3 }], ['1/16', { l1div: 4 }]], { l1sync: 1, l1f: 2.5, cut: 500, res: 0.3, l1s: 2 }, 'long')], ['l1sync', 'l1div', 'bpm']),
  Y('6.7', 6, 'Fade-in', [
    s('A singer adds vibrato only once a note has been held for a moment. LFO fade-in does the same: short notes stay clean, long notes bloom.', pn(['l1fade'], { l1p: 0.5, l1r: 5.5 }, undefined, 'long')),
    s('Some synths call this LFO delay. It is one of the small touches that makes a lead sound played rather than programmed.', pf('Vibrato at once', { l1p: 0.5, l1r: 5.5 }, undefined, 'long', { l1fade: 1.5 }, 'Vibrato fades in')),
  ], [ab('Sooner or later vibrato', 'l1fade', { l1p: 0.5, l1r: 5.5 }, { seq: 'long', lo: 0, hi: 0.7, gap: 0.4 }), quiz('LFO facts', 'lfo')], ['l1fade']),
  Y('6.8', 6, 'Describe any modulation', [
    s('To copy a moving sound, answer three questions in order. What is moving: pitch, tone, loudness? How fast? What shape: smooth, flipping, or random?'),
    s('Then match a wobble by ear: set the rate first, then the depth.', undefined, tr('S11', { dests: ['l1p', 'l1f', 'l1a'], shapes: true, rates: true })),
  ], [modq('Destination, speed and shape', ['l1p', 'l1f', 'l1a'], { shapes: true, rates: true }), mN('Match a filter wobble', ['l1r', 'l1f'], { cut: 600, res: 0.3 }, { seq: 'long', view: 'none', ranges: { l1r: [0.3, 0.85], l1f: [0.15, 0.9] }, tolK: 1.8 })]),
];
