import { useEffect, useRef, useState } from 'react';
import { useNav } from '../nav';
import { P, midi, pname, pretty, label, key as mkKey, keyLabel, keyScale, diatonic, chordSym, SCALES, scale, QUAL, chordTones, intervalName, ivLong, addInterval } from '../music';
import { mk, Passage, parseNotes } from '../passage';
import { Score } from '../notation';
import { playSeq, click, now, stopAll, ac } from '../audio';
import { micState, startMic, stopMic } from '../input';
import { get } from '../store';
import { Keyboard } from '../ui/Keyboard';
import { TopBar, Circle, Icon, playPassage, useInputState } from '../ui/common';

const ROOTS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const freeP = (text: string, k = 'C'): Passage => ({ ...mk(text, { key: k }), free: true });
const txt = (ps: { l: number; a: number; o: number }[], d = 1) => ps.map((p) => pname(p, true) + '/' + d).join(' ');

function CircleTool() {
  const [k, setK] = useState('C'); const kk = mkKey(k), sc = keyScale(kk);
  const rel = kk.minor ? pname(addInterval(kk.tonic, 2, 3)) : pname(addInterval(kk.tonic, -2, -3)) + 'm';
  return (
    <div className="col"><Circle selected={k} onPick={setK} />
      <h2>{keyLabel(k)}</h2><Score spec={{ passage: freeP(txt([...sc, { ...sc[0], o: sc[0].o + 1 }]), k), showTime: false }} />
      <div className="small"><b>Signature:</b> {kk.acc === 0 ? 'no sharps or flats' : `${Math.abs(kk.acc)} ${kk.acc > 0 ? 'sharp' : 'flat'}${Math.abs(kk.acc) > 1 ? 's' : ''}`} · <b>Relative {kk.minor ? 'major' : 'minor'}:</b> {keyLabel(rel)}</div>
      <table className="simple"><tbody>{[0, 1, 2, 3, 4, 5, 6].map((d) => { const c = diatonic(kk, d); return <tr key={d}><td><b>{c.rn}</b></td><td>{chordSym(c.root, c.q)}</td><td className="muted">{chordTones(c.root, c.q).map((t) => label(t)).join(' ')}</td></tr>; })}</tbody></table>
      <button className="btn" onClick={() => { stopAll(); playSeq([...sc, { ...sc[0], o: sc[0].o + 1 }].map((p, i) => ({ t: i * 0.5, d: 0.5, midis: [midi(p)] })), 60, get().profile.settings.timbre, 0.05, false); }}><Icon name="playtri" size={14} />Hear the scale</button>
    </div>
  );
}
function Finder() {
  const [root, setRoot] = useState('C'), [kind, setKind] = useState('s:major');
  const r = P(root + '4'), isScale = kind.startsWith('s:'), id = kind.slice(2);
  const ps = isScale ? [...scale(r, id), { ...r, o: 5 }] : chordTones(r, id), ms = ps.map(midi);
  return (
    <div className="col">
      <div className="grid2"><label className="field">Root<select value={root} onChange={(e) => setRoot(e.target.value)}>{ROOTS.map((x) => <option key={x} value={x}>{pretty(x)}</option>)}</select></label>
        <label className="field">Scale or chord<select value={kind} onChange={(e) => setKind(e.target.value)}><optgroup label="Scales">{Object.keys(SCALES).map((x) => <option key={x} value={'s:' + x}>{SCALES[x].name}</option>)}</optgroup><optgroup label="Chords">{Object.keys(QUAL).map((x) => <option key={x} value={'c:' + x}>{QUAL[x].name}</option>)}</optgroup></select></label></div>
      <h2>{isScale ? `${label(r)} ${SCALES[id].name.toLowerCase()}` : chordSym(r, id)}</h2>
      <div className="bold">{ps.map((p) => label(p)).join('  ')}</div>
      <Score spec={{ passage: freeP(isScale ? txt(ps) : `[${ps.map((p) => pname(p, true)).join(' ')}]/4`), showTime: false }} />
      <Keyboard lo={60} hi={84} marks={Object.fromEntries(ms.map((m) => [m, 'accent' as const]))} labels short />
      <button className="btn" onClick={() => { stopAll(); playSeq(isScale ? ms.map((m, i) => ({ t: i * 0.5, d: 0.5, midis: [m] })) : [...ms.map((m, i) => ({ t: i * 0.5, d: 0.5, midis: [m] })), { t: ms.length * 0.5, d: 2, midis: ms }], 60, get().profile.settings.timbre, 0.05, false); }}><Icon name="playtri" size={14} />Listen</button>
    </div>
  );
}
function IntervalCalc() {
  const [a, setA] = useState('C4'), [b, setB] = useState('G4');
  const opts: string[] = []; for (let o = 2; o <= 5; o++) for (const n of ROOTS) opts.push(n + o);
  const pa = P(a), pb = P(b), name = intervalName(pa, pb), semis = Math.abs(midi(pb) - midi(pa));
  return (
    <div className="col">
      <div className="grid2"><label className="field">First note<select value={a} onChange={(e) => setA(e.target.value)}>{opts.map((x) => <option key={x} value={x}>{pretty(x)}</option>)}</select></label><label className="field">Second note<select value={b} onChange={(e) => setB(e.target.value)}>{opts.map((x) => <option key={x} value={x}>{pretty(x)}</option>)}</select></label></div>
      <h2>{name.includes('?') || +name.slice(1) > 12 ? `${semis} semitones` : ivLong(name)}</h2><div className="muted">{semis} semitone{semis === 1 ? '' : 's'} · {midi(pb) >= midi(pa) ? 'rising' : 'falling'}</div>
      <Score spec={{ passage: freeP(`${a}/4 ${b}/4`), showTime: false }} />
      <button className="btn" onClick={() => { stopAll(); playSeq([{ t: 0, d: 1, midis: [midi(pa)] }, { t: 1, d: 1, midis: [midi(pb)] }, { t: 2.2, d: 2, midis: [midi(pa), midi(pb)] }], 70, get().profile.settings.timbre, 0.05, false); }}><Icon name="playtri" size={14} />Listen</button>
    </div>
  );
}
function StaffPaper() {
  const [text, setText] = useState('C4 D4 E4 F4 G4/2 E4/2 [C4 E4 G4]/4'), [k, setK] = useState('C'), [time, setTime] = useState('4/4'), [tempo, setTempo] = useState(90);
  let p: Passage | null = null, err = '';
  try { if (!parseNotes(text).length) throw new Error('Type some notes.'); p = mk(text, { key: k, time: time.split('/').map(Number) as [number, number], tempo }); } catch (e: any) { err = e.message; }
  return (
    <div className="col">
      <label className="field">Notes<textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} /></label>
      <div className="small muted">Write notes as letter, optional # or b, and octave: <code>F#4</code>. Add <code>/2</code> for the length in beats (default 1). <code>r/1</code> is a rest. <code>[C4 E4 G4]/2</code> is a chord. <code>~</code> ties to the next note.</div>
      <div className="grid3"><label className="field">Key<select value={k} onChange={(e) => setK(e.target.value)}>{['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab', 'Am', 'Em', 'Dm', 'Gm'].map((x) => <option key={x} value={x}>{keyLabel(x)}</option>)}</select></label>
        <label className="field">Time<select value={time} onChange={(e) => setTime(e.target.value)}>{['4/4', '3/4', '2/4', '6/8'].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field">Tempo<input type="number" min={40} max={200} value={tempo} onChange={(e) => setTempo(+e.target.value || 90)} /></label></div>
      {p ? <Score spec={{ passage: p, showTime: true }} /> : <div className="feedback bad"><div className="txt"><span>{err}</span></div></div>}
      <div className="row"><button className="btn primary grow" disabled={!p} onClick={() => { stopAll(); if (p) playPassage(p); }}><Icon name="playtri" size={14} />Play</button><button className="btn grow" onClick={() => stopAll()}><Icon name="stop" size={14} />Stop</button></div>
    </div>
  );
}
function Metronome() {
  const [bpm, setBpm] = useState(80), [beats, setBeats] = useState(4), [on, setOn] = useState(false), [beat, setBeat] = useState(0);
  const R = useRef({ next: 0, n: 0, bpm, beats }); R.current.bpm = bpm; R.current.beats = beats;
  useEffect(() => {
    if (!on) return; const r = R.current; r.next = now() + 0.1; r.n = 0;
    const id = setInterval(() => { const c = ac(); while (r.next < c.currentTime + 0.15) { click(r.next, r.n % r.beats === 0); const b = r.n % r.beats; setTimeout(() => setBeat(b + 1), Math.max(0, (r.next - c.currentTime) * 1000)); r.next += 60 / r.bpm; r.n++; } }, 40);
    return () => { clearInterval(id); stopAll(); setBeat(0); };
  }, [on]);
  return (
    <div className="col center">
      <div className="count" aria-live="off">{bpm}</div><div className="muted">beats per minute</div>
      <input type="range" min={40} max={208} value={bpm} aria-label="Tempo" onChange={(e) => setBpm(+e.target.value)} />
      <div className="row" style={{ justifyContent: 'center' }}>{[-5, -1, 1, 5].map((d) => <button key={d} className="btn sm" onClick={() => setBpm(Math.max(40, Math.min(208, bpm + d)))}>{d > 0 ? '+' + d : d}</button>)}</div>
      <label className="field" style={{ textAlign: 'left' }}>Beats per bar<select value={beats} onChange={(e) => setBeats(+e.target.value)}>{[2, 3, 4, 6].map((x) => <option key={x}>{x}</option>)}</select></label>
      <div className="dots">{Array.from({ length: beats }, (_, i) => <i key={i} className={beat === i + 1 ? 'on' : ''} style={{ width: 14, height: 14, borderRadius: 7 }} />)}</div>
      <button className="btn primary big" onClick={() => setOn(!on)}>{on ? 'Stop' : 'Start'}</button>
    </div>
  );
}
function Tuner() {
  useInputState();
  useEffect(() => () => { if (get().profile.settings.input !== 'mic') stopMic(); }, []);
  const n = micState.note, cents = Math.round(micState.cents);
  return (
    <div className="col center">
      {!micState.on ? <><p className="muted">{micState.error || 'The tuner listens through your microphone. Nothing is recorded or sent anywhere.'}</p><button className="btn primary big" onClick={() => startMic()}>Turn on the microphone</button></> : <>
        <div className="count">{n != null ? pretty(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][((n % 12) + 12) % 12]) : '–'}<span style={{ fontSize: 24 }}>{n != null ? Math.floor(n / 12) - 1 : ''}</span></div>
        <div className="muted" aria-live="polite">{n == null ? 'Play or sing a note' : Math.abs(cents) <= 5 ? 'In tune' : `${Math.abs(cents)} cents ${cents > 0 ? 'sharp' : 'flat'}`}</div>
        <div style={{ position: 'relative', height: 24, background: 'var(--surface)', borderRadius: 12 }} aria-hidden="true"><div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--line2)' }} />{n != null && <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, left: `calc(${50 + Math.max(-50, Math.min(50, cents))}% - 9px)`, background: Math.abs(cents) <= 5 ? 'var(--ok)' : 'var(--accent)' }} />}</div>
      </>}
    </div>
  );
}
const TABS: [string, string, () => JSX.Element][] = [['circle', 'Circle of fifths', CircleTool], ['finder', 'Scales and chords', Finder], ['interval', 'Intervals', IntervalCalc], ['paper', 'Staff paper', StaffPaper], ['met', 'Metronome', Metronome], ['tuner', 'Tuner', Tuner]];
export function Tools() {
  const nav = useNav(); const [tab, setTab] = useState('circle'); const T = TABS.find((t) => t[0] === tab)![2];
  return (
    <><TopBar title="Tools" onBack={nav.back} /><main className="main col">
      <label className="field">Tool<select value={tab} onChange={(e) => { stopAll(); setTab(e.target.value); }}>{TABS.map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></label>
      <T />
    </main></>
  );
}
