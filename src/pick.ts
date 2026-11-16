// Choosing the next question so the same item does not keep coming back.
// Plain random draws from a small pool repeat a lot (7 white keys, 5 questions: a repeat is more likely than not).
// Instead, draw several candidates and skip any whose item was asked recently. The "recently" window scales with
// how many different items the exercise can produce, so tiny pools (major or minor?) stay genuinely random.

export interface HasItem { item: string }
const memory = new Map<string, { recent: string[]; all: Set<string> }>();
const KEEP = 8;

/** How many of the most recent questions an item must stay out of, given the number of distinct items available. */
export const windowFor = (distinct: number) => (distinct <= 2 ? 0 : distinct === 3 ? 1 : Math.min(6, Math.floor(distinct * 0.6)));

/**
 * @param key      history bucket, usually the exercise id plus its settings
 * @param make     makes candidate number k
 * @param isWeak   items the learner has been missing; preferred when allowed
 */
export function pickFresh<T extends HasItem>(key: string, make: (k: number) => T, isWeak: (item: string) => boolean = () => false): T {
  const m = memory.get(key) ?? { recent: [], all: new Set<string>() };
  const age = (item: string) => { const i = m.recent.lastIndexOf(item); return i < 0 ? Infinity : m.recent.length - 1 - i; }; // 0 = the last question
  const cands: T[] = []; let ok: T[] = [], win = 0;
  // Draw 10 candidates; if every one was asked too recently, keep drawing (up to 60) until one was not.
  for (let k = 0; k < 60 && (k < 10 || !ok.length); k++) {
    const c = make(k); cands.push(c); m.all.add(c.item);
    win = windowFor(m.all.size);
    ok = cands.filter((x) => age(x.item) >= win);
  }
  const chosen = ok.find((c) => isWeak(c.item)) ?? ok[0] ?? [...cands].sort((a, b) => age(b.item) - age(a.item))[0];
  m.recent.push(chosen.item); if (m.recent.length > KEEP) m.recent.shift();
  memory.set(key, m);
  return chosen;
}
export const forget = (key?: string) => { if (key) memory.delete(key); else memory.clear(); };
