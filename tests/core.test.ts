import { describe, it, expect } from 'vitest';
import { P, midi, intervalName, scale, pname, chordTones, key, rnMap, diatonic, keyScale, mulberry, addInterval, allKeys } from '../src/music';
import { parseNotes, totalBeats, barLen, measures, onsets, mk } from '../src/passage';
import { genPhrase, genRhythm, LEVELS } from '../src/gen';
import { gradeRhythm, gradePerform, matchStep, tolMs } from '../src/grade';
import { detectPitch } from '../src/input';
import { PIECES } from '../src/content/pieces';
import { LESSONS } from '../src/content';
import { EX, exParams } from '../src/exercises';
import { SKILLS } from '../src/sched';

const names = (ps: { l: number; a: number; o: number }[]) => ps.map((p) => pname(p)).join(' ');

describe('music theory', () => {
  it('names intervals', () => {
    expect(intervalName(P('C4'), P('E4'))).toBe('M3');
    expect(intervalName(P('C4'), P('Eb4'))).toBe('m3');
    expect(intervalName(P('C4'), P('F#4'))).toBe('A4');
    expect(intervalName(P('C4'), P('Gb4'))).toBe('d5');
    expect(intervalName(P('D4'), P('C5'))).toBe('m7');
    expect(intervalName(P('C4'), P('D5'))).toBe('M9');
    expect(intervalName(P('E4'), P('C4'))).toBe('M3');
  });
  it('spells scales', () => {
    expect(names(scale(P('G4'), 'major'))).toBe('G A B C D E F#');
    expect(names(scale(P('F4'), 'major'))).toBe('F G A Bb C D E');
    expect(names(scale(P('Eb4'), 'major'))).toBe('Eb F G Ab Bb C D');
    expect(names(scale(P('A4'), 'harmonic'))).toBe('A B C D E F G#');
    expect(names(scale(P('F#4'), 'major'))).toBe('F# G# A# B C# D# E#');
    expect(names(scale(P('D4'), 'dorian'))).toBe('D E F G A B C');
  });
  it('spells chords and inversions', () => {
    expect(names(chordTones(P('C4'), 'maj'))).toBe('C E G');
    expect(names(chordTones(P('B3'), 'dim7'))).toBe('B D F Ab');
    expect(names(chordTones(P('C4'), 'maj', 1))).toBe('E G C');
    expect(chordTones(P('C4'), 'maj', 2).map(midi)).toEqual([67, 72, 76]);
  });
  it('builds Roman numerals', () => {
    const c = rnMap(key('C'));
    expect(pname(c['V'].root)).toBe('G'); expect(c['vii°'].q).toBe('dim'); expect(pname(c['V7/V'].root)).toBe('D'); expect(pname(c['♭VI'].root)).toBe('Ab');
    const a = rnMap(key('Am'));
    expect(pname(a['V'].root)).toBe('E'); expect(a['V'].q).toBe('maj'); expect(pname(a['vii°'].root)).toBe('G#'); expect(a['i'].q).toBe('min');
    expect(names(keyScale(key('Bb')))).toBe('Bb C D Eb F G A');
    expect(diatonic(key('G'), 4, true).rn).toBe('V7');
    expect(allKeys(false, 2, 'sharps')).toEqual(['C', 'G', 'D']);
    expect(pname(addInterval(P('C4'), -2, -4))).toBe('Ab');
  });
});

describe('passages and pieces', () => {
  it('parses the text notation', () => {
    const n = parseNotes('C4 D4/2 r/1 [C4 E4 G4]/2 E4/1.5~ E4/0.5:Am');
    expect(n.length).toBe(6); expect(totalBeats(n)).toBe(8); expect(n[2].rest).toBe(true); expect(n[3].p.length).toBe(3); expect(n[4].tie).toBe(true); expect(n[5].sym).toBe('Am');
    expect(onsets(mk('E4/1.5~ E4/0.5 F4')).length).toBe(2);
  });
  it('every piece fills whole bars and its staves agree', () => {
    for (const pc of PIECES) {
      const len = barLen(pc.passage.time), tot = pc.passage.staves.map((s) => totalBeats(s.notes));
      expect(tot[0] % len, pc.id + ' incomplete bars').toBeCloseTo(0, 6);
      if (tot[1] !== undefined) expect(tot[1], pc.id + ' hands differ').toBeCloseTo(tot[0], 6);
      for (const st of pc.passage.staves) for (const m of measures(st.notes, len)) expect(m.reduce((a, x) => a + x.n.d, 0), pc.id + ' bar overflow').toBeCloseTo(len, 6);
    }
    expect(PIECES.length).toBeGreaterThanOrEqual(40);
  });
});

