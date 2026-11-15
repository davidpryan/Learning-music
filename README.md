# Learning Music

A free web app for learning music theory, sight reading and ear training from zero, in one place.
No account, no server, no subscription: it is a static site, and your progress is stored in your own browser.

## What is in it

- **72 lessons** in three linked tracks: 55 theory, 9 reading technique, 8 ear technique. Each ends in a 5-question check and unlocks skills.
- **27 exercises** (12 theory and recognition, 6 reading, 9 ear), each usable in lessons, the daily session, free practice with every parameter exposed, and challenge modes.
- **Three inputs**, interchangeable at any time: an on-screen keyboard (multi-touch, plus computer keys), a microphone (one note at a time, sung or played), and a MIDI keyboard.
- **Reading at tempo**: a seeded phrase generator with 8 levels, a metronome and count-in, and pitch and rhythm graded separately and marked on the score.
- **Nine games** that train the same skills and feed the same skill records, with XP, stars, streaks, badges and a daily challenge.
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

## Known limits

- Sounds are synthesised in the browser; there are no sampled instruments.
- The microphone hears one note at a time. Chords and two-hand playing need the on-screen or a MIDI keyboard.
- The piece library has 48 short public-domain tunes, encoded by hand for this project.
- Tested in desktop Chrome. Web MIDI is not available in every browser; the app falls back to the other inputs.

## Licence

MIT. See [LICENSE](LICENSE). The tunes in the piece library are in the public domain; their encodings here are covered by the same licence.
Notation is drawn with [VexFlow](https://www.vexflow.com/) (MIT); review scheduling uses [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT).
