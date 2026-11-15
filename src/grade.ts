// Graders: pure functions, shared by drills, lessons and games.
import { CFG } from './config';
import { pc } from './music';

export const tolMs = (beatMs: number) => Math.min(CFG.timingMaxMs, Math.max(CFG.timingMinMs, CFG.timingFrac * beatMs));

/** Does a played set of notes match the expected step? `expected[0]` is the bass when `bass` is checked. */
export function matchStep(expected: number[], got: number[], octaveFree: boolean, bass = false, gotBass?: number): boolean {
  if (!octaveFree) return expected.length === got.length && [...expected].sort().join() === [...got].sort().join();
  const e = [...new Set(expected.map(pc))].sort().join(), g = [...new Set(got.map(pc))].sort().join();
  if (e !== g) return false;
  if (bass && got.length) return pc(gotBass ?? Math.min(...got)) === pc(expected[0]);
  return true;
}

export type Mark = 'ok' | 'early' | 'late' | 'wrong' | 'miss';
export interface RhythmResult { marks: Mark[]; pct: number; extras: number; deltas: number[] }
/** Match taps to expected onsets (both in ms from the start). */
export function gradeRhythm(expected: number[], taps: number[], tol: number): RhythmResult {
  const used = new Set<number>(), marks: Mark[] = [], deltas: number[] = [];
  const win = Math.max(tol * 2.5, 180);
  for (const e of expected) {
    let best = -1, bd = Infinity;
    taps.forEach((t, i) => { const d = Math.abs(t - e); if (!used.has(i) && d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd <= win) { used.add(best); const d = taps[best] - e; deltas.push(d); marks.push(bd <= tol ? 'ok' : d < 0 ? 'early' : 'late'); }
    else { marks.push('miss'); deltas.push(NaN); }
  }
  const ok = marks.filter((m) => m === 'ok').length;
  return { marks, pct: expected.length ? ok / expected.length : 0, extras: taps.length - used.size, deltas };
}

export interface Exp { t: number; midi: number; id: string }
export interface Played { t: number; midi: number }
export interface PerformResult { marks: Record<string, Mark>; pitchPct: number; rhythmPct: number; extras: number; counts: Record<Mark, number> }
/** Compare a performance to the expected notes. Pitch and rhythm are scored separately. */
export function gradePerform(expected: Exp[], played: Played[], tol: number, beatMs: number, octaveFree = false): PerformResult {
  const used = new Set<number>(), marks: Record<string, Mark> = {};
  const same = (a: number, b: number) => (octaveFree ? pc(a) === pc(b) : a === b);
  const win = Math.max(tol * 2.5, beatMs * 0.45);
  let right = 0, onTime = 0;
  for (const e of expected) {
    let best = -1, bd = Infinity;
    played.forEach((p, i) => { const d = Math.abs(p.t - e.t); if (!used.has(i) && same(p.midi, e.midi) && d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd <= win) {
      used.add(best); right++;
      if (bd <= tol) { onTime++; marks[e.id] = 'ok'; } else marks[e.id] = played[best].t < e.t ? 'early' : 'late';
      continue;
    }
    best = -1; bd = Infinity;
    played.forEach((p, i) => { const d = Math.abs(p.t - e.t); if (!used.has(i) && d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd <= tol) { used.add(best); onTime++; marks[e.id] = 'wrong'; } else marks[e.id] = 'miss';
  }
  const extras = played.length - used.size, n = expected.length || 1;
  const counts = { ok: 0, early: 0, late: 0, wrong: 0, miss: 0 } as Record<Mark, number>;
  Object.values(marks).forEach((m) => counts[m]++);
  return { marks, pitchPct: Math.max(0, right - extras) / n, rhythmPct: onTime / n, extras, counts };
}
export const MARK_COLOR: Record<Mark, string> = { ok: '#15803d', early: '#b45309', late: '#b45309', wrong: '#b91c1c', miss: '#9ca3af' };