describe('phrase generator (property tests)', () => {
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`level ${level}: bars are full, range and level rules hold over 10,000 seeds`, () => {
      for (let seed = 1; seed <= 10000; seed++) {
        const p = genPhrase(level, mulberry(seed)), len = barLen(p.time), L = LEVELS[level];
        expect(L.keys).toContain(p.key);
        for (const st of p.staves) {
          for (const m of measures(st.notes, len)) { const sum = m.reduce((a, x) => a + x.n.d, 0); if (Math.abs(sum - len) > 1e-6) throw new Error(`seed ${seed}: bar sums to ${sum}`); }
          for (const n of st.notes) for (const x of n.p) if (Math.abs(x.a) > 2) throw new Error(`seed ${seed}: bad accidental`);
        }
        if (level === 1) for (const n of p.staves[0].notes) for (const x of n.p) { const m = midi(x); if (m < 60 || m > 67) throw new Error(`seed ${seed}: out of range ${m}`); }
        if (level <= 2) for (const st of p.staves) for (const n of st.notes) if (![1, 2, 3, 4].includes(n.d)) throw new Error(`seed ${seed}: value ${n.d} too advanced`);
        if (level >= 6 && level <= 7 && p.staves.length !== 2) throw new Error('expected two staves');
        const mel = p.staves[0].notes.filter((n) => !n.rest);
        if (level !== 3 && level !== 5) { const last = mel[mel.length - 1].p[0], t = key(p.key).tonic; if (last.l !== t.l) throw new Error(`seed ${seed}: does not end on the tonic`); }
      }
    });
  }
  it('rhythms fill their bars', () => {
    for (let seed = 1; seed < 3000; seed++) for (const time of [[4, 4], [3, 4], [6, 8]] as [number, number][]) {
      const n = genRhythm(6, mulberry(seed), 4, time); expect(totalBeats(n)).toBeCloseTo(4 * barLen(time), 6);
    }
  });
});

describe('graders', () => {
  it('matches steps', () => {
    expect(matchStep([60], [60], false)).toBe(true); expect(matchStep([60], [72], false)).toBe(false); expect(matchStep([60], [72], true)).toBe(true);
    expect(matchStep([60, 64, 67], [48, 76, 67], true)).toBe(true); expect(matchStep([64, 67, 72], [60, 64, 67], true, true)).toBe(false); expect(matchStep([64, 67, 72], [52, 67, 72], true, true)).toBe(true);
  });
  it('grades rhythm', () => {
    const tol = tolMs(1000); expect(tol).toBe(150);
    const r = gradeRhythm([0, 1000, 2000, 3000], [10, 1040, 2300, 2990], tol);
    expect(r.marks).toEqual(['ok', 'ok', 'late', 'ok']); expect(r.pct).toBe(0.75);
    expect(gradeRhythm([0, 1000], [0], tol).marks[1]).toBe('miss');
    expect(tolMs(200)).toBe(60);
  });
  it('grades a performance, pitch and rhythm separately', () => {
    const exp = [0, 500, 1000, 1500].map((t, i) => ({ t, midi: 60 + i, id: String(i) }));
    const perfect = gradePerform(exp, exp.map((e) => ({ t: e.t + 20, midi: e.midi })), 75, 500);
    expect(perfect.pitchPct).toBe(1); expect(perfect.rhythmPct).toBe(1);
    const wrong = gradePerform(exp, [{ t: 0, midi: 60 }, { t: 500, midi: 70 }, { t: 1000, midi: 62 }, { t: 1500, midi: 63 }], 75, 500);
    expect(wrong.marks['1']).toBe('wrong'); expect(wrong.pitchPct).toBe(0.75); expect(wrong.rhythmPct).toBe(1);
    const late = gradePerform(exp, [{ t: 0, midi: 60 }, { t: 680, midi: 61 }, { t: 1000, midi: 62 }, { t: 1500, midi: 63 }], 75, 500);
    expect(late.marks['1']).toBe('late'); expect(late.pitchPct).toBe(1); expect(late.rhythmPct).toBe(0.75);
  });
});

