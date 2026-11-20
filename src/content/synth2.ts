// Synth mode, units 7 to 12: voices, effects, recipes, FM and friends, other engines, and reading any synth.
import { s, tr, u, Lesson } from './types';
import { Y, P, pf, pn, ps, ab, nm, chg, m1, mN, scratch, pic, flow, recipe, quiz, xl } from './synth1';
import { RECIPES } from '../synth/bank';

const eg = (id: string) => ({ ...RECIPES[id].base, ...RECIPES[id].ref });
const FM: P = { o1w: 0 };
const ENGINES: [string, P][] = [['Subtractive', { eng: 0, cut: 1200, fenv: 0.3 }], ['Additive', { eng: 1 }], ['Sampler', { eng: 2 }], ['Granular', { eng: 3 }], ['Plucked string', { eng: 4 }]];
const CLIPS_A: [string, P][] = [['Dark detuned bass', { o2lvl: 0.8, o2det: 18, cut: 450, res: 0.2 }], ['Bright pluck', { cut: 700, fenv: 0.5, fd: 0.15, ad: 0.2, as: 0, ar: 0.15 }], ['Soft pad', { o1w: 1, o2lvl: 0.6, o2det: 10, cut: 2000, aa: 0.5, ar: 1 }]];
const CLIPS_B: [string, P][] = [['Hollow lead', { o1w: 3, cut: 2500, res: 0.3, ar: 0.25 }], ['Squelchy bass', { cut: 350, res: 0.7, fenv: 0.5, fd: 0.2, ad: 0.3, as: 0.4 }], ['Slow string swell', { o2lvl: 0.7, o2det: 14, cut: 1500, aa: 0.8, ar: 0.8 }]];
const CLIP_CTLS = ['o1w', 'o2lvl', 'o2det', 'cut', 'res', 'fenv', 'fd', 'aa', 'ad', 'as', 'ar'];

