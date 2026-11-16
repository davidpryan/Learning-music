import { describe, it, expect, beforeEach } from 'vitest';
import { pickFresh, forget, windowFor } from '../src/pick';
import { EX, exParams } from '../src/exercises';
import { mulberry } from '../src/music';

describe('question variety', () => {
  beforeEach(() => forget());
  const run = (ex: string, preset: Record<string, any>, n: number, seed = 1) => {
    const r = mulberry(seed), params = exParams(ex, preset);
    return Array.from({ length: n }, () => pickFresh(ex, () => EX[ex].gen(params, mulberry(Math.floor(r() * 1e9)))).item);
  };
  it('white keys: no key comes back within 4 questions', () => {
    for (let seed = 1; seed <= 30; seed++) {
      forget(); const items = run('T2', { black: false }, 60, seed);
      for (let i = 0; i < items.length; i++) for (let j = Math.max(0, i - 4); j < i; j++) if (items[i] === items[j]) throw new Error(`seed ${seed}: ${items[i]} repeated ${i - j} apart`);
      expect(new Set(items.slice(0, 5)).size).toBe(5);   // a 5-question check never shows a key twice
      expect(new Set(items).size).toBe(7);                // and every key still turns up
    }
  });
  it('plain random draws did repeat (the bug this fixes)', () => {
    let repeats = 0;
    for (let seed = 1; seed <= 200; seed++) { const r = mulberry(seed), p = exParams('T2', { black: false }); const five = Array.from({ length: 5 }, () => EX.T2.gen(p, mulberry(Math.floor(r() * 1e9))).item); if (new Set(five).size < 5) repeats++; }
    expect(repeats).toBeGreaterThan(100);
  });
  it('note reading on the staff: no immediate or near repeats', () => {
    const items = run('T1', { clefs: ['treble'], range: 'staff' }, 80);
    for (let i = 5; i < items.length; i++) expect(items.slice(i - 5, i)).not.toContain(items[i]);
  });
  it('two-way questions stay unpredictable rather than alternating', () => {
    const items = run('E5', { quals: ['maj', 'min'] }, 200);
    let same = 0; for (let i = 1; i < items.length; i++) if (items[i] === items[i - 1]) same++;
    expect(same).toBeGreaterThan(50); expect(same).toBeLessThan(150);
    expect(windowFor(2)).toBe(0); expect(windowFor(3)).toBe(1); expect(windowFor(7)).toBe(4); expect(windowFor(40)).toBe(6);
  });
  it('three-way questions never repeat back to back but vary in order', () => {
    const items = run('E3', { keys: ['C'], degs: [0, 2, 4] }, 120);
    for (let i = 1; i < items.length; i++) expect(items[i]).not.toBe(items[i - 1]);
    expect(new Set(items.map((x, i) => x + '>' + items[i + 1])).size).toBeGreaterThanOrEqual(6);
  });
  it('prefers items the learner has been missing, when they are allowed', () => {
    const p = exParams('T2', { black: false }); let weak = 0; const r = mulberry(5);
    for (let i = 0; i < 300; i++) if (pickFresh('w', () => EX.T2.gen(p, mulberry(Math.floor(r() * 1e9))), (item) => item === 'key:5').item === 'key:5') weak++;
    expect(weak).toBeGreaterThan(300 / 7 + 5); expect(weak).toBeLessThanOrEqual(300 / 5 + 1);
  });
});
