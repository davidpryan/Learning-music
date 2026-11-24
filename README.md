# Learning Music

A free web app for learning music theory, sight reading and ear training from zero, in one place.
A second mode, switched on the Home screen, teaches how to use a synthesizer on a synth built into the app.
No account, no server, no subscription: it is a static site, and your progress is stored in your own browser.

## What is in it

- **72 lessons** in three linked tracks: 55 theory, 9 reading technique, 8 ear technique. Each ends in a 5-question check and unlocks skills.
- **27 exercises** (12 theory and recognition, 6 reading, 9 ear), each usable in lessons, the daily session, free practice with every parameter exposed, and challenge modes.
- **Three inputs**, interchangeable at any time: an on-screen keyboard (multi-touch, plus computer keys), a microphone (one note at a time, sung or played), and a MIDI keyboard.
- **Reading at tempo**: a seeded phrase generator with 8 levels, a metronome and count-in, and pitch and rhythm graded separately and marked on the score.
- **Nine games** that train the same skills and feed the same skill records, with XP, stars, streaks, badges and a date-seeded daily challenge. The two timed games each have four modes (chords, intervals, keys, numerals; degrees, intervals, chord colour, function), and any quick-answer skill can be run as a 60-second sprint.
- **Synth mode**: 103 lessons in 12 units (sound, oscillators, filters, envelopes, modulation, voices, effects, recipes, four-operator FM, wavetable, additive, sampling, granular, a plucked-string model, the mod matrix and reading any synth), 15 exercise types (S1 to S15), three games (Name That Sound, Knob Rush, Patch Golf) with a daily challenge, a placement quiz, and a free-play synth with a 16-step sequencer, your own samples, patch saving and share links. It shares the streak, XP, badges and review scheduler with the music mode, and has its own daily time goal.
- **Spaced repetition** (FSRS) decides what to review; a daily session is built for you.
- **Tools**: circle of fifths, scale and chord finder, interval calculator, staff paper with playback, metronome, tuner.
- **Your data**: export and import as a JSON file; import your own MusicXML pieces.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and property tests (Vitest)
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
```

Browser tests drive a real Chrome through the app (they expect Chrome at `/usr/bin/google-chrome` and a dev server on port 5173):

```bash
npm run dev &
node tests/e2e.mjs      # renders every figure, piece and generated question; walks every screen
node tests/flows.mjs    # answers questions through the input bus; checks grading, unlocks, games, data
node tests/ux.mjs       # placement quiz, lock guidance, Back button, alternative answer modes, tools, themes
```

## Put it online

The build is plain static files with relative paths, so any static host works.
For GitHub Pages, push to `main` and set **Settings → Pages → Source** to **GitHub Actions**; the included workflow builds and deploys it.
The microphone and MIDI need a secure (https) page that is opened directly, not embedded in another site.

## How it is organised

```text
src/
  music.ts        pitches, intervals, scales, keys, chords, Roman numerals, seeded RNG
  passage.ts      the shared music model and its compact text notation
  notation.tsx    Passage -> engraved SVG (VexFlow)
  audio.ts        Web Audio synth voices, metronome, sequencer
  input.ts        one event bus for on-screen keys, microphone (pitch detection) and MIDI
  gen.ts          rule-based phrase and rhythm generator, levels 1 to 8
  grade.ts        graders: steps, rhythm, performance (pitch and rhythm separately)
  exercises.ts    the 27-exercise catalog
  sched.ts        skills, mastery rules, FSRS scheduling, daily session, XP, streaks, badges
  store.ts        app state, IndexedDB persistence, export and import
  musicxml.ts     a small MusicXML reader
  config.ts       every tunable number
  content/        lessons, pieces, badges
  ui/             keyboard, question runner, at-tempo performer, shared components
  screens/        Home, Learn, Lesson, Practice, Play, Progress, Tools, Settings, Onboarding
  games/          the nine games
tests/            unit, property and browser tests
```

### Writing content

Lessons are plain data in `src/content/`. A step is text (60 words at most) plus an optional figure and an optional "try it" exercise.
Music is written in a small text notation: `C4 D4/2 r/1 [C4 E4 G4]/2 E4/1.5~ E4/0.5:Am`
(note name and octave, `/beats`, `r` for a rest, `[...]` for a chord, `~` for a tie, `:Sym` for a chord symbol above).

## Synth mode

- Synth mode is a separate download (`src/synthpack.ts`), fetched the first time someone chooses Synth; `src/synthload.tsx` is the only door to it from the main bundle. Tests load the synth lessons through `tests/synth-setup.ts`.
- `src/synth/dsp.ts` is the whole sound engine in plain TypeScript: two oscillators, sub, noise, sync, ring mod, two-operator FM, a wavetable, a multimode 12/24 dB filter, three envelopes, two LFOs, a three-slot mod matrix, unison, glide, an arpeggiator, eight effects, and four other engines. It runs in an audio worklet (`worklet.ts`, driven from `live.ts`) and, unchanged, offline for pictures, grading and tests.
- Every control has one definition (range, curve, unit, grading tolerance) in `dsp.ts`. The panel, the graders and the exercise generators all read it.
- Matching is graded on settings, in perceptual units (`gradeMatch` in `src/synth/exercises.ts`). Recipes are graded on a brief: measured features of the rendered sound plus a few settings (`src/synth/bank.ts`).
- Lessons are in `src/content/synth1.ts` and `synth2.ts`. A lesson's `adds` lists the controls it introduces; the free-play synth shows the controls of the lessons passed.
- `tests/synth.test.ts` checks the engine; `tests/synth-content.test.ts` checks that every recipe's reference patch passes and its starting patch fails, that a match never uses a control the learner has not met, and that every graded control makes an audible difference at its target.

## Look

The app follows the Toybox style guide, with its Learning extensions: flat solid blocks on a paper sheet over a coloured mat, one hue per area, hard lips on things you press, Poppins, a status line under each title band, knobs as a disc with one dot inside a scale of dots, and a filled target area under an ink trace. All of it is in `src/styles.css`.

## Known limits

- Synth mode has been checked in desktop Chrome only; it has not been tuned on phones or in Safari, and the lessons have not been play-tested for difficulty.
- A sound you import or record for the sampler is kept only until the app is closed.
- The synth is mono: unison, chorus and reverb do not spread across the speakers.

- Sounds are synthesised in the browser; there are no sampled instruments.
- The microphone hears one note at a time. Chords and two-hand playing need the on-screen or a MIDI keyboard.
- The piece library has 48 short public-domain tunes, encoded by hand for this project.
- Tested in desktop Chrome. Web MIDI is not available in every browser; the app falls back to the other inputs.

## Licence

MIT. See [LICENSE](LICENSE). The tunes in the piece library are in the public domain; their encodings here are covered by the same licence.
Notation is drawn with [VexFlow](https://www.vexflow.com/) (MIT); review scheduling uses [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT).

## Credits

Piano samples in `public/piano/` come from the FluidR3 GM soundfont by Frank Wen, as packaged in [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts), licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/us/). They were converted to mono and shortened. If the files are missing the app falls back to its built-in synthesised piano.