export const SYNTH_B: Lesson[] = [
  // ---------------- Unit 7: Voices and playing ----------------
  Y('7.1', 7, 'Mono and poly', [
    s('A poly synth can sound several notes at once, each with its own oscillators, filter and envelopes. Each of those is called a voice.', pf('Poly: a chord', {}, undefined, 'chord')),
    s('A mono synth has one voice. Press three keys and you hear one note. That limit is useful: basses and leads stay clean and never smear.', pf('Poly', {}, undefined, 'chord', { mono: 1 }, 'Mono')),
  ], [nm('Poly or mono', 'Three keys are pressed together. Is the synth poly or mono?', [['Poly', { mono: 0 }], ['Mono', { mono: 1 }]], {}, 'chord'), quiz('Voices', 'voices')], ['mono']),
  Y('7.2', 7, 'Legato', [
    s('On a mono synth, what happens when you press a new key before letting go of the last? With legato off, the envelopes restart: every note gets its own attack.', pf('Legato off', { mono: 1, cut: 400, fenv: 0.5, fd: 0.2 }, undefined, 'slide')),
    s('With legato on, the envelopes carry on and only the pitch changes. Overlapping notes flow into each other; separate notes still restart.', pf('Legato off', { mono: 1, cut: 400, fenv: 0.5, fd: 0.2 }, undefined, 'slide', { leg: 1 }, 'Legato on')),
  ], [nm('Legato on or off', 'Two notes overlap. Does the second note restart the envelope?', [['It restarts (legato off)', { leg: 0 }], ['It flows on (legato on)', { leg: 1 }]], { mono: 1, cut: 400, fenv: 0.5, fd: 0.2 }, 'slide')], ['leg']),
  Y('7.3', 7, 'Glide', [
    s('Glide slides the pitch from the last note to the new one. The control sets how long the slide takes. It is also called portamento.', pn(['glide'], { mono: 1, leg: 1 }, undefined, 'slide')),
    s('A short glide adds a vocal quality to leads and a rubbery feel to basses. A long one is a special effect.', pf('No glide', { mono: 1, leg: 1 }, undefined, 'slide', { glide: 0.25 }, 'With glide')),
  ], [ab('Faster or slower glide', 'glide', { mono: 1, leg: 1 }, { seq: 'slide', lo: 0, hi: 0.6, gap: 0.2 }), m1('Match the glide', 'glide', { mono: 1, leg: 1 }, { seq: 'slide', view: 'none', lo: 0, hi: 0.6, tolK: 1.3 })], ['glide']),
  Y('7.4', 7, 'Unison', [
    s('Unison stacks several copies of the voice on every note and detunes them against each other. One key sounds like a whole section.', pn(['uni', 'uspread'], { uni: 3 }, undefined, 'hold')),
    s('Spread sets how far apart the copies are tuned. Narrow is thick. Wide is the huge, shimmering "supersaw".', pf('1 voice', {}, 'spectrum', 'hold', { uni: 5, uspread: 25 }, '5 voices, spread wide')),
  ], [nm('How many unison voices?', 'How many voices are stacked on this note?', [['1 voice', { uni: 1 }], ['3 voices', { uni: 3 }], ['5 voices', { uni: 5 }]], { uspread: 20 }, 'long'), ab('Wider or narrower spread', 'uspread', { uni: 5 }, { seq: 'long', lo: 0.05, hi: 0.95, gap: 0.4 })], ['uni', 'uspread']),
  Y('7.5', 7, 'Pitch bend and mod wheel', [
    s('Beside most keyboards sit two wheels. The pitch wheel bends the note up or down and springs back when you let go. Bend range sets how far it reaches.'),
    s('The mod wheel stays where you leave it. It is usually set to bring in vibrato, so you can add it by hand exactly when you want.'),
  ], [quiz('Wheels and playing controls', 'voices')], ['bend', 'mwv']),
  Y('7.6', 7, 'Aftertouch, and other names', [
    s('Aftertouch is pressure: pushing harder on a key that is already down. Like the mod wheel it can be sent to vibrato, brightness or anything else.'),
    s('Velocity, wheels and aftertouch are all sources of control, like envelopes and LFOs. The difference is that you play them. Other synths name their sections differently; start learning the translations.', undefined, tr('S14', { set: 'basic' })),
  ], [xl('Other names for the basics', 'basic'), quiz('Playing a synth', 'voices')]),
  Y('7.7', 7, 'Build a singing lead', [
    s('A lead line should sing: one note at a time, a little glide between notes, and vibrato that arrives only on the long notes.', pf('One lead that fits', eg('lead'), undefined, 'lead')),
    s('Every part of that sentence is a setting you know. Build it from a plain patch.'),
  ], [recipe('Build a mono lead that glides', 'lead')]),

  // ---------------- Unit 8: Effects ----------------
  Y('8.1', 8, 'Distortion', [
    s('Effects come after the synth voice and treat the whole sound. Distortion pushes the wave until its peaks flatten. Flattened peaks mean new harmonics: grit, bite and loudness.', pn(['dist'], { cut: 1200 }, 'wave')),
    s('A little warms a sound up. A lot turns even a sine wave into a snarl.', pf('Clean sine', { o1w: 0 }, 'spectrum', 'hold', { dist: 0.6 }, 'Distorted sine')),
  ], [ab('More or less distortion', 'dist', { cut: 1200 }, { lo: 0, hi: 0.9, gap: 0.4 }), m1('Match the distortion', 'dist', { o1w: 0 }, { view: 'wave', lo: 0, hi: 0.9, tolK: 1.2 })], ['dist']),
  Y('8.2', 8, 'Chorus', [
    s('Chorus mixes in a copy of the sound that is delayed by a few thousandths of a second, with the delay slowly wobbling. The copy drifts in and out of tune.', pn(['cho'], {}, undefined, 'long')),
    s('The result is like detuned oscillators, but added after the fact: wider, softer, more "expensive". It is the finishing touch on most pads.', pf('Dry', {}, undefined, 'long', { cho: 0.8 }, 'With chorus')),
  ], [ab('More or less chorus', 'cho', {}, { seq: 'long', lo: 0, hi: 1, gap: 0.5 })], ['cho']),
  Y('8.3', 8, 'Phaser and flanger', [
    s('A phaser sweeps a set of notches up and down the spectrum. You hear a slow, hollow swirl moving through the sound.', pf('Phaser', { pha: 0.8 }, undefined, 'long')),
    s('A flanger is a chorus with a much shorter delay and feedback. It gives a metallic "jet plane" sweep.', pf('Phaser', { pha: 0.8 }, undefined, 'long', { pha: 0, fla: 0.8 }, 'Flanger')),
  ], [nm('Chorus, phaser or flanger', 'Which effect is on this sound?', [['None', {}], ['Chorus', { cho: 0.8 }], ['Phaser', { pha: 0.8 }], ['Flanger', { fla: 0.8 }]], {}, 'long')], ['pha', 'fla']),
  Y('8.4', 8, 'Delay', [
    s('Delay repeats the sound as echoes. Time sets the gap between them. Feedback sets how many times they repeat before dying away. Mix sets how loud they are.', pn(['dly', 'dtime', 'dfb'], { dly: 0.6 }, undefined, 'stab')),
    s('Short times with little feedback thicken a sound. Long times with more feedback fill the gaps in a melody.', pf('Short, few repeats', { dly: 0.6, dtime: 0.12, dfb: 0.2 }, undefined, 'stab', { dtime: 0.4, dfb: 0.7 }, 'Long, many repeats')),
  ], [ab('Delay time and feedback', ['dtime', 'dfb'], { dly: 0.6 }, { seq: 'stab', lo: 0.1, hi: 0.9, gap: 0.4 }), mN('Match the echoes', ['dtime', 'dfb'], { dly: 0.6 }, { seq: 'stab', view: 'none', ranges: { dtime: [0.2, 0.85], dfb: [0.1, 0.9] }, tolK: 1.8 })], ['dly', 'dtime', 'dfb']),
  Y('8.5', 8, 'Reverb', [
    s('Reverb is thousands of echoes so close together they blur into the sound of a space. Mix sets how much of the room you hear. Size sets how big the room is.', pn(['rev', 'rsize'], { rev: 0.6 }, undefined, 'stab')),
    s('Reverb pushes a sound back and makes it larger. Too much, and everything turns to fog.', pf('Dry', {}, undefined, 'stab', { rev: 0.8, rsize: 0.9 }, 'Large hall')),
  ], [ab('More or less reverb', 'rev', {}, { seq: 'stab', lo: 0, hi: 1, gap: 0.45 }), ab('Bigger or smaller room', 'rsize', { rev: 0.7 }, { seq: 'stab', lo: 0, hi: 1, gap: 0.6 })], ['rev', 'rsize']),
  Y('8.6', 8, 'EQ', [
    s('An EQ turns ranges of frequency up or down without the character of a synth filter. This one has two bands: low, for weight, and high, for air.', pn(['eqlo', 'eqhi'], {}, 'spectrum')),
    s('Use EQ to fix a finished sound: a little less low end so it does not fight the bass, a little more top so it cuts through.', pf('Flat', {}, 'spectrum', 'hold', { eqlo: -12, eqhi: 9 }, 'Less bass, more treble')),
  ], [chg('Low band or high band?', ['eqlo', 'eqhi']), ab('More bass or more treble', ['eqlo', 'eqhi'], {}, { lo: 0.1, hi: 0.9, gap: 0.45 })], ['eqlo', 'eqhi']),
  Y('8.7', 8, 'Compression', [
    s('A compressor turns loud moments down and then turns everything up. Quiet and loud notes end up closer together, and the sound feels denser.', pn(['comp'], { avel: 1 }, undefined, 'vel')),
    s('This phrase alternates soft and hard notes. With compression the soft notes come up to meet the hard ones.', pf('Uncompressed', { avel: 1 }, undefined, 'vel', { comp: 0.9 }, 'Compressed')),
  ], [ab('More or less compressed', 'comp', { avel: 1 }, { seq: 'vel', lo: 0, hi: 1, gap: 0.6 }), quiz('What each effect does', 'fx')], ['comp']),
  Y('8.8', 8, 'Effect order', [
    s('Effects run in a chain, each one treating the output of the one before. Change the order and the sound changes.', pn(['fxo'], { dist: 0.7, dly: 0.6, dfb: 0.5 }, undefined, 'stab')),
    s('Distortion first, then delay: clean echoes of a dirty sound. Delay first, then distortion: the echoes pile into the distortion and smear together.', pf('Distortion first', { dist: 0.7, dly: 0.6, dfb: 0.5 }, undefined, 'stab', { fxo: 1 }, 'Distortion last')),
  ], [nm('Which order?', 'Distortion and delay are both on. Which comes first?', [['Distortion first: clean echoes', { fxo: 0 }], ['Distortion last: smeared echoes', { fxo: 1 }]], { dist: 0.7, dly: 0.6, dfb: 0.5 }, 'stab'), flow('Effects in the signal path', 'fx')], ['fxo']),
  Y('8.9', 8, 'Name the effect chain', [
    s('Real sounds usually carry two or three effects. Listen for one thing at a time: is there grit? Is there swirl? Are there echoes? Is there a room?'),
    s('Identify what is on each sound.', undefined, tr('S2', { opts: [['Distortion', { dist: 0.6 }], ['Delay', { dly: 0.6 }], ['Reverb', { rev: 0.7 }]], base: { cut: 1500 }, seq: 'stab', q: 'Which effect is on this sound?' })),
  ], [nm('Name the effects', 'Which effects are on this sound?', [['Distortion', { dist: 0.6 }], ['Chorus', { cho: 0.8 }], ['Delay', { dly: 0.6 }], ['Reverb', { rev: 0.7 }], ['Distortion and delay', { dist: 0.6, dly: 0.6 }], ['Chorus and reverb', { cho: 0.8, rev: 0.7 }]], { cut: 1500 }, 'stab'), quiz('Effects review', 'fx')]),

  // ---------------- Unit 9: Recipes ----------------
  Y('9.1', 9, 'Sub bass', [
    s('From here on you build whole sounds from a description. The sub bass is the simplest: a pure, steady tone at the very bottom, there to be felt.', pf('A sub bass', eg('sub'), 'spectrum', 'low')),
    s('It needs almost no harmonics, so start from a sine or triangle, or close a low-pass filter over something brighter. Small speakers barely play it: use headphones.'),
  ], [recipe('Build a sub bass', 'sub')]),
  Y('9.2', 9, 'Reese bass', [
    s('A reese is two saw waves detuned against each other and darkened by a low-pass filter. The beating between them makes the bass churn.', pf('A reese bass', eg('reese'), undefined, 'low')),
    s('The amount of detune sets the speed of the churn. The cutoff sets how much growl gets through.'),
  ], [recipe('Build a reese bass', 'reese')]),
  Y('9.3', 9, 'Acid bass', [
    s('The acid sound: one voice, a low starting cutoff, high resonance, and a filter envelope that flicks the filter open on every note. Notes slide into each other.', pf('An acid line', eg('acid'), undefined, 'riff')),
    s('The squelch comes from resonance and envelope amount working together. The slide comes from mono, legato and a short glide.'),
  ], [recipe('Build an acid bass', 'acid')]),
  Y('9.4', 9, 'Pluck', [
    s('You built a pluck in unit 5. Here it is again as a recipe to keep: instant attack, short decay, no sustain, and a filter envelope doing the same so the brightness dies with the loudness.', pf('A pluck', eg('pluck'), 'env', 'pluck')),
    s('Lengthen the decay a little and it becomes a harp. Shorten it and add resonance, and it becomes a blip.'),
  ], [recipe('Build a pluck again', 'pluck')]),
  Y('9.5', 9, 'Keys', [
    s('A keyboard sound sits between a pluck and an organ: quick to speak, then fading gently while held. It should also respond to touch.', pf('Soft keys', eg('keys'), undefined, 'vel')),
    s('Use a mellow wave or a lowered cutoff, a decay you can hear, sustain somewhere in the lower half, and velocity sent to volume.'),
  ], [recipe('Build a soft keyboard', 'keys')]),
  Y('9.6', 9, 'String pad', [
    s('A string pad swells in, holds, and fades out slowly. It is wide and slightly detuned, like many players not quite in tune, and not too bright.', pf('A string pad', eg('strings'), undefined, 'chord')),
    s('Slow attack and release for the bowing. Detuned oscillators or chorus for the width. A low-pass filter to take the edge off the saws.'),
  ], [recipe('Build a string pad', 'strings')]),
  Y('9.7', 9, 'Brass', [
    s('Brass gets brighter as the player pushes air in. On a synth that is a filter envelope with a short attack: each note opens up just after it starts.', pf('A brass stab', eg('brass'), undefined, 'stab')),
    s('Keep the amp attack fast so the note still speaks at once. Only the brightness is late.'),
  ], [recipe('Build a brass stab again', 'brass')]),
  Y('9.8', 9, 'Lead', [
    s('The singing lead from unit 7, now as a recipe: mono, a touch of glide, vibrato that fades in.', pf('A lead', eg('lead'), undefined, 'lead')),
    s('Try different waves under it. A saw is bold. A pulse is hollow and vocal. A sine or triangle is a whistle.'),
  ], [recipe('Build a lead again', 'lead')]),
  Y('9.9', 9, 'Supersaw', [
    s('The supersaw is the wall of sound behind trance and modern pop chords: many saws per note, spread wide in tuning, with the filter open.', pf('A supersaw', eg('supersaw'), 'spectrum', 'chord')),
    s('Unison voices and spread do the work. Chorus on top makes it wider still.'),
  ], [recipe('Build a supersaw', 'supersaw')]),
  Y('9.10', 9, 'Kick drum', [
    s('A synth kick is a sine wave whose pitch drops very fast at the start, with no sustain. The drop is the click and punch; what is left is the thump.', pf('A kick', eg('kick'), 'env', 'drum')),
    s('A bigger pitch amount makes it punchier. A longer amp decay makes it boomier.'),
  ], [recipe('Build a kick drum', 'kick')]),
  Y('9.11', 9, 'Snare and hi-hat', [
    s('A snare is a short burst of noise with a little tone under it. A hi-hat is noise only, with a high-pass filter leaving just the sizzle, and shorter still.', pf('A snare', eg('snare'), undefined, 'drum', eg('hat'), 'A hi-hat')),
    s('Drums use the envelope stages you know, with no sustain. Only the source and the filter change.'),
  ], [recipe('Build a snare', 'snare'), recipe('Build a hi-hat', 'hat')]),
  Y('9.12', 9, 'Riser', [
    s('A riser builds tension before a big moment. The classic version is noise through a resonant low-pass filter that opens slowly.', pf('A riser', eg('riser'), undefined, 'long')),
    s('The filter envelope does the opening, so give it a long attack. Resonance adds the whistle that climbs with it.'),
  ], [recipe('Build a riser', 'riser'), quiz('Which settings make which sound', 'shape')]),

  // ---------------- Unit 10: New ways to make tone ----------------
  Y('10.1', 10, 'Oscillator sync', [
    s('With sync on, every time oscillator 1 restarts its cycle it forces oscillator 2 to restart too. Oscillator 2 can no longer change the note you hear. It changes the tone instead.', pn(['sync', 'o2semi'], { sync: 1, o1lvl: 0, o2lvl: 0.9, o2semi: 7 }, 'wave')),
    s('Sweep the pitch of the synced oscillator and you get a tearing, vocal sweep that no filter can make.', pf('Sync off', { o1lvl: 0, o2lvl: 0.9, o2semi: 7 }, 'wave', 'hold', { sync: 1 }, 'Sync on')),
  ], [nm('Sync on or off', 'Oscillator 2 is tuned a fifth above. Is sync on?', [['Off: you hear the fifth', { sync: 0 }], ['On: same note, new tone', { sync: 1 }]], { o1lvl: 0, o2lvl: 0.9, o2semi: 7 }), ab('Sweeping the synced oscillator', 'o2semi', { sync: 1, o1lvl: 0, o2lvl: 0.9 }, { lo: 0.5, hi: 1, gap: 0.2, say: ['is brighter and more tearing (the synced oscillator is tuned higher)', 'is rounder (the synced oscillator is tuned lower)'] })], ['sync']),
  Y('10.2', 10, 'Ring modulation', [
    s('Ring modulation multiplies two oscillators together. What comes out is not either pitch, but their sum and their difference.', pn(['ring', 'o2semi'], { o1w: 0, o2w: 0, o1lvl: 0.2, o2semi: 7, ring: 0.8 }, 'spectrum')),
    s('When the two are in a simple ratio the result is a clean new tone. When they are not, you get clangs and bells.', pf('No ring mod', { o1w: 0, o2w: 0, o2semi: 6 }, 'spectrum', 'hold', { ring: 0.9, o1lvl: 0.1 }, 'Ring mod')),
  ], [ab('More or less ring mod', 'ring', { o1w: 0, o2w: 0, o1lvl: 0.4, o2semi: 6 }, { lo: 0, hi: 1, gap: 0.5 }), quiz('Sync and ring mod', 'sync')], ['ring']),
  Y('10.3', 10, 'FM: carrier and modulator', [
    s('FM means frequency modulation. One oscillator, the modulator, wobbles the frequency of another, the carrier. That is vibrato. But make the wobble as fast as a note, and it stops sounding like vibrato and becomes new harmonics.', pn(['fmi'], FM, 'spectrum')),
    s('You hear only the carrier. The FM amount, also called the index, is how hard the modulator pushes it. More amount, more and brighter harmonics, from two plain sine waves.', pf('A sine', FM, 'spectrum', 'hold', { fmi: 3 }, 'The same sine with FM')),
  ], [ab('More or less FM', 'fmi', FM, { lo: 0, hi: 0.8, gap: 0.3 }), m1('Match the FM amount', 'fmi', FM, { lo: 0.05, hi: 0.8 })], ['fmi']),
  Y('10.4', 10, 'Ratio', [
    s('Ratio is the modulator\'s frequency compared with the carrier\'s. It decides which harmonics appear. Ratio 1 gives every harmonic, like a saw. Ratio 2 gives the odd ones, like a square.', pn(['fmr', 'fmi'], { ...FM, fmi: 2.5 }, 'spectrum')),
    s('Higher ratios put the new harmonics further up, for thin, glassy and bell-like tones.', pf('Ratio 1', { ...FM, fmi: 2.5, fmr: 1 }, 'spectrum', 'hold', { fmr: 6 }, 'Ratio 7')),
  ], [nm('Name the ratio', 'Which FM ratio is this?', [['Ratio 1', { fmr: 1 }], ['Ratio 2', { fmr: 2 }], ['Ratio 7', { fmr: 6 }]], { ...FM, fmi: 2.5 }), pic('Ratios from the spectrum', [['Ratio 1', { fmr: 1 }], ['Ratio 2', { fmr: 2 }], ['Ratio 4', { fmr: 4 }]], 'spectrum', { ...FM, fmi: 2.5 })], ['fmr']),
  Y('10.5', 10, 'FM amount over time', [
    s('In FM there is often no filter. Brightness is the FM amount, so to make a note start bright and mellow out, you put an envelope on the amount.', pn(['fmd', 'fmi'], { ...FM, fmi: 4, fmd: 0.5 }, undefined, 'gate')),
    s('FM decay sets how quickly the amount falls away after each note starts. It does the job a filter envelope does on a subtractive synth.', pf('Steady FM', { ...FM, fmi: 4 }, undefined, 'gate', { fmd: 0.7 }, 'FM that decays')),
  ], [ab('Faster or slower FM decay', 'fmd', { ...FM, fmi: 4 }, { seq: 'gate', lo: 0.2, hi: 0.95, gap: 0.35 }), chg('Amount, ratio or decay?', ['fmi', 'fmr', 'fmd'], { ...FM, fmi: 2.5, fmr: 1, fmd: 0.4 }, 'gate')], ['fmd']),
  Y('10.6', 10, 'Four operators and algorithms', [
    s('FM synths call each sine oscillator an operator. So far you have used two. Real FM sounds use four or more. Operators 3 and 4 work just like operator 2: an amount, a ratio and a decay each.', pn(['f3i', 'f3r', 'fma'], { ...FM, fmi: 2, f3i: 2, f3r: 2 }, 'spectrum')),
    s('An algorithm is how the operators are wired. In a stack, 4 pushes 3, 3 pushes 2, and 2 pushes the carrier: very bright and complex. Side by side, nobody pushes anybody: four plain tones, like an organ.', pf('Stack', { ...FM, fmi: 2, f3i: 2, f3r: 2, f4i: 1.5, f4r: 3 }, 'spectrum', 'hold', { fma: 1 }, 'Side by side')),
    s('In between are the useful ones. Two pairs gives two separate two-operator sounds on one key. Three into one sends three modulators into one carrier, each adding its own harmonics. The last two choices mix these ideas: a short stack beside one plain tone, and a pair beside two plain tones.', pf('Two pairs', { ...FM, fma: 2, fmi: 2, f3i: 2, f3r: 2, f4i: 1.5, f4r: 3 }, 'spectrum', 'hold', { fma: 3 }, 'Three into one')),
  ], [nm('Name the algorithm', 'Four operators are on. How are they wired?', [['Stack: a chain of four', { fma: 0 }], ['Side by side: four plain tones', { fma: 1 }], ['Two pairs', { fma: 2 }]], { ...FM, fmi: 2, f3i: 2, f3r: 2, f4i: 1.5, f4r: 3 }), ab('More or less of operator 3', 'f3i', { ...FM, fma: 3, fmi: 1.5, f3r: 4 }, { lo: 0, hi: 0.8, gap: 0.35 }), quiz('Operators and algorithms', 'fm')], ['fma', 'f3i', 'f3r', 'f3d', 'f4i', 'f4r', 'f4d']),
  Y('10.7', 10, 'FM bell', [
    s('Bells are FM\'s party trick. A bell has partials that do not line up neatly, so use three into one with operators 2 and 3 at different high ratios.', pf('An FM bell', eg('fmbell'), 'spectrum', 'pluck')),
    s('No sustain makes it a strike. A long decay and release let it ring. Feedback on operator 2 adds a rough edge to the clang.', pn(['fmf'], eg('fmbell'), undefined, 'pluck')),
  ], [recipe('Build an FM bell', 'fmbell'), ab('More or less feedback', 'fmf', { ...FM, fmi: 1.5 }, { lo: 0, hi: 1, gap: 0.5 })], ['fmf']),
  Y('10.8', 10, 'FM electric piano', [
    s('The FM electric piano is on thousands of records, and it is two sounds at once. One pair of operators makes a mellow body. The other pair makes a bright "tine" that lasts an instant.', pf('An FM electric piano', eg('fmep'), undefined, 'pluck')),
    s('With the two pairs algorithm, operator 3 is heard directly, so its decay is how fast the tine fades. Operator 4 pushes operator 3 to brighten it.', pf('Body only', { ...eg('fmep'), f3i: 0 }, 'spectrum', 'pluck', { f3i: 2 }, 'Body and tine')),
  ], [recipe('Build an FM electric piano', 'fmep')]),
  Y('10.9', 10, 'FM bass', [
    s('FM basses are punchy and hard-edged. Stack operator 3 on operator 2 and give both a fast decay: a bright knock at the start of each note, over a solid sine.', pf('An FM bass', eg('fmbass'), undefined, 'riff')),
    s('Keep operator 2 at ratio 1 or 0.5 so the weight stays on the note itself.'),
  ], [recipe('Build an FM bass', 'fmbass')]),
  Y('10.10', 10, 'FM review', [
    s('FM in one line: amount sets how bright, ratio sets what kind of bright, and decay sets how the brightness changes over the note.'),
    s('Check that you can hear each of the three.', undefined, tr('S3', { ctls: ['fmi', 'fmr', 'fmd'], base: { ...FM, fmi: 2.5, fmr: 1, fmd: 0.4 }, seq: 'gate' })),
  ], [quiz('FM facts', 'fm'), mN('Match amount and decay', ['fmi', 'fmd'], FM, { seq: 'gate', view: 'none', ranges: { fmi: [0.15, 0.8], fmd: [0.2, 0.7] }, tolK: 1.8 })]),

  // ---------------- Unit 11: Other engines ----------------
  Y('11.1', 11, 'Wavetables', [
    s('A wavetable is a row of different single-cycle waves. A wavetable oscillator can sit on any one of them, or anywhere in between. The position control chooses where.', pn(['wtpos'], { o1w: 4 }, 'wave')),
    s('This table runs from a sine, through triangle, saw and square, to a thin pulse. One knob now does what the wave switch did, smoothly.', pf('Start of the table', { o1w: 4, wtpos: 0 }, 'wave', 'hold', { wtpos: 0.9 }, 'Near the end')),
  ], [ab('Earlier or later in the table', 'wtpos', { o1w: 4 }, { lo: 0, hi: 1, gap: 0.3 }), m1('Match the table position', 'wtpos', { o1w: 4 }, { view: 'wave', lo: 0, hi: 1, tolK: 1.2 })], ['wtpos']),
  Y('11.2', 11, 'Scanning a wavetable', [
    s('The point of a wavetable is movement. Send an LFO or an envelope to the position and the tone morphs as the note plays, in ways a filter cannot.', pf('Fixed position', { o1w: 4, wtpos: 0.4 }, undefined, 'long', { m1s: 1, m1d: 6, m1a: 0.5, l1r: 0.7 }, 'Scanned by an LFO')),
    s('Modern wavetable synths hold hundreds of tables, many made from recordings. The idea is the same: a position, and something moving it.'),
  ], [nm('Fixed or scanned', 'Is the wavetable position fixed or moving?', [['Fixed', {}], ['Moving slowly', { m1s: 1, m1d: 6, m1a: 0.5, l1r: 0.7 }], ['Moving fast', { m1s: 1, m1d: 6, m1a: 0.5, l1r: 6 }]], { o1w: 4, wtpos: 0.4 }, 'long'), quiz('Wavetable facts', 'wavetable')]),
  Y('11.3', 11, 'Additive synthesis', [
    s('Additive synthesis is the reverse of subtractive. You start with nothing and add harmonics one sine wave at a time.', pn(['ah'], { eng: 1, atilt: 0.5 }, 'spectrum')),
    s('One harmonic is a sine. Add more and the sound brightens, hump by hump in the spectrum.', pf('2 harmonics', { eng: 1, atilt: 0.5, ah: 2 }, 'spectrum', 'hold', { ah: 14 }, '14 harmonics')),
  ], [ab('More or fewer harmonics', 'ah', { eng: 1, atilt: 0.5 }, { lo: 0, hi: 1, gap: 0.3 }), m1('Match the number of harmonics', 'ah', { eng: 1, atilt: 0.5 }, { lo: 0, hi: 1 })], ['eng', 'ah']),
  Y('11.4', 11, 'Tilt, odd and even', [
    s('Tilt sets how quickly the harmonics get quieter as they go up. Steep tilt is dark. Flat tilt is bright and buzzy.', pn(['atilt', 'aeven'], { eng: 1, ah: 12 }, 'spectrum')),
    s('Turn the even harmonics down and only the odd ones are left: the hollow sound of a square wave, built from scratch.', pf('All harmonics', { eng: 1, ah: 12 }, 'spectrum', 'hold', { aeven: 0 }, 'Odd harmonics only')),
  ], [ab('Tilt and even harmonics', ['atilt', 'aeven'], { eng: 1, ah: 12 }, { lo: 0, hi: 1, gap: 0.45 }), mN('Match tilt and even harmonics', ['atilt', 'aeven'], { eng: 1, ah: 12 }, { ranges: { atilt: [0.1, 0.9], aeven: [0, 1] }, show: true, tolK: 1.6 })], ['atilt', 'aeven']),
  Y('11.5', 11, 'Sampling', [
    s('A sampler uses a recording as its sound source. Play a higher key and it plays the recording faster, which raises the pitch. This engine has one short built-in recording.', pf('The recording on three notes', { eng: 2 }, undefined, 'pluck')),
    s('Start sets where in the recording playback begins. Move it later and you skip the breathy attack and get only the tone.', pn(['sstart'], { eng: 2 }, undefined, 'hold')),
  ], [ab('With or without the breathy start', 'sstart', { eng: 2 }, { lo: 0, hi: 0.45, gap: 0.4, say: ['skips the breathy start of the recording', 'includes the breathy start of the recording'] }), quiz('Sampling facts', 'sampling')], ['sstart']),
  Y('11.6', 11, 'Loops', [
    s('A recording ends. To hold a note longer than that, the sampler loops a section of it for as long as the key is down.', pn(['sloop', 'slen'], { eng: 2, sstart: 0.3, sloop: 1 }, undefined, 'long')),
    s('A long loop sounds natural. A very short loop repeats so fast that it turns into a buzzy tone of its own.', pf('No loop: it runs out', { eng: 2, sstart: 0.3 }, undefined, 'long', { sloop: 1, slen: 0.4 }, 'Looped')),
  ], [nm('Loop: none, short or long', 'A long note is held. What is the sampler doing?', [['No loop: it runs out', { sloop: 0 }], ['Short loop: a buzz', { sloop: 1, slen: 0.02 }], ['Long loop: it holds', { sloop: 1, slen: 0.4 }]], { eng: 2, sstart: 0.3 }, 'long')], ['sloop', 'slen']),
  Y('11.7', 11, 'Granular: grains', [
    s('Granular synthesis chops a recording into tiny slices called grains and plays a stream of them. Position chooses where in the recording the grains come from.', pn(['gpos', 'gsize'], { eng: 3 }, undefined, 'long')),
    s('Because grains keep coming from the same spot, the sound can freeze on one instant of the recording for as long as you like. Longer grains sound smoother; very short ones sound buzzy.', pf('Short grains', { eng: 3, gsize: 0.015 }, undefined, 'long', { gsize: 0.2 }, 'Long grains')),
  ], [ab('Longer or shorter grains', 'gsize', { eng: 3 }, { seq: 'long', lo: 0, hi: 1, gap: 0.5 }), ab('Earlier or later position', 'gpos', { eng: 3, gsize: 0.1 }, { seq: 'long', lo: 0.05, hi: 0.9, gap: 0.55, say: ['takes its grains from later in the recording (darker)', 'takes its grains from earlier in the recording (brighter)'] })], ['gpos', 'gsize']),
  Y('11.8', 11, 'Granular: density and scatter', [
    s('Density is how many grains start each second. Few, and you hear separate blips. Many, and they fuse into a smooth cloud.', pn(['gdens', 'gjit'], { eng: 3 }, undefined, 'long')),
    s('Scatter spreads the grains around the position, so each one catches a slightly different moment. The texture gets richer and less static.', pf('Sparse', { eng: 3, gdens: 4, gsize: 0.05 }, undefined, 'long', { gdens: 40 }, 'Dense')),
  ], [ab('Denser or sparser', 'gdens', { eng: 3, gsize: 0.05 }, { seq: 'long', lo: 0, hi: 1, gap: 0.5 }), quiz('Granular facts', 'granular')], ['gdens', 'gjit']),
  Y('11.9', 11, 'A plucked string', [
    s('Physical modelling imitates how an instrument works. This model is a plucked string: a burst of noise goes round a very short delay loop, losing a little brightness on every lap.', pn(['kdamp', 'kdecay'], { eng: 4 }, undefined, 'pluck')),
    s('Damping sets how dull the string is. Ring time sets how long it sounds. There is no oscillator and no filter, and it still sounds like a real pluck.', pf('Bright, long', { eng: 4, kdamp: 0.1, kdecay: 0.95 }, undefined, 'pluck', { kdamp: 0.9, kdecay: 0.3 }, 'Dull, short')),
  ], [ab('Damping and ring time', ['kdamp', 'kdecay'], { eng: 4 }, { seq: 'pluck', lo: 0, hi: 1, gap: 0.5 }), mN('Match the string', ['kdamp', 'kdecay'], { eng: 4 }, { seq: 'pluck', view: 'none', ranges: { kdamp: [0, 1], kdecay: [0.1, 1] }, tolK: 2 }), quiz('Plucked string facts', 'physical')], ['kdamp', 'kdecay']),
  Y('11.10', 11, 'Pick the engine', [
    s('Five ways to make a tone: subtractive carves a bright wave, additive stacks sines, sampling replays a recording, granular sprays slices of one, and physical modelling imitates an instrument. FM and wavetables are two more kinds of oscillator.', ps(ENGINES, undefined, 'pluck')),
    s('Each has a character you can learn to hear. Name the engine behind each sound.', undefined, tr('S2', { opts: ENGINES, seq: 'pluck', q: 'Which engine made this sound?' })),
  ], [nm('Name the engine', 'Which engine made this sound?', ENGINES, {}, 'pluck'), quiz('The right engine for the job', 'engines')]),

  // ---------------- Unit 12: Any synth, any sound ----------------
  Y('12.1', 12, 'The mod matrix', [
    s('So far each envelope and LFO has had a fixed job. A mod matrix lets you connect any source to any destination. Each connection is a slot with three settings: source, destination and amount.', pn(['m1s', 'm1d', 'm1a'], { cut: 700, res: 0.3, m1s: 1, m1d: 2, m1a: 0.5 }, undefined, 'long')),
    s('Everything from unit 6 can be rebuilt here, and far more. Most modern synths work this way.', pf('LFO to cutoff', { cut: 700, res: 0.3, m1s: 1, m1d: 2, m1a: 0.5 }, undefined, 'long', { m1d: 1, m1a: 0.08 }, 'LFO to pitch')),
  ], [nm('What is slot 1 doing?', 'One mod slot is active. Which connection is it?', [['LFO to cutoff', { m1s: 1, m1d: 2, m1a: 0.5 }], ['LFO to pitch', { m1s: 1, m1d: 1, m1a: 0.08 }], ['LFO to volume', { m1s: 1, m1d: 3, m1a: -0.8 }]], { cut: 700, res: 0.3 }, 'long'), quiz('Mod matrix facts', 'matrix')], ['m1s', 'm1d', 'm1a']),
  Y('12.2', 12, 'More sources, and negative amounts', [
    s('A second LFO gives a second, independent movement: a slow sweep of the filter under a faster vibrato, say. Each slot of the matrix can use a different source.', pn(['l2r', 'l2s', 'm2s', 'm2d', 'm2a'], { cut: 800, l1p: 0.3, m2s: 2, m2d: 2, m2a: 0.5, l2r: 0.5 }, undefined, 'long')),
    s('A negative amount makes the source push the other way. Velocity to cutoff with a negative amount makes hard notes darker. Key tracking, velocity, the mod wheel and aftertouch are all sources too.'),
  ], [ab('Deeper or shallower modulation', 'm1a', { cut: 800, res: 0.3, m1s: 2, m1d: 2, l2r: 2 }, { seq: 'long', lo: 0.5, hi: 1, gap: 0.25 }), quiz('Sources and destinations', 'matrix')], ['l2r', 'l2s', 'm2s', 'm2d', 'm2a', 'm3s', 'm3d', 'm3a']),
  Y('12.3', 12, 'Patch cables, CV and gate', [
    s('On a modular synth nothing is connected until you plug in a cable. Every connection you have learned, oscillator to filter, envelope to cutoff, is a cable you patch by hand.'),
    s('Cables carry voltages. A pitch voltage (CV) tells an oscillator which note. A gate tells an envelope when a key goes down and up. Audio is a voltage too, so anything can be patched to anything.'),
    s('The matrix you just used is a modular synth with the cables replaced by a table.', undefined, tr('S9', { set: 'cv' })),
  ], [quiz('CV and gate', 'cv'), flow('Patch it by hand', 'cv')]),
  Y('12.4', 12, 'Arpeggiator and sequencer', [
    s('An arpeggiator takes the keys you hold and plays them one at a time, in time with the tempo. Hold a chord and it becomes a pattern.', pn(['arp', 'arpr'], { arp: 1, ad: 0.15, as: 0.3, cut: 2500 }, undefined, 'chord')),
    s('It has patterns of its own: up, down, up and down, or random. Here is the same three-note chord four ways.', ps([['Up', { arp: 1, ad: 0.15, as: 0.3, cut: 2500 }], ['Down', { arp: 2, ad: 0.15, as: 0.3, cut: 2500 }], ['Up and down', { arp: 3, ad: 0.15, as: 0.3, cut: 2500 }], ['Random', { arp: 4, ad: 0.15, as: 0.3, cut: 2500 }]], undefined, 'chord')),
    s('A step sequencer stores a note, or a rest, for each step of a short loop and plays it round and round. Bass lines, including the acid line from unit 9, are usually sequenced. Program one by ear.', undefined, tr('S15', { len: 4, rests: 0 })),
  ], [nm('Name the arpeggiator pattern', 'A three-note chord is held. Which pattern is the arpeggiator playing?', [['Up', { arp: 1 }], ['Down', { arp: 2 }], ['Up and down', { arp: 3 }]], { ad: 0.15, as: 0.3, cut: 2500 }, 'chord'), u('S15', 'Program a pattern', {}), quiz('Arpeggiators and sequencers', 'seq')], ['arp', 'arpr']),
  Y('12.5', 12, 'MIDI and CC', [
    s('MIDI is the language keyboards, computers and synths use to talk. It carries no sound: only messages such as "note 60 on, velocity 90" and "note 60 off".'),
    s('Control change messages, CCs, carry knob movements: CC 1 is the mod wheel, CC 74 is often cutoff. Any synth, hardware or software, can be played and automated this way. This app can be played from a MIDI keyboard for the same reason.'),
  ], [quiz('MIDI facts', 'midi')]),
  Y('12.6', 12, 'Reading an unfamiliar panel', [
    s('Every subtractive synth has the same parts under different names. Find the three sections first: oscillators (VCO, DCO), filter (VCF) and amplifier (VCA). Then find the envelopes and the LFO.'),
    s('Filter cutoff may be called frequency. Resonance may be emphasis, peak or Q. Glide may be portamento. The sound tells you what a knob is, whatever the label says.', undefined, tr('S14', { set: 'env' })),
  ], [xl('Names for the main sections', 'basic'), xl('Names for envelopes and glide', 'env')]),
  Y('12.7', 12, 'More names', [
    s('Modulation has the most variety in naming. An LFO may be a "mod generator". Depth may be "intensity". Pulse-width modulation is "PWM". Random is "S&H".'),
    s('When stuck on a new synth, turn the knob while a note sounds. Then ask: did the pitch, the tone or the loudness change, and was it once per note or again and again?'),
  ], [xl('Names for modulation and effects', 'mod'), quiz('Finding your way around', 'panel')]),
  Y('12.8', 12, 'Recreate a sound', [
    s('To copy a sound from a record, work in the order the sound is made. First the source: which wave, one oscillator or two, detuned or not?'),
    s('Then the tone: how bright, any resonance, and does the brightness move during the note? Then the loudness shape: how does it start, hold and end? Effects come last.'),
    s('Rebuild a complete sound from a plain patch, with every control available.', undefined, tr('S7', { pats: CLIPS_A, ctls: CLIP_CTLS, seq: 'gate', tolK: 2.4 })),
  ], [scratch('Rebuild a sound from a clip', CLIPS_A, CLIP_CTLS, { seq: 'gate', tolK: 2.4 })]),
  Y('12.9', 12, 'Fit it in a mix, and the final test', [
    s('A sound that is perfect alone can be wrong in a track. Sounds sharing a frequency range mask each other. High-pass the pad so the bass has room. Keep reverb off the low end.'),
    s('Give each sound one job and one range. Then the last test of the course: three more sounds to rebuild by ear.'),
  ], [quiz('Sounds in a mix', 'mix'), scratch('Rebuild three sounds from short clips', CLIPS_B, CLIP_CTLS, { seq: 'gate', tolK: 2.4 })]),
];
