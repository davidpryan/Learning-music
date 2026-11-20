// Synth controls and pictures, drawn to the Toybox style guide's "Learning extensions":
// a flat disc with one white dot, a scale of sand dots, a paper-ink target marker, and paper-ink traces over sand.
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Patch, PD, norm, denorm, fmt, isChoice, isStepped, mkPatch } from './dsp';
import { spectrum, waveform, loudness } from './analysis';
import { seqOf, gradeMatch } from './exercises';
import * as live from './live';
import type { Answer, Question, VizSpec } from '../exercises';
import { Icon } from '../ui/common';

const DOTS = Array.from({ length: 11 }, (_, i) => -135 + i * 27);
export function Knob({ id, value, onChange, target, focus, blind, label }: { id: string; value: number; onChange: (v: number) => void; target?: number; focus?: boolean; blind?: boolean; label?: string }) {
  const d = PD[id], n = norm(id, value), size = 96, R = size / 2 + 14, c = R + 6, drag = useRef<{ y: number; n: number } | null>(null);
  const at = (deg: number, r: number) => ({ left: c + r * Math.sin((deg * Math.PI) / 180), top: c - r * Math.cos((deg * Math.PI) / 180) });
  const step = isStepped(id) ? 1 / (d.max - d.min) : 0.02;
  const set = (x: number) => { const v = denorm(id, x); if (v !== value) onChange(v); };
  return (
    <div className={'tb-knob' + (focus ? ' is-focus' : '')}>
      <div className="tb-knob-label">{label ?? d.label}</div>
      <div className="tb-knob-scale" style={{ width: 2 * c, height: 2 * c - 8 }}>
        {DOTS.map((deg, i) => <i key={i} className={i === 0 || i === 10 ? 'end' : ''} style={at(deg, R)} />)}
        {target != null && <i className="aim" style={at(-135 + norm(id, target) * 270, R)} />}
        <div role="slider" tabIndex={0} aria-label={label ?? `${d.group} ${d.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(n * 100)} aria-valuetext={blind ? undefined : fmt(id, value)}
          className="tb-knob-disc" style={{ width: size, height: size, left: c - size / 2, top: c - size / 2 }}
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { y: e.clientY, n }; }}
          onPointerMove={(e) => { if (drag.current) set(drag.current.n + (drag.current.y - e.clientY) / 170); }}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(n + step); } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(n - step); } }}>
          <span style={{ left: size / 2 + (size / 2 - 17) * Math.sin(((-135 + n * 270) * Math.PI) / 180), top: size / 2 - (size / 2 - 17) * Math.cos(((-135 + n * 270) * Math.PI) / 180) }} />
        </div>
      </div>
      <div className="tb-knob-value">{blind && !isStepped(id) ? ' ' : fmt(id, value)}</div>
    </div>
  );
}
export function Pick({ id, value, onChange, target, focus, label }: { id: string; value: number; onChange: (v: number) => void; target?: number; focus?: boolean; label?: string }) {
  const d = PD[id];
  return (
    <div className={'tb-pick' + (focus ? ' is-focus' : '')} role="group" aria-label={label ?? `${d.group} ${d.label}`}>
      <div className="tb-knob-label">{label ?? d.label}</div>
      <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>{d.opts!.map((o, i) => <button key={o} className={'tb-chip' + (target === i ? ' aim' : '')} aria-pressed={Math.round(value) === i} onClick={() => onChange(i)}>{o}</button>)}</div>
    </div>
  );
}
export function Panel({ ctls, patch, onChange, marks, focus, blind }: { ctls: string[]; patch: Patch; onChange: (id: string, v: number) => void; marks?: Patch; focus?: string | null; blind?: boolean }) {
  const groups: string[] = []; for (const id of ctls) if (!groups.includes(PD[id].group)) groups.push(PD[id].group);
  return (
    <div className="col" style={{ gap: 14 }}>
      {groups.map((g) => (
        <section key={g} className="tb-group">
          {groups.length > 1 && <h3>{g}</h3>}
          <div className="tb-controls">
            {ctls.filter((id) => PD[id].group === g).map((id) => isChoice(id)
              ? <Pick key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} target={marks?.[id]} focus={focus === id} />
              : <Knob key={id} id={id} value={patch[id]} onChange={(v) => onChange(id, v)} target={marks?.[id]} focus={focus === id} blind={blind} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

const W = 320, H = 110;
function series(kind: VizSpec['kind'], p: Patch, seq: string): number[] {
  const s = seqOf(seq);
  return kind === 'wave' ? waveform(p, s.n).map((v) => 0.5 + v * 0.42) : kind === 'env' ? loudness(p, s.n, s.loop, 110).map((v) => v * 0.9) : spectrum(p, s.n).map((v) => v * 0.94);
}
const pts = (ys: number[]) => ys.map((y, i) => `${((i / (ys.length - 1)) * W).toFixed(1)},${(H - y * H).toFixed(1)}`).join(' ');
/** A curve on paper: sand grid, sand area for the target, a paper-ink line for the learner's own sound. */
export function Trace({ kind, patch, target, seq = 'hold', label, caption }: { kind: VizSpec['kind']; patch: Patch; target?: Patch; seq?: string; label?: string; caption?: string }) {
  const dp = useDeferredValue(patch), mine = useMemo(() => series(kind, mkPatch(dp), seq), [kind, dp, seq]), aim = useMemo(() => (target ? series(kind, mkPatch(target), seq) : null), [kind, target, seq]);
  const base = kind === 'wave' ? H / 2 : H, area = (ys: number[]) => `0,${base} ${pts(ys)} ${W},${base}`;
  return (
    <figure className="tb-trace">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label ?? (kind === 'wave' ? 'Waveform' : kind === 'env' ? 'Loudness over time' : 'Spectrum, low frequencies on the left')} preserveAspectRatio="none">
        <path className="grid" d={`M0 ${H / 2}H${W}M${W / 4} 0V${H}M${W / 2} 0V${H}M${(3 * W) / 4} 0V${H}`} />
        {aim ? <polygon className="aim" points={area(aim)} /> : kind !== 'wave' && <polygon className="fill" points={area(mine)} />}
        <polyline className="line" points={pts(mine)} />
      </svg>
      <figcaption>{caption ? <span>{caption}</span> : kind === 'spectrum' ? <><span>Low</span><span>{aim ? 'Filled: target. Line: yours.' : 'Frequency'}</span><span>High</span></> : kind === 'env' ? <><span>Note starts</span><span>{aim ? 'Filled: target. Line: yours.' : 'Loudness over time'}</span><span>Later</span></> : <span>{aim ? 'Filled: target. Line: yours.' : 'Two cycles of the wave'}</span>}</figcaption>
    </figure>
  );
}

/** Lesson figure: one or two sounds to play, with an optional picture. */
export function PatchFig({ fig }: { fig: { patch: Patch; label: string; view?: VizSpec['kind']; seq?: string; vs?: Patch; vsLabel?: string } }) {
  const s = seqOf(fig.seq), a = mkPatch(fig.patch), b = fig.vs ? mkPatch({ ...fig.patch, ...fig.vs }) : null;
  return (
    <div className="card col" style={{ gap: 10 }}>
      {fig.view && <Trace kind={fig.view} patch={b ?? a} target={b ? a : undefined} seq={fig.seq} caption={b ? `Filled: ${fig.label.toLowerCase()}. Line: ${(fig.vsLabel ?? 'the other').toLowerCase()}.` : undefined} />}
      <div className="row wrap">
        <button className="btn sm" onClick={() => live.play(a, s.n)}><Icon name="playtri" size={14} />{b ? fig.label : 'Play'}</button>
        {b ? <button className="btn sm" onClick={() => live.play(b, s.n)}><Icon name="playtri" size={14} />{fig.vsLabel ?? 'Compare'}</button> : <span className="grow bold">{fig.label}</span>}
      </div>
    </div>
  );
}
/** Lesson figure: a few live controls to turn while the sound loops. */
export function PanelFig({ fig }: { fig: { panel: string[]; patch: Patch; label?: string; view?: VizSpec['kind']; seq?: string } }) {
  const [p, setP] = useState(() => mkPatch(fig.patch)), [on, setOn] = useState(false), s = seqOf(fig.seq);
  useEffect(() => () => live.stop(), []);
  const toggle = () => { if (on) live.stop(); else live.play(p, s.n, s.loop); setOn(!on); };
  return (
    <div className="card col" style={{ gap: 10 }}>
      {fig.view && <Trace kind={fig.view} patch={p} seq={fig.seq} />}
      <button className={'btn' + (on ? '' : ' primary')} aria-pressed={on} onClick={toggle}><Icon name={on ? 'stop' : 'playtri'} size={14} />{on ? 'Stop the sound' : 'Start the sound, then turn'}</button>
      <Panel ctls={fig.panel} patch={p} onChange={(id, v) => { const np = { ...p, [id]: v }; setP(np); if (on) live.setPatch(np); }} />
      {fig.label && <div className="small muted">{fig.label}</div>}
    </div>
  );
}
export function VizView({ v }: { v: VizSpec }) { return <Trace kind={v.kind} patch={v.patch} seq={v.seq} />; }

/** The match exercise: hear the target, hear yours, turn the controls, check. Up to two "not yet" hints before the answer is shown. */
export function MatchArea({ q, a, done, ok, hint, onHint, onFinish }: { q: Question; a: Extract<Answer, { kind: 'match' }>; done: boolean; ok?: boolean; hint: boolean; onHint: () => void; onFinish: (ok: boolean) => void }) {
  const [p, setP] = useState<Patch>(() => ({ ...a.start })), [playing, setPlaying] = useState<'mine' | 'target' | null>(null), [tries, setTries] = useState(0), [msg, setMsg] = useState('');
  const s = seqOf(a.seq), g = useMemo(() => (hint || tries > 0 || done ? gradeMatch(a, p) : null), [hint, tries, done, p, a]);
  useEffect(() => () => live.stop(), []);
  useEffect(() => { if (done) { live.stop(); setPlaying(null); } }, [done]);
  const hear = (w: 'mine' | 'target') => { if (playing === w) { live.stop(); setPlaying(null); return; } live.play(w === 'mine' ? p : a.target, s.n, s.loop); setPlaying(w); };
  const change = (id: string, v: number) => { if (done) return; const np = { ...p, [id]: v }; setP(np); setMsg(''); if (playing === 'mine') live.setPatch(np); };
  const check = () => {
    const r = gradeMatch(a, p);
    if (r.ok) { onFinish(true); return; }
    if (tries >= 2) { onFinish(false); return; }
    onHint(); setTries(tries + 1);
    setMsg(a.checks ? `Not yet. ${r.say}.` : tries === 0 ? `Not yet. ${r.say}.` : `Not yet. ${r.say}: turn it ${isChoice(r.worst!) ? 'to another setting' : r.up ? 'up' : 'down'}.`);
  };
  const noun = a.example ? 'an example' : 'the target';
  return (
    <div className="col" data-q={q.item}>
      {a.view !== 'none' && <Trace kind={a.view} patch={p} target={a.showTarget || (done && !a.checks) ? a.target : undefined} seq={a.seq} />}
      <div className="row" role="group" aria-label="Listen">
        <button className="tb-chip grow" aria-pressed={playing === 'target'} onClick={() => hear('target')}>Hear {noun}</button>
        <button className="tb-chip grow" aria-pressed={playing === 'mine'} onClick={() => hear('mine')}>Hear mine</button>
      </div>
      <Panel ctls={a.ctls} patch={p} onChange={change} marks={done && ok === false && !a.checks ? a.target : undefined} focus={!done && g && !g.ok ? g.worst : null} blind={!a.checks && !done} />
      {msg && !done && <div className="feedback bad" role="status" aria-live="polite"><div className="txt"><span>{msg}</span></div></div>}
      {!done && <button className="btn primary big" onClick={check}>{tries >= 2 ? 'Check (last try)' : 'Check my match'}</button>}
    </div>
  );
}

/** A one-octave-and-a-bit strip of keys that hold for as long as they are pressed, for the free-play synth. */
export function HoldKeys({ lo = 48, n = 13 }: { lo?: number; n?: number }) {
  const [down, setDown] = useState<number[]>([]);
  const on = (m: number) => { live.noteOn(m); setDown((d) => [...d, m]); }, off = (m: number) => { live.noteOff(m); setDown((d) => d.filter((x) => x !== m)); };
  const black = (m: number) => [1, 3, 6, 8, 10].includes(m % 12), whites = Array.from({ length: n }, (_, i) => lo + i).filter((m) => !black(m));
  const key = (m: number, cls: string, style?: React.CSSProperties) => <button key={m} className={cls + (down.includes(m) ? ' down' : '')} style={style} aria-label={`Note ${m}`}
    onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); on(m); }} onPointerUp={() => off(m)} onPointerCancel={() => off(m)}
    onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) on(m); }} onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') off(m); }} />;
  return (
    <div className="kb" style={{ touchAction: 'none' }}>
      {whites.map((m) => key(m, 'wk'))}
      {Array.from({ length: n }, (_, i) => lo + i).filter(black).map((m) => { const wi = whites.filter((w) => w < m).length; return key(m, 'bk', { left: `calc(${(wi / whites.length) * 100}% - ${(0.3 / whites.length) * 100}%)`, width: `${(0.6 / whites.length) * 100}%` }); })}
    </div>
  );
}
