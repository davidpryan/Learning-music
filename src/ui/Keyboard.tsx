// The on-screen keyboard: multi-touch, computer-key mapping, optional latch and labels.
import { useEffect, useMemo, useRef, useState } from 'react';
import { isBlack, label, fromMidi, pc } from '../music';
import { playNote } from '../audio';
import { emitNote } from '../input';
import { get } from '../store';

const WHITE_KEYS = 'asdfghjkl;', BLACK_KEYS: Record<string, number> = { w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15 };
const WHITE_OFF = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
export type KeyMark = 'accent' | 'ok' | 'bad';

export function Keyboard({ lo = 60, hi = 84, marks, selected, labels, silent, short, focus, display, onPlay }: {
  lo?: number; hi?: number; marks?: Record<number, KeyMark>; selected?: number[]; labels?: boolean; silent?: boolean; short?: boolean; focus?: number; display?: boolean; onPlay?: (m: number) => void;
}) {
  const [down, setDown] = useState<number[]>([]);
  const [oct, setOct] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const whites = useMemo(() => { const w: number[] = []; for (let m = lo; m <= hi; m++) if (!isBlack(m)) w.push(m); return w; }, [lo, hi]);
  const showLabels = labels ?? (get().profile.settings.keyLabels === 'on');
  const press = (m: number) => {
    if (display) return;
    if (!silent) playNote(m, undefined, 0.6, get().profile.settings.timbre);
    setDown((d) => [...d, m]); setTimeout(() => setDown((d) => d.filter((x) => x !== m)), 160);
    emitNote(m, 'screen'); onPlay?.(m);
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    if (display) return;
    const base = 12 * Math.ceil(lo / 12) + 12 * oct;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t?.tagName ?? '')) return;
      const k = e.key.toLowerCase();
      if (k === 'z') { setOct((o) => Math.max(-2, o - 1)); return; } if (k === 'x') { setOct((o) => Math.min(2, o + 1)); return; }
      const wi = WHITE_KEYS.indexOf(k); const m = wi >= 0 ? base + WHITE_OFF[wi] : k in BLACK_KEYS ? base + BLACK_KEYS[k] : -1;
      if (m >= 0) { e.preventDefault(); pressRef.current(m); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [lo, oct, display]);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const target = focus ?? (marks && Object.keys(marks).length ? +Object.keys(marks)[0] : (lo + hi) / 2);
    const idx = whites.findIndex((w) => w >= target), kw = el.scrollWidth / whites.length;
    el.scrollLeft = Math.max(0, idx * kw - el.clientWidth / 2);
  }, [lo, hi, focus, whites.length]);
  const cls = (m: number, base: string) => [base, down.includes(m) ? 'down' : '', selected?.includes(m) ? 'sel' : '', marks?.[m] ? 'mark-' + marks[m] : ''].join(' ');
  const n = whites.length;
  return (
    <div className="kb-wrap" ref={wrap}>
      <div className={'kb' + (short ? ' short' : '')} style={{ minWidth: n <= 15 ? n * 22 : n * 32 }} role="group" aria-label="Piano keyboard">
        {whites.map((m) => (
          <button key={m} type="button" className={cls(m, 'wk')} aria-label={label(fromMidi(m), true)} tabIndex={display ? -1 : 0}
            onPointerDown={(e) => { e.preventDefault(); press(m); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(m); } }}>
            {showLabels || pc(m) === 0 ? label(fromMidi(m), pc(m) === 0) : ''}
          </button>
        ))}
        {whites.map((m, i) => (isBlack(m + 1) && m + 1 <= hi ? (
          <button key={'b' + m} type="button" className={cls(m + 1, 'bk')} aria-label={label(fromMidi(m + 1), true)} tabIndex={display ? -1 : 0}
            style={{ left: `${((i + 1 - 0.31) * 100) / n}%`, width: `${62 / n}%` }} onPointerDown={(e) => { e.preventDefault(); press(m + 1); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(m + 1); } }}>{showLabels ? label(fromMidi(m + 1)) : ''}</button>
        ) : null))}
      </div>
    </div>
  );
}
