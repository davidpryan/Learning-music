// Question banks and recipe briefs for the synth exercises. Each quiz row is [question, right answer, wrong answers...].
import type { Patch } from './dsp';
import type { Features } from './analysis';

export const QUIZ: Record<string, string[][]> = {
  sound: [
    ['What do we hear a faster vibration as?', 'A higher pitch', 'A louder sound', 'A brighter tone', 'A longer note'],
    ['What do we hear a bigger vibration as?', 'A louder sound', 'A higher pitch', 'A darker tone', 'A shorter note'],
    ['Two instruments play the same note at the same loudness but sound different. What differs?', 'Their timbre: the mix of harmonics', 'Their frequency', 'Their amplitude', 'Their tempo'],
    ['A note at 220 Hz has harmonics. Which of these is one of them?', '660 Hz', '300 Hz', '110 Hz', '500 Hz'],
    ['What does an oscilloscope show?', 'The wave over time', 'How much of each frequency is present', 'The notes being played', 'The tempo'],
    ['What does a spectrum show?', 'How much of each frequency is present', 'The wave over time', 'The loudness over a whole song', 'Which keys are held'],
    ['Doubling the frequency of a note moves it by what?', 'One octave up', 'One semitone up', 'A fifth up', 'Two octaves up'],
  ],
  osc: [
    ['Which waveform has no harmonics above the fundamental?', 'Sine', 'Saw', 'Square', 'Pulse'],
    ['Which waveform has every harmonic and sounds the brightest and buzziest?', 'Saw', 'Sine', 'Triangle', 'Square'],
    ['A square wave sounds hollow because it has which harmonics?', 'Only the odd ones', 'Only the even ones', 'None', 'All of them equally'],
    ['What does narrowing the pulse width do to a pulse wave?', 'Makes it thinner and more nasal', 'Makes it lower', 'Makes it louder', 'Turns it into a sine'],
    ['Two oscillators are tuned a few cents apart. What do you hear?', 'A slow beating, thicker sound', 'Two separate notes', 'Silence', 'A higher pitch'],
    ['What is a sub oscillator for?', 'Adding weight an octave below', 'Adding brightness', 'Adding noise', 'Making the note shorter'],
    ['What is white noise useful for?', 'Wind, breath and drum sounds', 'Clear bass notes', 'Tuning', 'Making chords'],
    ['Moving the octave switch from 0 to +1 does what to the frequency?', 'Doubles it', 'Halves it', 'Adds 100 Hz', 'Nothing'],
  ],
  filter: [
    ['What does a low-pass filter let through?', 'Frequencies below the cutoff', 'Frequencies above the cutoff', 'Only the cutoff frequency', 'Only noise'],
    ['What does a high-pass filter remove?', 'The lows below the cutoff', 'The highs above the cutoff', 'Everything but the cutoff', 'The resonance'],
    ['What does resonance do?', 'Boosts a narrow band right at the cutoff', 'Makes the whole sound louder', 'Lowers the pitch', 'Lengthens the note'],
    ['A 24 dB filter compared with a 12 dB one cuts how?', 'More steeply past the cutoff', 'More gently past the cutoff', 'At a higher cutoff', 'Only the bass'],
    ['Key tracking on a filter makes the cutoff do what?', 'Follow the pitch of the note played', 'Follow the volume', 'Stay fixed', 'Follow the tempo'],
    ['With resonance at maximum, a filter may start to do what?', 'Ring at the cutoff frequency on its own', 'Go silent', 'Change the tuning of the oscillators', 'Add reverb'],
    ['Which filter type leaves a band in the middle and removes both sides?', 'Band-pass', 'Notch', 'Low-pass', 'High-pass'],
    ['Which filter type removes a narrow band and leaves the rest?', 'Notch', 'Band-pass', 'Low-pass', 'High-pass'],
    ['A low-pass filter is fully open on a saw wave. Turning resonance up changes little. Why?', 'There is almost nothing at the cutoff to boost', 'Resonance only works on sines', 'The filter is broken', 'Resonance needs an LFO'],
  ],
  env: [
    ['Which envelope stage sets how long a note takes to reach full level?', 'Attack', 'Decay', 'Sustain', 'Release'],
    ['Which stage is a level, not a time?', 'Sustain', 'Attack', 'Decay', 'Release'],
    ['Which stage happens after you let go of the key?', 'Release', 'Attack', 'Decay', 'Sustain'],
    ['A pluck has a fast attack, a short decay, and what sustain?', 'Zero or close to it', 'Full', 'Half, with a slow attack', 'It does not matter'],
    ['An organ note is instantly on, steady, then instantly off. Which settings?', 'Fast attack, full sustain, fast release', 'Slow attack, zero sustain', 'Fast attack, zero sustain, long release', 'Slow attack, long release'],
    ['A pad swells in and fades out slowly. Which two settings are long?', 'Attack and release', 'Decay and sustain', 'Attack and decay only', 'None'],
    ['With sustain at full, what does the decay time do?', 'Nothing you can hear', 'Shortens the note', 'Makes it brighter', 'Adds an echo'],
    ['A gate says a key is held. What does a trigger say?', 'Only that a note has started', 'How hard the key was hit', 'Which note it is', 'That the note has ended'],
  ],
  shape: [
    ['What does a filter envelope do?', 'Moves the cutoff over the course of each note', 'Moves the volume over each note', 'Moves the pitch of each note', 'Adds reverb'],
    ['With a negative envelope amount, the cutoff does what at the start of a note?', 'Drops below its setting, then returns', 'Rises above its setting', 'Stays put', 'Turns the filter off'],
    ['What does velocity measure?', 'How hard a key is struck', 'How long a key is held', 'Which key is struck', 'How fast the song is'],
    ['A fast downward pitch envelope at the start of a low sine makes which sound?', 'A kick drum', 'A string pad', 'A hi-hat', 'A bell'],
    ['Which of these carries sound you can hear?', 'The audio path: oscillator, filter, amp', 'The envelope', 'The LFO', 'The gate'],
    ['Envelopes and LFOs are on which path?', 'The control path', 'The audio path', 'The effects path', 'The output'],
    ['A brass stab needs the filter to open a moment after the note starts. Which setting gives that?', 'A short filter envelope attack', 'A long amp release', 'High resonance', 'A slow LFO'],
  ],
  lfo: [
    ['What does LFO stand for?', 'Low-frequency oscillator', 'Loud filter output', 'Linear fade operator', 'Low-pass filter option'],
    ['An LFO on pitch gives which effect?', 'Vibrato', 'Tremolo', 'Wah', 'Echo'],
    ['An LFO on volume gives which effect?', 'Tremolo', 'Vibrato', 'Glide', 'Chorus'],
    ['Which LFO setting controls how far it moves its target?', 'Depth', 'Rate', 'Shape', 'Sync'],
    ['Which LFO shape jumps to a new random level each cycle?', 'Sample and hold', 'Sine', 'Triangle', 'Saw'],
    ['What does tempo sync do to an LFO?', 'Locks its rate to a note length at the song tempo', 'Makes it faster', 'Restarts the song', 'Turns it into an envelope'],
    ['What does LFO fade-in give a lead sound?', 'Vibrato that arrives only on held notes', 'A louder attack', 'A brighter tone', 'A shorter release'],
    ['An LFO moving pulse width makes a single oscillator sound how?', 'Thick and moving, like two detuned oscillators', 'Like a sine', 'Lower by an octave', 'Silent'],
  ],
  voices: [
    ['What can a mono synth play at once?', 'One note', 'Two notes', 'Any chord', 'Only drums'],
    ['With legato on, what happens when you play a new note before releasing the last?', 'The envelopes do not restart', 'The note is ignored', 'Both notes sound', 'The filter closes'],
    ['What does glide do?', 'Slides the pitch from the last note to the new one', 'Slides the volume down', 'Slides the cutoff up', 'Repeats the note'],
    ['What does unison do?', 'Stacks several detuned copies of the voice on one note', 'Plays an octave lower', 'Removes harmonics', 'Limits you to one note'],
    ['What is the mod wheel most often set to add?', 'Vibrato', 'Reverb', 'Glide', 'Distortion'],
    ['Aftertouch responds to what?', 'Pressing harder on a key that is already down', 'Releasing a key', 'Hitting a key fast', 'Moving the pitch wheel'],
    ['What does the pitch bend wheel do when you let go?', 'Springs back to centre', 'Stays where it is', 'Mutes the note', 'Changes octave'],
  ],
  fx: [
    ['Which effect repeats the sound as distinct echoes?', 'Delay', 'Reverb', 'Chorus', 'Compressor'],
    ['Which effect places the sound in a room or hall?', 'Reverb', 'Delay', 'Phaser', 'Distortion'],
    ['Which effect makes one voice sound like several by mixing in a slowly wobbling copy?', 'Chorus', 'Compressor', 'EQ', 'Distortion'],
    ['Which effect adds harmonics by clipping the wave?', 'Distortion', 'Reverb', 'Delay', 'Chorus'],
    ['What does delay feedback set?', 'How many times the echo repeats', 'How loud the first echo is', 'The time between echoes', 'The brightness'],
    ['What does a compressor do?', 'Evens out loud and quiet parts', 'Adds echoes', 'Removes bass', 'Changes pitch'],
    ['What does an EQ do?', 'Boosts or cuts chosen frequency ranges', 'Adds harmonics', 'Repeats the sound', 'Detunes it'],
    ['Distortion placed after reverb, not before it, sounds how?', 'Messier: the reverb tail gets distorted too', 'Cleaner', 'The same', 'Silent'],
    ['A flanger and a chorus both use a short moving delay. What makes the flanger different?', 'A much shorter delay with feedback: a jet-like sweep', 'It has no delay', 'It changes the envelope', 'It is always in stereo'],
  ],
  sync: [
    ['In oscillator sync, what happens to the second oscillator each time the first restarts its cycle?', 'It is forced to restart too', 'It is muted', 'It changes waveform', 'It drops an octave'],
    ['With sync on, raising the second oscillator\'s pitch changes what?', 'The tone, not the note', 'The note, not the tone', 'The volume', 'Nothing'],
    ['Ring modulation does what to two signals?', 'Multiplies them', 'Adds them', 'Filters one with the other', 'Plays them in turn'],
    ['Ring modulation is known for which kind of sound?', 'Clangy and bell-like', 'Warm and smooth', 'Breathy', 'Sub bass'],
  ],
  fm: [
    ['In FM, which operator do you hear directly?', 'The carrier', 'The modulator', 'The LFO', 'The filter'],
    ['In FM, what does the modulator do?', 'Wobbles the carrier\'s frequency at audio rate', 'Sets the volume', 'Filters the carrier', 'Adds reverb'],
    ['What does raising the FM amount (index) do?', 'Adds more and brighter harmonics', 'Lowers the pitch', 'Lengthens the note', 'Removes harmonics'],
    ['Which ratios between modulator and carrier give a clean, pitched tone?', 'Whole numbers like 1, 2 or 3', 'Any ratio', 'Only 0.5', 'Only very high ones'],
    ['Why does an FM electric piano start bright and turn mellow?', 'The FM amount has its own envelope that decays', 'The filter closes', 'The carrier changes waveform', 'The note is detuned'],
    ['Two operators side by side, with neither modulating the other, give what?', 'Two plain tones added together', 'Maximum brightness', 'Silence', 'Noise'],
    ['Feedback on an FM operator pushes a sine toward what?', 'A saw-like, then noisy, tone', 'A purer sine', 'A lower octave', 'A square at half volume'],
  ],
  wavetable: [
    ['What is a wavetable?', 'A set of single-cycle waves you can move between', 'A list of notes', 'A type of filter', 'A recording of a whole song'],
    ['What does the position control do on a wavetable oscillator?', 'Chooses where in the set of waves to read', 'Sets the pitch', 'Sets the volume', 'Sets the tempo'],
    ['Why put an LFO or envelope on wavetable position?', 'To make the tone move over time', 'To keep the tone fixed', 'To tune the oscillator', 'To add reverb'],
  ],
  additive: [
    ['Additive synthesis builds a sound from what?', 'Many sine waves at harmonic frequencies', 'One saw wave and a filter', 'A recording', 'Noise'],
    ['Subtractive synthesis starts bright and removes. Additive does what?', 'Starts with nothing and adds harmonics', 'Starts with noise', 'Starts with a sample', 'Uses no oscillators'],
    ['Removing the even harmonics from a sound makes it more what?', 'Hollow, like a square wave', 'Bright, like a saw', 'Noisy', 'Sub-heavy'],
    ['Making higher harmonics quieter does what to the tone?', 'Darkens it', 'Brightens it', 'Raises the pitch', 'Shortens it'],
  ],
  sampling: [
    ['What is a sample?', 'A short recording played back as a sound source', 'A type of envelope', 'One cycle of a sine', 'A filter setting'],
    ['A sampler plays a recording faster to do what?', 'Raise its pitch', 'Lower its pitch', 'Make it louder', 'Loop it'],
    ['What is a loop in a sampler for?', 'Holding a note longer than the recording lasts', 'Raising the pitch', 'Adding reverb', 'Starting the sound later'],
    ['Moving the sample start later skips what?', 'The attack of the recording', 'The release', 'The loop', 'The filter'],
  ],
  granular: [
    ['What is a grain?', 'A very short slice of a recording', 'One harmonic', 'A full note', 'A filter pole'],
    ['In granular synthesis, what does position choose?', 'Where in the recording grains are taken from', 'The pitch', 'The grain length', 'The volume'],
    ['Many overlapping grains from one spot give what?', 'A frozen, sustained texture', 'A short click', 'A lower pitch', 'Silence'],
    ['What does scatter (jitter) do?', 'Spreads the grains around the position', 'Shortens each grain', 'Lowers the density', 'Tunes the grains'],
  ],
  physical: [
    ['A plucked-string model starts each note with what?', 'A burst of noise sent round a short delay loop', 'A saw wave', 'A recording of a guitar', 'An LFO'],
    ['In a plucked-string model, what sets the pitch?', 'The length of the delay loop', 'The filter cutoff', 'The noise level', 'The envelope'],
    ['More damping in the string loop makes the note what?', 'Duller, and quicker to lose its highs', 'Brighter', 'Higher', 'Louder'],
  ],
  engines: [
    ['You want a warm bass with a filter sweep. Which approach fits best?', 'Subtractive', 'Granular', 'Sampling a bell', 'Additive with one harmonic'],
    ['You want a glassy bell or electric piano. Which approach is the classic choice?', 'FM', 'Subtractive with a closed filter', 'Granular', 'White noise'],
    ['You want a frozen, shimmering cloud made from a voice recording. Which approach?', 'Granular', 'FM', 'Subtractive', 'Plucked string'],
    ['You want a tone that morphs smoothly between very different wave shapes. Which approach?', 'Wavetable', 'Plucked string', 'Sampling', 'Noise and a filter'],
    ['You want a realistic guitar-like pluck from almost no settings. Which approach?', 'Plucked-string physical model', 'FM with high feedback', 'Additive', 'An LFO on pitch'],
    ['You want exact control over each harmonic. Which approach?', 'Additive', 'Subtractive', 'Granular', 'Sampling'],
  ],
  matrix: [
    ['What does a mod matrix do?', 'Connects any source to any destination with an amount', 'Stores patches', 'Mixes the oscillators', 'Sets the tempo'],
    ['In a mod matrix, the LFO is a source. What is the cutoff?', 'A destination', 'A source', 'An amount', 'An effect'],
    ['A negative amount in a mod slot does what?', 'Makes the source push the destination the other way', 'Turns the slot off', 'Doubles the effect', 'Mutes the sound'],
    ['Which routing makes notes brighter when played harder?', 'Velocity to cutoff', 'LFO to pitch', 'Key tracking to volume', 'Mod wheel to glide'],
    ['Which routing lets you add wobble by pushing the wheel?', 'Mod wheel to LFO depth or cutoff', 'Velocity to pitch', 'Envelope to volume', 'Key tracking to pitch'],
  ],
  cv: [
    ['On a modular synth, what does a patch cable carry?', 'A voltage: sound or control', 'MIDI notes', 'Electric power', 'A recording'],
    ['What does a pitch CV tell an oscillator?', 'Which note to play', 'When the note starts', 'How loud to be', 'Which waveform to use'],
    ['What does a gate signal tell an envelope?', 'When a note starts and ends', 'Which note it is', 'How bright to be', 'The tempo'],
    ['On a modular synth, how do you make an LFO move the filter?', 'Patch a cable from the LFO out to the filter cutoff in', 'Press a preset button', 'Turn the volume up', 'You cannot'],
    ['A fixed-architecture synth and a modular differ how?', 'The modular has no connections until you patch them', 'The modular has no oscillators', 'The fixed synth has no filter', 'They do not differ'],
  ],
  seq: [
    ['What does an arpeggiator do with a held chord?', 'Plays its notes one at a time in a pattern', 'Plays it louder', 'Adds a fifth', 'Holds it for ever'],
    ['What does a step sequencer store?', 'A note (or rest) for each step of a repeating pattern', 'A recording of your playing', 'Filter settings only', 'Effects'],
    ['At 120 bpm, how long is one beat?', 'Half a second', 'One second', 'A quarter of a second', 'Two seconds'],
    ['An arpeggiator set to "up" with C, E and G held plays what?', 'C, E, G, C, E, G…', 'G, E, C…', 'All three together', 'A random order'],
  ],
  midi: [
    ['What does a MIDI note-on message carry?', 'Which note, and how hard', 'The sound itself', 'The filter cutoff', 'The tempo'],
    ['What is a MIDI CC (control change) used for?', 'Moving a control such as cutoff or the mod wheel', 'Starting a note', 'Sending audio', 'Tuning'],
    ['Does MIDI carry sound?', 'No: only instructions', 'Yes, in stereo', 'Yes, in mono', 'Only bass'],
    ['Two different synths receive the same MIDI notes. Do they sound the same?', 'No: each makes its own sound from the same notes', 'Yes, always', 'Only if they are the same colour', 'Only at 120 bpm'],
  ],
  panel: [
    ['You sit down at a synth you have never seen. What is the best first thing to find?', 'The oscillator, filter and amp sections', 'The preset list', 'The power lead', 'The arpeggiator'],
    ['A panel groups ATTACK, DECAY, SUSTAIN, RELEASE under "VCA". What do they shape?', 'Loudness', 'Cutoff', 'Pitch', 'Tempo'],
    ['A knob labelled "ENV AMT" sits in the filter section. What does it set?', 'How far the envelope moves the cutoff', 'The envelope attack', 'The filter slope', 'The volume'],
    ['To recreate a sound from a record, what should you settle first?', 'The raw tone: which waves, how many, how detuned', 'The reverb', 'The exact volume', 'The preset name'],
    ['After the raw tone, what is the next thing to copy when recreating a sound?', 'Brightness and how it changes over the note', 'The effects', 'The tempo', 'The stereo width'],
  ],
  mix: [
    ['A bass and a pad both have lots of energy at 100 Hz. What helps them fit together?', 'High-pass the pad', 'Boost both at 100 Hz', 'Add reverb to the bass', 'Detune the bass'],
    ['A lead is lost behind the chords. Which move helps most?', 'Give it a frequency range of its own, or open its filter', 'Add more sub', 'Lengthen its release', 'Lower its octave into the chords'],
    ['Why is long reverb on a bass usually avoided?', 'It blurs the low end', 'It raises the pitch', 'It removes the attack', 'It is too bright'],
    ['A sound is great alone but harsh in the mix. What is a sensible first step?', 'Close the filter a little or cut some highs', 'Add distortion', 'Add resonance', 'Raise it an octave'],
  ],
};

