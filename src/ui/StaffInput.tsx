// Write an answer on the staff: drag a note head to a line or space and let go. Each note placed is sent through the
// same channel as a key press, so every exercise that takes keyboard answers (dictation, scales, chords, intervals)
// can be answered in notation with no change to how it is graded.
import { useEffect, useRef, useState } from 'react';
import { Pitch, di, midi, pname, pretty, fromMidi } from '../music';
import { drawStave } from '../notation';
import { emitNote } from '../input';
import { playNote } from '../audio';
import { get } from '../store';
import type { KeyMark } from './Keyboard';

const K = 1.5, H = 138, STEP = 5; // VexFlow draws staff lines 10 px apart; the whole picture is enlarged by K for fingers
type Placed = { p: Pitch; m: number };
const COLOR: Record<string, string> = { ok: 'var(--ok)', bad: 'var(--bad)', accent: 'var(--accent)' };

export function StaffInput({ lo, hi, marks = {}, selected, reveal = [], multi, stepKey, disabled }: { lo: number; hi: number; marks?: Record<number, KeyMark>; selected?: number[]; reveal?: number[]; multi?: boolean; stepKey?: number; disabled?: boolean }) {
  const clef: 'treble' | 'bass' = (lo + hi) / 2 < 58 ? 'bass' : 'treble', topDi = clef === 'treble' ? 38 : 26;
  const box = useRef<HTMLDivElement>(null), bg = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320), [acc, setAcc] = useState(0), [ghost, setGhost] = useState<Pitch | null>(null), [placed, setPlaced] = useState<Placed[]>([]);
  const yOf = (p: Pitch) => 48 + (topDi - di(p)) * STEP;
  useEffect(() => { const el = box.current; if (!el) return; const fit = () => setW(Math.max(200, el.clientWidth / K)); fit(); const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null; ro?.observe(el); return () => ro?.disconnect(); }, []);
  useEffect(() => { if (bg.current) drawStave(bg.current, clef, w, H); }, [w, clef]);
  useEffect(() => { if (multi) setPlaced([]); }, [stepKey, multi]);
  const at = (e: React.PointerEvent): Pitch => {
    const r = box.current!.getBoundingClientRect(), y = (e.clientY - r.top) / K, d = Math.max(topDi - 19, Math.min(topDi + 5, topDi - Math.round((y - 48) / STEP)));
    return { l: ((d % 7) + 7) % 7, o: Math.floor(d / 7), a: acc };
  };
  const drop = (p: Pitch) => {
    const m = midi(p); setGhost(null); setAcc(0);
    setPlaced((ps) => (multi ? (ps.some((x) => x.m === m) ? ps.filter((x) => x.m !== m) : [...ps, { p, m }]) : [...ps, { p, m }]));
    try { playNote(m, undefined, 0.5, get().profile.settings.timbre); } catch { /* no audio yet */ }
    emitNote(m, 'screen');
  };
  // one column per note for a melody (sliding left when full), one stacked column for a chord
  const colW = 25, x0 = 62, room = Math.max(1, Math.floor((w - x0 - 34) / colW)), shown = multi ? placed.filter((x) => !selected || selected.includes(x.m)) : placed.slice(-room);
  const xOf = (i: number) => (multi ? x0 + 40 : x0 + i * colW), ghostX = multi ? x0 + 40 : x0 + Math.min(shown.length, room) * colW;
  const head = (p: Pitch, x: number, color: string, key: string, faint = false) => {
    const y = yOf(p), led: number[] = []; for (let yy = 98; yy <= y; yy += 10) led.push(yy); for (let yy = 38; yy >= y; yy -= 10) led.push(yy);
    return <g key={key} opacity={faint ? 0.45 : 1}>{led.map((yy) => <line key={yy} x1={x - 11} x2={x + 11} y1={yy} y2={yy} stroke="currentColor" strokeWidth={1} />)}
      <ellipse cx={x} cy={y} rx={6.4} ry={4.6} fill={color} transform={`rotate(-18 ${x} ${y})`} />
      {p.a !== 0 && <text x={x - 20} y={y + 5} fontSize={15} fill={color}>{p.a > 0 ? '♯' : '♭'}</text>}</g>;
  };
  const rev = reveal.map((m) => fromMidi(m, reveal.some((x) => [1, 3, 6, 8, 10].includes(x % 12)) && placed.some((x) => x.p.a < 0)));
  return (
    <div className="col" style={{ gap: 6 }}>
      <div ref={box} className="staff-in" style={{ height: H * K, touchAction: 'none' }} role="application" aria-label="Staff. Drag to a line or space and let go to place a note."
        onPointerDown={(e) => { if (disabled) return; e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); setGhost(at(e)); }}
        onPointerMove={(e) => { if (ghost) setGhost(at(e)); }}
        onPointerUp={(e) => { if (ghost && !disabled) drop(at(e)); }}
        onPointerCancel={() => setGhost(null)}>
        <div style={{ transform: `scale(${K})`, transformOrigin: '0 0', width: w, height: H, position: 'relative', pointerEvents: 'none' }}>
          <div ref={bg} />
          <svg width={w} height={H} style={{ position: 'absolute', inset: 0, color: 'var(--ink)' }}>
            {shown.map((n, i) => head(n.p, xOf(i), COLOR[marks[n.m] as string] ?? 'var(--ink)', `${i}-${n.m}`))}
            {rev.map((p, i) => head(p, multi ? x0 + 90 : ghostX + 20 + i * colW, 'var(--ok)', `r${i}`))}
            {ghost && head(ghost, ghostX, 'var(--accent)', 'ghost', true)}
          </svg>
        </div>
        {ghost && <div className="staff-tip">{pretty(pname(ghost, true))}</div>}
      </div>
      <div className="row">
        <div className="seg" role="group" aria-label="Accidental for the next note" style={{ flex: '0 0 auto' }}>{([[-1, '♭'], [0, '♮'], [1, '♯']] as const).map(([a, t]) => <button key={a} aria-pressed={acc === a} aria-label={a < 0 ? 'Flat' : a > 0 ? 'Sharp' : 'Natural'} disabled={disabled} onClick={() => setAcc(a)}>{t}</button>)}</div>
        <span className="small muted grow">{disabled ? (reveal.length ? 'The answer is shown in green.' : '') : multi ? 'Drag to place each note of the chord. Place a note again to remove it.' : 'Drag up or down to the line or space, then let go.'}</span>
      </div>
    </div>
  );
}
