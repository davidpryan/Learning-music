import { ReactNode, useEffect, useState } from 'react';
import { key as mkKey, allKeys, pretty } from '../music';
import { mk, onsets, Passage } from '../passage';
import { Score } from '../notation';
import { playSeq, click, now, stopAll } from '../audio';
import { Keyboard } from './Keyboard';
import { P, midi } from '../music';
import type { Fig } from '../content/types';
import { micState, midiState, onInputState, startMic, stopMic, initMidi } from '../input';
import { get, set, useS, InputMode } from '../store';

const PATHS: Record<string, string> = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z', learn: 'M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z',
  practice: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01', play: 'M7 9h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L15 15H9l-.6.8A3 3 0 0 1 3 14v-1a4 4 0 0 1 4-4zM8 12v2M7 13h2M16 12.5h.01M17.5 14h.01',
  progress: 'M4 20V10M10 20V4M16 20v-7M21 20H3', tools: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z', settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.07-.4.1-.8.1-1.2z',
  back: 'M15 5l-7 7 7 7', check: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6L6 18', playtri: 'M8 5v14l11-7z', replay: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5', lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  mic: 'M12 15a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6 12a6 6 0 0 0 12 0M12 18v3', keys: 'M3 6h18v12H3zM8 6v7M12 6v7M16 6v7', midi: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 13h.01M16 13h.01M10 9h.01M14 9h.01M12 16h.01', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z', skip: 'M5 5l9 7-9 7zM18 5v14', flame: 'M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 .2 1.2 1 2 1.5 2C10 8 11 5 12 3z', star: 'M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z', stop: 'M6 6h12v12H6z',
};
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const fill = name === 'playtri' || name === 'stop' || name === 'star';
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name] ?? ''} /></svg>;
}
export function TopBar({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar"><div className="topbar-in">
      {onBack ? <button className="iconbtn" aria-label="Back" onClick={onBack}><Icon name="back" /></button> : <span style={{ width: 6 }} />}
      <div className="grow"><div className="title">{title}</div>{sub && <div className="sub">{sub}</div>}</div>{right}
    </div></header>
  );
}
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="sheet-bg" onClick={onClose}><div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <div className="row between" style={{ marginBottom: 8 }}><h2 style={{ margin: 0 }}>{title}</h2><button className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="x" /></button></div>
      {children}
    </div></div>
  );
}
export const Stars = ({ n, of = 3 }: { n: number; of?: number }) => <span className="stars" aria-label={`${n} of ${of} stars`}>{Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? '' : 'off'}>★</span>)}</span>;
export const Bar = ({ v, ok }: { v: number; ok?: boolean }) => <div className={'bar' + (ok ? ' ok' : '')} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} /></div>;

/** Input switcher: Keys / Mic / MIDI (+ Choices when the question allows it). */
export function InputSwitch({ choice }: { choice?: boolean }) {
  const s = useS(), cur = s.profile.settings.input;
  const pick = (m: InputMode) => { set((st) => { st.profile.settings.input = m; }); if (m === 'mic') startMic().then(() => { micState.gate = get().profile.micGate; }); else stopMic(); if (m === 'midi') initMidi(); };
  const opts: [InputMode, string, string][] = [['screen', 'Keys', 'keys'], ['mic', 'Mic', 'mic'], ['midi', 'MIDI', 'midi']];
  if (choice) opts.push(['choice', 'Choices', 'list']);
  const eff = cur === 'choice' && !choice ? 'screen' : cur;
  return <div className="seg" role="group" aria-label="Answer with">{opts.map(([m, l, ic]) => <button key={m} aria-pressed={eff === m} onClick={() => pick(m)}><span className="row" style={{ justifyContent: 'center', gap: 5 }}><Icon name={ic} size={16} />{l}</span></button>)}</div>;
}
export function useInputState() { const [, f] = useState(0); useEffect(() => onInputState(() => f((x) => x + 1)), []); }
export function MicBar() {
  useInputState();
  if (!micState.on) return <div className="micbar"><Icon name="mic" size={18} /><span className="grow">{micState.error || 'The microphone is off.'}</span><button className="btn sm" onClick={() => startMic().then(() => { micState.gate = get().profile.micGate; })}>Turn on</button></div>;
  return <div className="micbar" aria-live="off"><Icon name="mic" size={18} /><div className="meter"><i style={{ width: `${Math.min(100, micState.level * 600)}%` }} /></div><b style={{ minWidth: 44, textAlign: 'right' }}>{micState.note != null ? pretty(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][((micState.note % 12) + 12) % 12]) + (Math.floor(micState.note / 12) - 1) : '–'}</b></div>;
}
export function MidiBar() {
  useInputState();
  return <div className="micbar"><Icon name="midi" size={18} /><span className="grow">{midiState.error || (midiState.devices.length ? 'Connected: ' + midiState.devices.join(', ') : midiState.ready ? 'No MIDI device found. Plug one in.' : 'MIDI is not connected yet.')}</span>{!midiState.ready && midiState.supported && <button className="btn sm" onClick={() => initMidi()}>Connect</button>}</div>;
}