/** The lesson that teaches each fact above, row for row. */
export const QUIZ_AT: Record<string, string[]> = {
  sound: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.4', '1.1'],
  osc: ['2.1', '2.2', '2.2', '2.3', '2.7', '2.8', '2.4', '2.5'],
  filter: ['3.1', '3.5', '3.3', '3.7', '3.8', '3.8', '3.6', '3.6', '3.9'],
  env: ['4.1', '4.3', '4.2', '4.6', '4.6', '4.6', '4.4', '4.5'],
  shape: ['5.1', '5.4', '5.5', '5.6', '5.7', '5.7', '5.3'],
  lfo: ['6.1', '6.1', '6.3', '6.2', '6.4', '6.6', '6.7', '6.5'],
  voices: ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.5'],
  fx: ['8.4', '8.5', '8.2', '8.1', '8.4', '8.7', '8.6', '8.8', '8.3'],
  sync: ['10.1', '10.1', '10.2', '10.2'],
  fm: ['10.3', '10.3', '10.3', '10.4', '10.5', '10.6', '10.7'],
  wavetable: ['11.1', '11.1', '11.2'], additive: ['11.3', '11.3', '11.4', '11.4'], sampling: ['11.5', '11.5', '11.6', '11.5'], granular: ['11.7', '11.7', '11.7', '11.8'], physical: ['11.9', '11.9', '11.9'],
  engines: ['11.10', '11.10', '11.10', '11.10', '11.10', '11.10'], matrix: ['12.1', '12.1', '12.2', '12.2', '12.2'], cv: ['12.3', '12.3', '12.3', '12.3', '12.3'], seq: ['12.4', '12.4', '12.4', '12.4'], midi: ['12.5', '12.5', '12.5', '12.5'],
  panel: ['12.6', '12.6', '12.6', '12.8', '12.8'], mix: ['12.9', '12.9', '12.9', '12.9'],
};

