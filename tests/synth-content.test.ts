import './synth-setup';
import { describe, it, expect } from 'vitest';
import { LESSONS } from '../src/content';
import { SKILLS } from '../src/sched';
import { EX, exParams } from '../src/exercises';
import { mulberry } from '../src/music';
import { PD, mkPatch, norm, denorm, isChoice, isStepped } from '../src/synth/dsp';
import { gradeMatch, gradePanel, stepsToSeq, seqOf } from '../src/synth/exercises';
import { RECIPES, QUIZ, QUIZ_AT, FLOW, SKINS, PANEL_SETS } from '../src/synth/bank';
import { planCheck, variants, passMark, CHECK_MIN, CHECK_MAX } from '../src/check';
import { spectrum, waveform, loudness } from '../src/synth/analysis';
import { quizRows } from '../src/synth/exercises';
import { features, distance } from '../src/synth/analysis';

const synth = LESSONS.filter((l) => l.track === 'synth');
describe('synth content', () => {
  it('has 12 units of the planned sizes', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((u) => synth.filter((l) => l.level === u).length)).toEqual([6, 8, 9, 7, 8, 8, 7, 9, 12, 10, 10, 9]);
    for (const l of synth) { expect(l.unlocks.length, l.id).toBeGreaterThan(0); for (const c of l.adds ?? []) expect(PD[c], `${l.id} adds ${c}`).toBeTruthy(); }
  });
  it('question banks are well formed', () => {
    for (const bank of [QUIZ, FLOW]) for (const rows of Object.values(bank)) for (const r of rows) { expect(r.length, r[0]).toBeGreaterThanOrEqual(4); expect(new Set(r.slice(1)).size, r[0]).toBe(r.length - 1); }
    for (const l of synth) for (const u of l.unlocks) { if (u.ex === 'S13') expect(QUIZ[u.preset.topic], l.id).toBeTruthy(); if (u.ex === 'S9') expect(FLOW[u.preset.set], l.id).toBeTruthy(); if (u.ex === 'S14') expect(PANEL_SETS[u.preset.set], l.id).toBeTruthy(); if (u.ex === 'S12') expect(RECIPES[u.preset.recipe], l.id).toBeTruthy(); }
  });
  it('every recipe is passed by its reference patch and failed by its starting patch', () => {
    for (const [id, rc] of Object.entries(RECIPES)) {
      const ref = mkPatch({ ...rc.base, ...rc.ref }), start = mkPatch(rc.base);
      for (const c of rc.checks) expect(c.test(ref, features(ref, rc.note)), `${id}: reference fails "${c.say}"`).toBe(true);
      expect(rc.checks.some((c) => !c.test(start, features(start, rc.note))), `${id}: the starting patch already passes`).toBe(true);
      for (const k of Object.keys(rc.ref)) expect(rc.ctls, `${id}: ${k} is needed but not on the panel`).toContain(k);
    }
  });
  it('a match only uses controls the learner has met, starts wrong, and can be finished', () => {
    const known = new Set<string>();
    for (const l of synth) {
      (l.adds ?? []).forEach((c) => known.add(c));
      for (const u of l.unlocks) {
        if (!['S5', 'S6', 'S7', 'S10', 'S12'].includes(u.ex)) continue; // S15 has no controls
        for (let seed = 1; seed <= 12; seed++) {
          const q = EX[u.ex].gen(exParams(u.ex, u.preset), mulberry(seed * 104729)), a = q.answer;
          if (a.kind !== 'match') throw new Error('not a match');
          for (const c of a.ctls) expect(known.has(c), `${l.id}: ${c} is not unlocked yet`).toBe(true);
          expect(gradeMatch(a, a.start).ok, `${l.id} ${u.title}: starts already matched`).toBe(false);
          expect(gradeMatch(a, a.target).ok, `${l.id} ${u.title}: target does not pass`).toBe(true);
        }
      }
    }
  });
  it('every graded control in a match makes an audible difference at the target', () => {
    const bad: string[] = [];
    for (const k of Object.values(SKILLS)) {
      if (!['S5', 'S6', 'S10'].includes(k.ex)) continue;
      for (let seed = 1; seed <= 4; seed++) {
        const q = EX[k.ex].gen(exParams(k.ex, k.preset), mulberry(seed * 7919)), a = q.answer;
        if (a.kind !== 'match') continue;
        const seq = seqOf(a.seq).n;
        for (const c of a.ctls) {
          // The measure compares held tone and loudness shape; it cannot hear pitch slides or echoes, which are plainly audible.
          if (isChoice(c) || isStepped(c) || ['glide', 'dtime', 'dfb'].includes(c)) continue;
          const n = norm(c, a.target[c]), step = PD[c].tol * a.tolK * 3, moved = { ...a.target, [c]: denorm(c, n + (n + step <= 1 ? step : -step)) };
          if (distance(mkPatch(a.target), mkPatch(moved), seq) < 0.004) bad.push(`${k.lessonId} ${k.title}: ${c}`);
        }
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });
  it('Translate asks for a control that is on the panel, and only moving it the right way passes', () => {
    for (const set of Object.keys(PANEL_SETS)) for (let seed = 1; seed <= 60; seed++) {
      const q = EX.S14.gen(exParams('S14', { set }), mulberry(seed * 31)), a = q.answer;
      if (a.kind !== 'panel') throw new Error('not a panel');
      expect(a.ctls).toContain(a.target); expect(new Set(a.ctls).size).toBe(a.ctls.length);
      for (const c of a.ctls) { expect(a.labels[c], `${a.skin} has no label for ${c}`).toBeTruthy(); expect(PD[c]).toBeTruthy(); }
      expect(SKINS[a.skin]).toBeTruthy();
      const move = (id: string, d: number) => ({ ...a.start, [id]: denorm(id, norm(id, a.start[id]) + d) });
      expect(gradePanel(a, a.start)).toBe(false);
      expect(gradePanel(a, move(a.target, a.up ? 0.3 : -0.3)), `${a.skin} ${a.target}`).toBe(true);
      expect(gradePanel(a, move(a.target, a.up ? -0.3 : 0.3))).toBe(false);
      const other = a.ctls.find((c) => c !== a.target)!; expect(gradePanel(a, move(other, 0.3))).toBe(false);
    }
  });
  it('a pattern question starts on a note and turns into a loop of the right length', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const q = EX.S15.gen(exParams('S15'), mulberry(seed * 17)), a = q.answer;
      if (a.kind !== 'pattern') throw new Error('not a pattern');
      expect(a.target.length).toBe(8); expect(a.target[0]).not.toBeNull();
      for (const v of a.target) if (v != null) expect(a.pitches).toContain(v);
      const sq = stepsToSeq(a.target, a.base, a.stepSec); expect(sq.loop).toBeCloseTo(2); expect(sq.n.length).toBe(a.target.filter((v) => v != null).length);
    }
  });
  it('units 1 to 4 each have quick listening skills for the placement quiz', () => {
    for (const unit of [1, 2, 3, 4]) expect(synth.filter((l) => l.level === unit).flatMap((l) => l.unlocks.filter((u) => ['S1', 'S2', 'S3', 'S4', 'S8'].includes(u.ex)).slice(0, 1)).length, 'unit ' + unit).toBeGreaterThanOrEqual(3);
  });
  it('every quiz fact is tagged with a lesson, and every quiz has facts by the time it is asked', () => {
    for (const [topic, rows] of Object.entries(QUIZ)) { expect(QUIZ_AT[topic]?.length, topic).toBe(rows.length); for (const t of QUIZ_AT[topic]) expect(synth.some((l) => l.id === 'S' + t), `${topic}: no lesson ${t}`).toBe(true); }
    for (const l of synth) {
      for (const u of l.unlocks) if (u.ex === 'S13') { expect(u.preset.at, l.id).toBe(l.id.slice(1)); expect(quizRows(u.preset.topic, u.preset.at).length, `${l.id} "${u.title}" has no facts yet`).toBeGreaterThan(0); }
      expect(l.fill, l.id).toBeTruthy();
    }
    // a fact is never asked before the lesson that teaches it
    expect(quizRows('sound', '1.1').map((r) => r[1]).sort()).toEqual(['A higher pitch', 'One octave up']);
    expect(quizRows('filter', '3.1').length).toBe(1);
    expect(quizRows('env', '4.5').some((r) => r[0].includes('pluck'))).toBe(false);
  });
  it('a planned check asks every unlock, covers its distinct questions, and never repeats one while new ones remain', () => {
    const SLOW = ['S5', 'S6', 'S7', 'S10', 'S12', 'S15'], sizes: Record<number, number> = {};
    for (const l of synth) for (let round = 0; round < 8; round++) {
      const rnd = mulberry(round * 7919 + l.id.length * 13 + l.level), plan = planCheck(l, l.unlocks.map((_, i) => `${l.id}:${i}`), rnd);
      sizes[plan.length] = (sizes[plan.length] ?? 0) + 1;
      expect(plan.length, l.id).toBeGreaterThanOrEqual(Math.min(CHECK_MIN, l.unlocks.length)); expect(plan.length, l.id).toBeLessThanOrEqual(CHECK_MAX);
      expect(passMark(plan.length)).toBeLessThan(plan.length);
      const key = (x: { ex: string; preset: any; seed: number }) => x.ex + '|' + JSON.stringify(x.preset) + '|' + EX[x.ex].gen(exParams(x.ex, x.preset), mulberry(x.seed)).item, counts = new Map<string, number>();
      for (const x of plan) counts.set(key(x), (counts.get(key(x)) ?? 0) + 1);
      l.unlocks.forEach((u, i) => {
        const mine = plan.filter((x) => x.skillId === `${l.id}:${i}`); expect(mine.length, `${l.id}: "${u.title}" is not in the check`).toBeGreaterThan(0);
        if (SLOW.includes(u.ex)) { expect(mine.length, `${l.id}: "${u.title}" asked more than once`).toBe(1); return; }
        const all = variants(u.ex, u.preset, mulberry(5), 200).length, distinct = new Set(mine.map(key)).size;
        // a repeat is allowed only once every distinct question of that exercise has been asked
        if (mine.length > distinct) expect(distinct, `${l.id}: "${u.title}" repeats a question while ${all - distinct} unasked ones remain`).toBe(all);
        if (['S2', 'S8', 'S3'].includes(u.ex) && l.unlocks.length <= 2 && all <= 4) expect(distinct, `${l.id}: "${u.title}" covers ${distinct} of ${all}`).toBe(all);
      });
      expect(plan.every((x) => !EX[x.ex].gen(exParams(x.ex, x.preset), mulberry(x.seed)).item.startsWith('!')), l.id).toBe(true);
      const slowAt = plan.findIndex((x) => SLOW.includes(x.ex)); if (slowAt >= 0) expect(plan.slice(slowAt).every((x) => SLOW.includes(x.ex)), `${l.id}: long questions come last`).toBe(true);
    }
    expect(Object.keys(sizes).map(Number).every((n) => n >= 2 && n <= 8)).toBe(true);
  });
  it('lesson figures and questions show and play things that can be told apart', () => {
    const series = (kind: string, p: any, seq?: string) => { const q = seqOf(seq); return kind === 'wave' ? waveform(mkPatch(p), q.n) : kind === 'env' ? loudness(mkPatch(p), q.n, q.loop, 110) : spectrum(mkPatch(p), q.n); };
    const picDiff = (kind: string, a: any, b: any, seq?: string) => { const x = series(kind, a, seq), y = series(kind, b, seq); return Math.max(...x.map((v, i) => Math.abs(v - y[i]))); };
    const known = new Set<string>();
    for (const l of synth) {
      (l.adds ?? []).forEach((c) => known.add(c));
      for (const st of l.steps as any[]) {
        const f = st.fig; if (!f) continue;
        if ('panel' in f) for (const c of f.panel) expect(known.has(c), `${l.id}: the live panel has ${c} before it is introduced`).toBe(true);
        if ('sounds' in f) { expect(f.sounds.length, l.id).toBeGreaterThanOrEqual(2); if (f.view) for (let a = 0; a < f.sounds.length; a++) for (let b = a + 1; b < f.sounds.length; b++) expect(picDiff(f.view, f.sounds[a][1], f.sounds[b][1], f.seq), `${l.id}: ${f.sounds[a][0]} and ${f.sounds[b][0]} look the same`).toBeGreaterThan(0.06); }
        if ('patch' in f && f.vs && f.view) expect(picDiff(f.view, f.patch, { ...f.patch, ...f.vs }, f.seq), `${l.id}: "${f.label}" and "${f.vsLabel}" look the same`).toBeGreaterThan(0.06);
      }
      for (const u of l.unlocks) if (u.ex === 'S8') { const p: any = exParams('S8', u.preset), o = p.opts as [string, any][]; for (let a = 0; a < o.length; a++) for (let b = a + 1; b < o.length; b++) expect(picDiff(p.view, { ...p.base, ...o[a][1] }, { ...p.base, ...o[b][1] }, p.seq), `${l.id} "${u.title}": ${o[a][0]} and ${o[b][0]} look the same`).toBeGreaterThan(0.08); }
    }
  });
  it('a match never aims at an option the learner has not been taught', () => {
    const u = synth.find((l) => l.id === 'S2.8')!.unlocks.find((x) => x.ex === 'S6')!;
    for (let seed = 1; seed <= 80; seed++) { const a: any = EX.S6.gen(exParams('S6', u.preset), mulberry(seed)).answer; expect(a.target.o1w).toBeLessThanOrEqual(3); expect(a.target.o2w).toBeLessThanOrEqual(3); expect(a.start.o1w).toBeLessThanOrEqual(3); expect(a.limit.o1w).toBe(3); }
  });
});