describe('pitch detector', () => {
  it('finds sung and played pitches within 10 cents on at least 95% of fixtures', () => {
    const sr = 48000; let ok = 0, n = 0;
    for (let m = 40; m <= 84; m++) for (const shape of [0, 1, 2]) {
      const f = 440 * 2 ** ((m - 69) / 12), buf = new Float32Array(2048);
      for (let i = 0; i < buf.length; i++) { const t = i / sr; buf[i] = 0.5 * Math.sin(2 * Math.PI * f * t) + (shape >= 1 ? 0.3 * Math.sin(2 * Math.PI * 2 * f * t + 0.5) : 0) + (shape === 2 ? 0.2 * Math.sin(2 * Math.PI * 3 * f * t + 1) + 0.02 * Math.sin(i * 12.9898) : 0); }
      const hz = detectPitch(buf, sr); n++;
      if (hz && Math.abs(1200 * Math.log2(hz / f)) < 10) ok++;
    }
    expect(ok / n).toBeGreaterThanOrEqual(0.95);
  });
});

describe('content', () => {
  it('has 72 lessons and every exercise reference is valid', () => {
    expect(LESSONS.length).toBe(72);
    expect(LESSONS.filter((l) => l.track === 'theory').length).toBe(55);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(72);
    for (const l of LESSONS) {
      for (const st of l.steps) { expect(st.t.split(/\s+/).length, l.id + ' step too long').toBeLessThanOrEqual(60); if (st.try) expect(EX[st.try.ex], l.id).toBeTruthy(); if (st.fig && 'staff' in st.fig) parseNotes(st.fig.staff); }
      for (const n of l.needs ?? []) expect(LESSONS.find((x) => x.id === n), l.id + ' needs ' + n).toBeTruthy();
    }
    expect(Object.keys(EX).length).toBe(27);
  });
  it('every skill preset generates valid questions', () => {
    const all = [...Object.values(SKILLS).map((k) => ({ ex: k.ex, preset: k.preset, id: k.id })), ...LESSONS.flatMap((l) => [...(l.quiz ?? []), ...l.steps.filter((s) => s.try).map((s) => s.try!)].map((q) => ({ ...q, id: l.id })))];
    for (const k of all) for (let seed = 1; seed <= 40; seed++) {
      const q = EX[k.ex].gen(exParams(k.ex, k.preset), mulberry(seed * 7919));
      expect(q.prompt.length, k.id).toBeGreaterThan(3);
      if (q.answer.kind === 'slots') for (const s of q.answer.slots) expect(s.choices, `${k.id} ${k.ex}: "${s.value}" not among choices`).toContain(s.value);
      if (q.answer.kind === 'steps') { expect(q.answer.steps.length).toBeGreaterThan(0); for (const st of q.answer.steps) { expect(st.length).toBeGreaterThan(0); st.forEach((m) => expect(Number.isFinite(m)).toBe(true)); } for (const s of q.answer.alt ?? []) expect(s.choices, k.id).toContain(s.value); }
      if (q.answer.kind === 'perform') expect(onsets(q.answer.expect ?? q.answer.passage).length).toBeGreaterThan(0);
    }
  });
  it('every exercise works with its defaults', () => {
    for (const id of Object.keys(EX)) for (let seed = 1; seed <= 100; seed++) EX[id].gen(exParams(id), mulberry(seed));
  });
});