export const FLOW: Record<string, string[][]> = {
  basic: [
    ['In which order does sound pass through a subtractive synth?', 'Oscillator, filter, amplifier', 'Filter, oscillator, amplifier', 'Amplifier, oscillator, filter', 'Envelope, LFO, oscillator'],
    ['You press a key and hear nothing. The oscillator level is at zero. What is wrong?', 'Nothing is being sent into the filter', 'The filter is too bright', 'The release is too long', 'The LFO is too fast'],
    ['You hear nothing. A low-pass filter has its cutoff at the very bottom and no envelope. Why?', 'The filter is removing everything', 'The oscillator is detuned', 'The attack is too fast', 'Resonance is too low'],
    ['You tap short notes and hear nothing. The amp attack is four seconds. Why?', 'The notes end before the volume has risen', 'The filter is closed', 'The oscillator is off', 'The sustain is too high'],
    ['A held note fades to silence after a moment. Sustain is at zero. What should you change?', 'Raise the sustain', 'Shorten the attack', 'Open the filter', 'Lower the release'],
    ['Which part makes the raw tone?', 'The oscillator', 'The filter', 'The amplifier', 'The envelope'],
    ['Which part sets how the loudness changes over a note?', 'The amp envelope', 'The oscillator', 'The filter slope', 'The noise source'],
  ],
  mod: [
    ['An LFO is running but you hear no change. Its depth to every destination is zero. What is wrong?', 'It is not routed anywhere', 'It is too slow', 'It is the wrong shape', 'The filter is open'],
    ['The filter envelope seems to do nothing. The cutoff is already fully open and the amount is positive. Why?', 'The cutoff has nowhere higher to go', 'The envelope is too slow', 'Resonance is needed', 'The amp release is short'],
    ['Does an envelope make sound by itself?', 'No: it only moves other controls', 'Yes, a click', 'Yes, a sine', 'Only with sustain up'],
    ['Vibrato only appears on long notes. Which setting causes that?', 'LFO fade-in', 'LFO rate', 'Glide', 'Filter key tracking'],
    ['A high-pass filter with the cutoff near the top leaves the bass note almost silent. Why?', 'The note\'s energy is below the cutoff', 'High-pass filters are quiet', 'The oscillator is off', 'The LFO is on'],
  ],
  fx: [
    ['Where do effects sit in the signal path?', 'After the amplifier', 'Before the oscillator', 'Between oscillator and filter', 'Inside the envelope'],
    ['You want crisp echoes of a distorted lead. Which order?', 'Distortion, then delay', 'Delay, then distortion', 'It makes no difference', 'Reverb, then distortion, then delay'],
    ['The delay mix is up but you hear no echoes on a long held note. Why?', 'The echoes are hidden under the still-sounding note', 'Delay needs resonance', 'The filter is open', 'The tempo is wrong'],
  ],
  cv: [
    ['On a modular synth, a keyboard sends pitch CV and gate. Where does the gate go?', 'To the envelope', 'To the oscillator pitch', 'To the filter audio input', 'To the output'],
    ['On a modular synth, you patch the oscillator straight to the output with no amplifier. What happens?', 'It drones without stopping', 'It is silent', 'It plays only short notes', 'It plays an octave lower'],
    ['An envelope output is patched to the amplifier\'s control input. What does it control?', 'Loudness over each note', 'Pitch', 'Waveform', 'Tempo'],
    ['To have notes get brighter higher up the keyboard on a modular, what do you patch?', 'Pitch CV into the filter cutoff', 'Gate into the oscillator', 'LFO into the output', 'Audio into the envelope'],
  ],
};