// ---------- circle of fifths ----------
const CMAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'], CMIN = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
export const CIRCLE_MAJ = CMAJ, CIRCLE_MIN = CMIN;
export function Circle({ selected, claimed, onPick, minor = true }: { selected?: string; claimed?: string[]; onPick?: (k: string) => void; minor?: boolean }) {
  const pos = (i: number, r: number) => [150 + r * Math.sin((i * Math.PI) / 6), 150 - r * Math.cos((i * Math.PI) / 6)];
  const cell = (k: string, i: number, r: number, rad: number) => {
    const [x, y] = pos(i, r), sel = selected === k, got = claimed?.includes(k);
    const acc = mkKey(k).acc;
    return (
      <g key={k} role={onPick ? 'button' : undefined} tabIndex={onPick ? 0 : undefined} aria-label={`${pretty(k.replace('m', ''))} ${k.endsWith('m') ? 'minor' : 'major'}, ${acc === 0 ? 'no sharps or flats' : Math.abs(acc) + (acc > 0 ? ' sharps' : ' flats')}${got ? ', claimed' : ''}`}
        onClick={() => onPick?.(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick?.(k); } }} style={{ cursor: onPick ? 'pointer' : 'default' }}>
        <circle cx={x} cy={y} r={rad} fill={sel ? 'var(--accent)' : got ? 'var(--ok-tint)' : 'var(--surface)'} stroke={got ? 'var(--ok)' : 'var(--line2)'} strokeWidth={got ? 2 : 1} />
        <text x={x} y={y + 4.5} textAnchor="middle" fontSize={rad > 20 ? 14 : 11} fontWeight="700" fill={sel ? 'var(--on-accent)' : 'var(--ink)'}>{pretty(k)}</text>
      </g>
    );
  };
  return (
    <svg className="circle" viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 340, display: 'block', margin: '0 auto' }} role="group" aria-label="Circle of fifths">
      {CMAJ.map((k, i) => cell(k, i, 108, 22))}{minor && CMIN.map((k, i) => cell(k, i, 62, 16.5))}
      {CMAJ.map((k, i) => { const [x, y] = pos(i, 138); const a = mkKey(k).acc; return <text key={'a' + k} x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="var(--muted)">{a === 0 ? '0' : Math.abs(a) + (a > 0 ? '♯' : '♭')}</text>; })}
    </svg>
  );
}
export { allKeys };

// ---------- lesson figures ----------
export function figPassage(f: Extract<Fig, { staff: string }>): Passage {
  const p = mk(f.staff, { key: f.key ?? 'C', time: f.time ?? [4, 4], clef: f.perc ? 'percussion' : f.clef ?? 'treble', bass: f.bass, tempo: f.tempo ?? 96 });
  if (!f.time && !f.perc && !f.bass && p.staves[0].notes.length <= 9) p.free = true;
  return p;
}
export const playPassage = (p: Passage, tempo = p.tempo) => playSeq(onsets(p).map((o) => ({ t: o.t, d: o.d, midis: p.staves[o.staff].clef === 'percussion' ? [76] : o.midis })), tempo, p.staves[0].clef === 'percussion' ? 'piano' : get().profile.settings.timbre, 0.05, false);
function PlayBtn({ onPlay, label }: { onPlay: () => void; label: string }) { return <button className="btn sm" onClick={() => { stopAll(); onPlay(); }}><Icon name="playtri" size={14} />{label}</button>; }
export function Figure({ fig }: { fig: Fig }) {
  if ('staff' in fig) { const p = figPassage(fig); return <div className="col" style={{ gap: 8 }}><Score spec={{ passage: p, showTime: !!fig.time || !!fig.perc }} />{fig.play && <div><PlayBtn label="Listen" onPlay={() => playPassage(p, p.free ? 84 : p.tempo)} /></div>}</div>; }
  if ('kb' in fig) {
    const ms = fig.kb.split(/\s+/).map((n) => midi(P(n))), lo = 12 * Math.floor((Math.min(...ms) - 1) / 12), hi = Math.max(lo + 12, 12 * Math.ceil((Math.max(...ms) + 1) / 12));
    return <div className="col" style={{ gap: 8 }}><Keyboard lo={lo} hi={hi} marks={Object.fromEntries(ms.map((m) => [m, 'accent' as const]))} labels short />{fig.play && <div><PlayBtn label="Listen" onPlay={() => playSeq(ms.map((m, i) => ({ t: i * 0.6, d: 0.6, midis: [m] })), 60, get().profile.settings.timbre, 0.05, false)} /></div>}<div className="small muted">You can press the keys.</div></div>;
  }
  if ('circle' in fig) return <Circle />;
  if ('sound' in fig) { const p = mk(fig.sound, { tempo: fig.tempo ?? 96 }); return <div className="card row"><PlayBtn label="Play" onPlay={() => playPassage(p)} /><span className="grow bold">{fig.label}</span></div>; }
  return <div className="card row"><PlayBtn label="Play" onPlay={() => { const t = now() + 0.05; for (let i = 0; i < 8; i++) click(t + (i * 60) / fig.click, i % 4 === 0); }} /><span className="grow bold">{fig.label} · {fig.click} bpm</span></div>;
}
