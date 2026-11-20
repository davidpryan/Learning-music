// Plans a lesson's check so it covers what the lesson taught without asking the same thing twice.
// Each exercise the lesson unlocks has a set of distinct questions (each waveform to name, each control that might have
// moved, each quiz fact). The plan deals those out in turn, every unlock first, and only repeats once nothing new is left.
import { EX, exParams } from './exercises';
import { mulberry } from './music';
import type { Lesson } from './content/types';

export interface PlannedItem { ex: string; preset: Record<string, any>; skillId?: string; seed: number }
/** Exercises that take minutes (a match, a recipe, a pattern): asked once each. */
const SLOW = ['S5', 'S6', 'S7', 'S10', 'S12', 'S15'];
/** Fact questions drawn from a bank: two per check is plenty beside the listening. */
const BANK = ['S9', 'S13', 'S14'];
/** How many distinct questions of one listening exercise a check will ask before moving on. */
const CAP: Record<string, number> = { S1: 4, S2: 6, S3: 4, S4: 2, S8: 4, S11: 3 };
export const CHECK_MIN = 5, CHECK_MAX = 8, CHECK_FLOOR = 4;
/** Misses allowed: one, or two in the longest checks (80%). */
export const passMark = (n: number) => n - (n >= 3 ? Math.max(1, Math.round(n * 0.2)) : 0);

/** The distinct questions an exercise can ask with these settings, each with a seed that produces it. */
export function variants(ex: string, preset: Record<string, any>, rnd: () => number, tries = 60): { item: string; seed: number }[] {
  const seen = new Map<string, number>(), params = exParams(ex, preset);
  for (let k = 0; k < tries; k++) { const seed = Math.floor(rnd() * 1e9), q = EX[ex].gen(params, mulberry(seed)); if (!seen.has(q.item)) seen.set(q.item, seed); }
  return [...seen].map(([item, seed]) => ({ item, seed }));
}
export function planCheck(l: Lesson, skillIds: (string | undefined)[], rnd: () => number = Math.random): PlannedItem[] {
  const srcs = l.unlocks.map((u, i) => {
    const slow = SLOW.includes(u.ex), vars = slow ? [{ item: 'x', seed: Math.floor(rnd() * 1e9) }] : variants(u.ex, u.preset, rnd);
    return { u, skillId: skillIds[i], vars, used: 0, slow, bank: BANK.includes(u.ex), quota: slow ? 1 : Math.min(vars.length, BANK.includes(u.ex) ? 2 : CAP[u.ex] ?? 3) };
  });
  const out: (PlannedItem & { slow: boolean })[] = [];
  const take = (s: (typeof srcs)[number]) => { const v = s.vars[s.used++]; out.push({ ex: s.u.ex, preset: s.u.preset, skillId: s.skillId, seed: v.seed, slow: s.slow }); };
  // 1. every unlock in turn, up to its share, so each concept the lesson taught is asked
  for (let more = true; more && out.length < CHECK_MAX; ) { more = false; for (const s of srcs) if (s.used < s.quota && out.length < CHECK_MAX) { take(s); more = true; } }
  // 2. short of five: more unseen questions, listening first, then facts
  for (const pick of [(s: (typeof srcs)[number]) => !s.slow && !s.bank, (s: (typeof srcs)[number]) => s.bank]) for (let more = true; more && out.length < CHECK_MIN; ) { more = false; for (const s of srcs) if (pick(s) && s.used < s.vars.length && out.length < CHECK_MIN) { take(s); more = true; } }
  // 3. then facts from the unit's question bank that this lesson has already covered
  if (out.length < CHECK_MIN && l.fill) { const asked = new Set(srcs.filter((s) => s.u.ex === l.fill!.ex).flatMap((s) => s.vars.slice(0, s.used).map((v) => v.item))); for (const v of variants(l.fill.ex, l.fill.preset, rnd)) if (out.length < CHECK_MIN && !asked.has(v.item) && !v.item.startsWith('!')) out.push({ ex: l.fill.ex, preset: l.fill.preset, seed: v.seed, slow: false }); }
  // 4. nothing new left: stop at four rather than repeat. Below four, a quick listening question again with fresh sounds.
  const quick = srcs.filter((s) => !s.slow && !s.bank);
  for (let k = 0; out.length < CHECK_FLOOR && quick.length && k < 10; k++) { const s = quick[k % quick.length]; out.push({ ex: s.u.ex, preset: s.u.preset, skillId: s.skillId, seed: Math.floor(rnd() * 1e9), slow: false }); }
  // quick questions first, the long ones to finish
  return [...out.filter((x) => !x.slow), ...out.filter((x) => x.slow)].map(({ slow: _s, ...x }) => x);
}