/** Three other synths' panels: the same engine underneath, their own layout and their own names for the controls. */
export const SKINS: Record<'row' | 'sliders' | 'menu', { name: string; labels: Record<string, string> }> = {
  row: { name: 'a 1970s mono synth', labels: { o1oct: 'Range', o2det: 'Fine tune', nlvl: 'Noise volume', cut: 'Cutoff frequency', res: 'Emphasis', fenv: 'Amount of contour', fd: 'Filter decay time', ktrk: 'Keyboard control', aa: 'Loudness attack', ad: 'Loudness decay', as: 'Loudness sustain', glide: 'Glide', l1r: 'Mod rate', l1p: 'Oscillator mod', l1f: 'Filter mod' } },
  sliders: { name: 'a 1980s poly synth', labels: { pw: 'PW', sublvl: 'Sub', nlvl: 'Noise', cut: 'Freq', res: 'Res', fenv: 'Env', ktrk: 'Kybd', aa: 'A', ad: 'D', as: 'S', ar: 'R', l1r: 'Rate', l1fade: 'Delay time', l1p: 'LFO to DCO', l1f: 'LFO to VCF', cho: 'Chorus', glide: 'Portamento' } },
  menu: { name: 'a modern digital synth', labels: { cut: 'Filter 1 / Frequency', res: 'Filter 1 / Q', fenv: 'Filter 1 / EG depth', aa: 'Amp EG / Attack', ad: 'Amp EG / Decay', as: 'Amp EG / Sustain', ar: 'Amp EG / Release', l1r: 'LFO 1 / Speed', l1p: 'LFO 1 / Pitch int.', l1f: 'LFO 1 / Cutoff int.', glide: 'Voice / Porta time', uspread: 'Voice / Unison detune', dist: 'FX / Drive', dly: 'FX / Delay wet', dfb: 'FX / Delay regen', rev: 'FX / Reverb wet' } },
};
/** Which controls a Translate question may ask for, by how far the course has gone. */
export const PANEL_SETS: Record<string, string[]> = {
  basic: ['o1oct', 'nlvl', 'cut', 'res', 'pw', 'sublvl', 'o2det'],
  env: ['aa', 'ad', 'as', 'ar', 'fenv', 'fd', 'ktrk', 'glide'],
  mod: ['l1r', 'l1p', 'l1f', 'l1fade', 'cho', 'dist', 'dly', 'dfb', 'rev', 'uspread'],
};

