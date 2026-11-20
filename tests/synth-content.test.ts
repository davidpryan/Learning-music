import { describe, it, expect } from 'vitest';
import { LESSONS } from '../src/content';
import { SKILLS } from '../src/sched';
import { EX, exParams } from '../src/exercises';
import { mulberry } from '../src/music';
import { PD, mkPatch, norm, denorm, isChoice, isStepped } from '../src/synth/dsp';
import { gradeMatch, seqOf } from '../src/synth/exercises';
import { RECIPES, QUIZ, FLOW, XLATE } from '../src/synth/bank';
import { features, distance } from '../src/synth/analysis';

const synth = LESSONS.filter((l) => l.track === 'synth');
describe('synth content', () => {
  it('has 12 units of the planned sizes', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((u) => synth.filter((l) => l.level === u).length)).toEqual([6, 8, 9, 7, 8, 8, 7, 9, 12, 10, 10, 9]);
    for (const l of synth) { expect(l.unlocks.length, l.id).toBeGreaterThan(0); for (const c of l.adds ?? []) expect(PD[c], `${l.id} adds ${c}`).toBeTruthy(); }
  });
  it('question banks are well formed', () => {
    for (const bank of [QUIZ, FLOW, XLATE]) for (const rows of Object.values(bank)) for (const r of rows) { expect(r.length, r[0]).toBeGreaterThanOrEqual(4); expect(new Set(r.slice(1)).size, r[0]).toBe(r.length - 1); }
    for (const l of synth) for (const u of l.unlocks) { if (u.ex === 'S13') expect(QUIZ[u.preset.topic], l.id).toBeTruthy(); if (u.ex === 'S9') expect(FLOW[u.preset.set], l.id).toBeTruthy(); if (u.ex === 'S14') expect(XLATE[u.preset.set], l.id).toBeTruthy(); if (u.ex === 'S12') expect(RECIPES[u.preset.recipe], l.id).toBeTruthy(); }
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
        if (!['S5', 'S6', 'S7', 'S10', 'S12'].includes(u.ex)) continue;
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
});