export interface Recipe { name: string; brief: string; base: Patch; ref: Patch; ctls: string[]; note: number; seq: string; /** highest option to show on a choice control, where later ones have not been taught */ limit?: Record<string, number>; checks: { say: string; test: (p: Patch, f: Features) => boolean }[] }
export const RECIPES: Record<string, Recipe> = {
  sub: { name: 'a sub bass', brief: 'A pure, steady low note with no buzz: felt more than heard.', base: {}, ref: { o1w: 0 }, ctls: ['o1w', 'cut', 'aa', 'as', 'ar'], note: 48, seq: 'low', limit: { o1w: 3, o2w: 3 }, checks: [
    { say: 'Too bright for a sub. Use a sine or triangle, or close the filter', test: (_p, f) => f.centroid < 240 },
    { say: 'A sub holds steady while the key is down. Raise the sustain', test: (_p, f) => f.sustain > 0.6 },
    { say: 'It should start at once. Shorten the attack', test: (_p, f) => f.attack < 0.08 }] },
  reese: { name: 'a reese bass', brief: 'Two saws, detuned so they beat against each other, darkened by the filter.', base: {}, ref: { o2lvl: 0.8, o2det: 20, cut: 500 }, ctls: ['o1w', 'o2w', 'o2lvl', 'o2det', 'cut', 'res'], note: 48, seq: 'low', limit: { o1w: 3, o2w: 3 }, checks: [
    { say: 'Bring in the second oscillator', test: (p) => p.o2lvl >= 0.4 },
    { say: 'Detune the second oscillator so the two beat', test: (p) => p.o2det >= 8 },
    { say: 'Darken it: lower the cutoff', test: (_p, f) => f.centroid < 700 }] },
  acid: { name: 'an acid bass line', brief: 'One voice at a time, sliding between notes, with a squelchy resonant filter that snaps shut on each note.', base: { cut: 2000 }, ref: { cut: 300, res: 0.75, fenv: 0.55, fd: 0.2, mono: 1, leg: 1, glide: 0.08 }, ctls: ['cut', 'res', 'fenv', 'fd', 'mono', 'leg', 'glide'], note: 48, seq: 'riff', checks: [
    { say: 'Make it mono so notes cannot overlap', test: (p) => p.mono > 0.5 },
    { say: 'It needs more resonance to squelch', test: (p) => p.res >= 0.5 },
    { say: 'Let the filter envelope open the filter on each note', test: (p) => p.fenv >= 0.25 },
    { say: 'Start with the filter lower so the envelope has room to open it', test: (p) => p.cut <= 900 },
    { say: 'Add a little glide', test: (p) => p.glide >= 0.02 && p.glide <= 0.35 }] },
  pluck: { name: 'a pluck', brief: 'Instant start, then it dies away quickly even while the key is held.', base: {}, ref: { ad: 0.18, as: 0, ar: 0.12, cut: 900, fenv: 0.4, fd: 0.15 }, ctls: ['cut', 'fenv', 'fd', 'ad', 'as', 'ar'], note: 60, seq: 'pluck', checks: [
    { say: 'It should start at once. Shorten the attack', test: (_p, f) => f.attack < 0.04 },
    { say: 'It should die away while held. Lower the sustain and keep the decay short', test: (_p, f) => f.sustain < 0.25 },
    { say: 'Shorten the release so notes do not smear', test: (_p, f) => f.tail < 0.2 }] },
  keys: { name: 'a soft keyboard', brief: 'Mellow, quick to speak, fading gently while held, and louder when played harder.', base: {}, ref: { o1w: 1, cut: 1800, ad: 0.7, as: 0.3, ar: 0.25, avel: 0.6 }, ctls: ['o1w', 'cut', 'ad', 'as', 'ar', 'avel'], note: 60, seq: 'vel', limit: { o1w: 3, o2w: 3 }, checks: [
    { say: 'Too bright. Use a mellower wave or lower the cutoff', test: (_p, f) => f.centroid < 900 },
    { say: 'It should fade while held, but not to nothing. Set sustain somewhere in the lower half', test: (p) => p.as >= 0.1 && p.as <= 0.6 },
    { say: 'Give it a decay you can hear: longer than a pluck', test: (p) => p.ad >= 0.3 },
    { say: 'Make it respond to how hard it is played', test: (p) => p.avel >= 0.4 }] },
  strings: { name: 'a string pad', brief: 'Swells in, holds, and fades out slowly. Wide and slightly detuned, not too bright.', base: {}, ref: { o2lvl: 0.7, o2det: 12, cut: 1500, aa: 0.5, ar: 1.2, cho: 0.4 }, ctls: ['o2lvl', 'o2det', 'cut', 'aa', 'as', 'ar', 'cho'], note: 60, seq: 'chord', checks: [
    { say: 'Let it swell in. Lengthen the attack', test: (_p, f) => f.attack > 0.15 },
    { say: 'Let it fade out slowly. Lengthen the release', test: (_p, f) => f.tail > 0.25 },
    { say: 'It should hold while the keys are down. Raise the sustain', test: (p) => p.as >= 0.6 },
    { say: 'Widen it: bring in a detuned second oscillator, or chorus', test: (p) => (p.o2lvl >= 0.3 && p.o2det >= 5) || p.cho >= 0.3 },
    { say: 'Take some brightness off with the filter', test: (p) => p.cut <= 5000 }] },
  brass: { name: 'a brass stab', brief: 'The tone opens up just after each note starts, then settles: a "bwah".', base: { cut: 2000 }, ref: { cut: 400, fenv: 0.45, fa: 0.08, fd: 0.4, fs: 0.6, aa: 0.03 }, ctls: ['cut', 'fenv', 'fa', 'fd', 'fs', 'aa'], note: 60, seq: 'stab', checks: [
    { say: 'Start with the filter lower', test: (p) => p.cut <= 1000 },
    { say: 'Let the filter envelope open the filter', test: (p) => p.fenv >= 0.25 },
    { say: 'Give the filter envelope a short rise you can just hear', test: (p) => p.fa >= 0.03 && p.fa <= 0.3 },
    { say: 'The loudness should still start quickly', test: (p) => p.aa <= 0.12 }] },
  lead: { name: 'a singing lead', brief: 'One note at a time, sliding between notes, with vibrato that arrives only on held notes.', base: {}, ref: { mono: 1, leg: 1, glide: 0.08, l1r: 5.5, l1p: 0.3, l1fade: 0.5, cut: 4000 }, ctls: ['mono', 'leg', 'glide', 'l1r', 'l1p', 'l1fade', 'cut'], note: 72, seq: 'lead', checks: [
    { say: 'Make it mono', test: (p) => p.mono > 0.5 },
    { say: 'Add a little glide', test: (p) => p.glide >= 0.02 && p.glide <= 0.35 },
    { say: 'Add some vibrato: LFO to pitch', test: (p) => p.l1p >= 0.1 && p.l1p <= 1.5 },
    { say: 'Set the vibrato to a natural speed, around 4 to 8 Hz', test: (p) => p.l1r >= 3.5 && p.l1r <= 9 },
    { say: 'Fade the vibrato in so short notes stay clean', test: (p) => p.l1fade >= 0.2 }] },
  supersaw: { name: 'a supersaw', brief: 'A huge, bright wall: many detuned saws on every note.', base: { cut: 3000 }, ref: { uni: 5, uspread: 25, cut: 9000, cho: 0.3 }, ctls: ['uni', 'uspread', 'cut', 'cho', 'ar'], note: 48, seq: 'chord', checks: [
    { say: 'Stack more unison voices', test: (p) => p.uni >= 4 },
    { say: 'Spread the voices further apart in tuning', test: (p) => p.uspread >= 15 },
    { say: 'Open the filter: a supersaw is bright', test: (p) => p.cut >= 5000 }] },
  kick: { name: 'a kick drum', brief: 'A low thump: a sine whose pitch drops very fast at the start, and no sustain.', base: {}, ref: { o1w: 0, penv: 20, pdec: 0.05, ad: 0.25, as: 0, ar: 0.1 }, ctls: ['o1w', 'penv', 'pdec', 'ad', 'as', 'ar'], note: 48, seq: 'drum', limit: { o1w: 3, o2w: 3 }, checks: [
    { say: 'Use a sine or triangle for a clean thump', test: (p) => p.o1w <= 1 },
    { say: 'Make the pitch start well above the note', test: (p) => p.penv >= 8 },
    { say: 'The pitch must drop very fast', test: (p) => p.pdec <= 0.15 },
    { say: 'A drum has no sustain. Lower it and keep the decay short', test: (_p, f) => f.sustain < 0.2 }] },
  snare: { name: 'a snare', brief: 'A short burst of noise with a little tone underneath.', base: {}, ref: { nlvl: 0.9, o1lvl: 0.3, ad: 0.14, as: 0, ar: 0.08 }, ctls: ['o1lvl', 'nlvl', 'ad', 'as', 'ar'], note: 60, seq: 'drum', checks: [
    { say: 'It needs noise', test: (p) => p.nlvl >= 0.5 },
    { say: 'Turn the oscillator down so the noise leads', test: (p) => p.o1lvl <= 0.6 },
    { say: 'Keep it short: no sustain, quick decay', test: (_p, f) => f.sustain < 0.15 }] },
  hat: { name: 'a hi-hat', brief: 'Only the top of the noise, and very short.', base: {}, ref: { nlvl: 1, o1lvl: 0, ft: 1, cut: 6000, ad: 0.05, as: 0, ar: 0.04 }, ctls: ['o1lvl', 'nlvl', 'ft', 'cut', 'ad', 'as', 'ar'], note: 60, seq: 'drum', limit: { ft: 3 }, checks: [
    { say: 'It needs noise, and no oscillator', test: (p) => p.nlvl >= 0.5 && p.o1lvl <= 0.15 },
    { say: 'Use a high-pass filter to keep only the top', test: (p) => Math.round(p.ft) === 1 },
    { say: 'Raise the cutoff until only the sizzle is left', test: (p) => p.cut >= 3000 },
    { say: 'Make it very short', test: (p) => p.as <= 0.1 && p.ad <= 0.15 }] },
  riser: { name: 'a riser', brief: 'Noise that starts dark and opens up slowly: a build before a drop.', base: {}, ref: { nlvl: 0.9, o1lvl: 0, cut: 300, res: 0.5, fenv: 0.7, fa: 1.5 }, ctls: ['o1lvl', 'nlvl', 'cut', 'res', 'fenv', 'fa'], note: 60, seq: 'long', checks: [
    { say: 'Use noise as the source', test: (p) => p.nlvl >= 0.4 },
    { say: 'Start with the filter low', test: (p) => p.cut <= 1500 },
    { say: 'Send the filter envelope to the cutoff', test: (p) => p.fenv >= 0.4 },
    { say: 'The filter should open slowly. Lengthen the filter envelope attack', test: (p) => p.fa >= 0.7 }] },
  fmep: { name: 'an FM electric piano', brief: 'Two pairs of operators. One pair is the mellow body. The other is a bright "tine" that rings for an instant at the start of each note.', base: { o1w: 0 }, ref: { fma: 2, fmi: 1.2, fmr: 1, fmd: 0.5, f3i: 2, f3r: 6, f3d: 0.75, f4i: 1.5, ad: 0.8, as: 0.2, ar: 0.3 }, ctls: ['fma', 'fmi', 'fmr', 'fmd', 'f3i', 'f3r', 'f3d', 'f4i', 'ad', 'as', 'ar'], note: 60, seq: 'pluck', checks: [
    { say: 'Choose the two pairs algorithm: one pair for the body, one for the tine', test: (p) => Math.round(p.fma) === 2 },
    { say: 'Give the body a little FM from operator 2', test: (p) => p.fmi >= 0.5 && p.fmi <= 4 },
    { say: 'Keep the body\'s ratio at a low whole number for a clean tone', test: (p) => Math.round(p.fmr) >= 1 && Math.round(p.fmr) <= 3 },
    { say: 'Turn up operator 3: it is the tine', test: (p) => p.f3i >= 0.8 },
    { say: 'Set operator 3 to a high ratio so the tine is bright', test: (p) => Math.round(p.f3r) >= 4 },
    { say: 'Let the tine die away fast: raise operator 3 decay', test: (p) => p.f3d >= 0.5 },
    { say: 'It should fade while held. Lower the sustain', test: (p) => p.as <= 0.5 }] },
  fmbell: { name: 'an FM bell', brief: 'A clangy strike that rings on for a long time. Three operators at different ratios all push one carrier.', base: { o1w: 0 }, ref: { fma: 3, fmi: 3, fmr: 6, fmd: 0.3, f3i: 2, f3r: 3, ad: 1.5, as: 0, ar: 1.5 }, ctls: ['fma', 'fmi', 'fmr', 'fmd', 'f3i', 'f3r', 'ad', 'as', 'ar'], note: 60, seq: 'pluck', checks: [
    { say: 'Use a high ratio on operator 2 for a clangy tone', test: (p) => Math.round(p.fmr) >= 4 },
    { say: 'It needs more FM from operator 2', test: (p) => p.fmi >= 1.5 },
    { say: 'Choose the three into one algorithm, so each operator adds its own partials', test: (p) => Math.round(p.fma) === 3 },
    { say: 'Bring in operator 3 at a different ratio from operator 2 for a richer clang', test: (p) => p.f3i >= 1 && Math.round(p.f3r) !== Math.round(p.fmr) },
    { say: 'A bell is struck: no sustain', test: (p) => p.as <= 0.1 },
    { say: 'Let it ring: long decay and release', test: (p) => p.ad >= 0.6 && p.ar >= 0.5 }] },
  fmbass: { name: 'an FM bass', brief: 'A punchy low note with a hard, bright start that settles at once. Stack three operators for the bite.', base: { o1w: 0 }, ref: { fma: 0, fmi: 3, fmr: 1, fmd: 0.7, f3i: 2, f3r: 1, f3d: 0.8, ad: 0.3, as: 0.5 }, ctls: ['fma', 'fmi', 'fmr', 'fmd', 'f3i', 'f3r', 'f3d', 'ad', 'as'], note: 48, seq: 'riff', checks: [
    { say: 'It needs plenty of FM from operator 2 for the hard start', test: (p) => p.fmi >= 2 },
    { say: 'The FM amount should decay fast', test: (p) => p.fmd >= 0.5 },
    { say: 'Keep operator 2 at ratio 0.5 or 1 so the bass stays solid', test: (p) => Math.round(p.fmr) <= 1 },
    { say: 'Keep the stack algorithm, and turn up operator 3 on top for more bite', test: (p) => Math.round(p.fma) === 0 && p.f3i >= 1 },
    { say: 'Let operator 3 decay fast too', test: (p) => p.f3d >= 0.5 }] },
};
