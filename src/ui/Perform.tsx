// Reading and rhythm at tempo: scan, count-in, play with the metronome, then a marked-up result.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Answer, Question } from '../exercises';
import { Score } from '../notation';
import { barLen, onsets, totalBeats } from '../passage';
import { ac, click, playNote, stopAll } from '../audio';
import { onNote, onTap, emitTap } from '../input';
import { gradePerform, gradeRhythm, tolMs, MARK_COLOR, Mark } from '../grade';
import { CFG } from '../config';
import { tempoFor, reportTempo } from '../sched';
import { useS, InputMode } from '../store';
import { Keyboard } from './Keyboard';
import { MicBar, MidiBar, Icon, playPassage } from './common';

export interface PerfExtra { pp: number; rp: number; perfect?: number; good?: number; miss?: number }
type PA = Extract<Answer, { kind: 'rhythm' | 'perform' }>;
const RANK: Mark[] = ['ok', 'early', 'late', 'wrong', 'miss'];

export function Performer({ a, q, mode, onFinish, scan = CFG.scanSeconds, tempoOverride }: { a: PA; q: Question; mode: InputMode; onFinish: (ok: boolean, x: PerfExtra) => void; scan?: number; tempoOverride?: number }) {
  const s = useS(), st = s.profile.settings;
  const passage = a.passage, expectP = a.kind === 'perform' ? a.expect ?? passage : passage;
  const unit = passage.time[1] === 8 ? 1.5 : 1, bar = barLen(passage.time), clicksPerBar = Math.max(1, Math.round(bar / unit));
  const tKey = a.kind === 'perform' ? a.tempoKey : 'rhythm';
  const startTempo = useMemo(() => tempoOverride || a.tempo || (tKey ? tempoFor(tKey, passage.tempo) : passage.tempo), []);
  const [tempo, setTempo] = useState(startTempo);
  const qMs = 60000 / tempo / unit, total = totalBeats(passage.staves[0].notes);
  const listenFirst = a.kind === 'rhythm' && !a.visual;
  const [phase, setPhase] = useState<'scan' | 'listen' | 'countin' | 'play' | 'result'>('scan');
  const [left, setLeft] = useState(listenFirst ? 0 : scan);
  const [count, setCount] = useState(0), [cursor, setCursor] = useState<number | null>(null), [hit, setHit] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; pp: number; rp: number; colors: Record<string, string>; text: string }>(null);
  const R = useRef({ startPerf: 0, events: [] as { t: number; midi: number }[], taps: [] as number[], timers: [] as any[], live: false, lastTap: -1e9, tick: null as any });
  const lat = (src: string) => s.profile.latency[src] ?? 0;
  const modeRef = useRef(mode); modeRef.current = mode;

  const clear = () => { R.current.timers.forEach(clearTimeout); R.current.timers = []; if (R.current.tick) clearInterval(R.current.tick); R.current.live = false; };
  useEffect(() => () => { clear(); stopAll(); }, []);
  useEffect(() => {
    if (phase !== 'scan' || listenFirst || left <= 0) return;
    const id = setTimeout(() => { if (left <= 1) begin(); else setLeft(left - 1); }, 1000);
    return () => clearTimeout(id);
  }, [phase, left, tempo]);
  useEffect(() => {
    const u1 = onNote((e) => {
      const r = R.current; if (!r.live || a.kind !== 'perform') return;
      if ((e.source === 'mic' && modeRef.current !== 'mic') || (e.source === 'screen' && modeRef.current !== 'screen')) return;
      r.events.push({ t: e.t - r.startPerf - lat(e.source), midi: e.midi });
    });
    const u2 = onTap((e) => {
      const r = R.current; if (!r.live || a.kind !== 'rhythm') return;
      if (e.source === 'mic' && modeRef.current !== 'mic') return;
      const t = e.t - r.startPerf - lat(e.source); if (t - r.lastTap < 70) return;
      r.lastTap = t; r.taps.push(t); setHit(true); setTimeout(() => setHit(false), 90);
    });
    const kd = (e: KeyboardEvent) => { if (a.kind !== 'rhythm' || !R.current.live || e.repeat) return; if (e.key === ' ' || e.key.length === 1) { e.preventDefault(); emitTap('screen'); } };
    window.addEventListener('keydown', kd);
    return () => { u1(); u2(); window.removeEventListener('keydown', kd); };
  }, []);

  function begin() {
    const c = ac(); stopAll(); clear();
    const go = (listen: boolean) => {
      const r = R.current, t0 = c.currentTime + 0.25, clickSec = (qMs * unit) / 1000, nClicks = Math.ceil(total / unit - 1e-6);
      for (let k = 0; k < clicksPerBar + nClicks; k++) click(t0 + k * clickSec, k % clicksPerBar === 0);
      const startA = t0 + clicksPerBar * clickSec, lead = (startA - c.currentTime) * 1000;
      if (listen) {
        onsets(passage).forEach((o) => playNote(79, startA + (o.t * qMs) / 1000, 0.14, 'sine', 0.8, true));
        setPhase('listen'); r.timers.push(setTimeout(() => go(false), lead + total * qMs + 350)); return;
      }
      r.startPerf = performance.now() + lead; r.events = []; r.taps = []; r.lastTap = -1e9; r.live = true;
      setPhase('countin');
      r.timers.push(setTimeout(() => setPhase('play'), Math.max(0, lead - 120)));
      r.timers.push(setTimeout(finish, lead + total * qMs + 550));
      r.tick = setInterval(() => {
        const el = performance.now() - r.startPerf;
        if (el < 0) setCount(Math.ceil(-el / (qMs * unit))); else setCursor(Math.min(Math.floor(el / qMs / bar), Math.ceil(total / bar) - 1));
      }, 50);
    };
    go(listenFirst);
  }
  function finish() {
    const r = R.current; clear(); const tol = tolMs(qMs * unit);
    let ok = false, pp = 0, rp = 0, text = ''; const colors: Record<string, string> = {}; const x: PerfExtra = { pp: 0, rp: 0 };
    if (a.kind === 'rhythm') {
      const os = onsets(passage), g = gradeRhythm(os.map((o) => o.t * qMs), r.taps.filter((t) => t > -0.6 * qMs), tol);
      pp = rp = g.pct; ok = g.pct >= CFG.phrasePass && g.extras <= Math.max(2, os.length * 0.25);
      os.forEach((o, i) => { colors[`${o.staff}:${o.i}`] = MARK_COLOR[g.marks[i]]; });
      const dl = g.deltas.filter((d) => !Number.isNaN(d));
      x.perfect = dl.filter((d) => Math.abs(d) <= CFG.perfectMs).length; x.good = dl.filter((d) => Math.abs(d) > CFG.perfectMs && Math.abs(d) <= CFG.goodMs).length; x.miss = os.length - x.perfect - x.good;
      const c = (m: Mark) => g.marks.filter((k) => k === m).length;
      text = `${c('ok')} in time, ${c('early')} early, ${c('late')} late, ${c('miss')} missed${g.extras ? `, ${g.extras} extra tap${g.extras > 1 ? 's' : ''}` : ''}.`;
    } else {
      const os = onsets(expectP), exp = os.flatMap((o) => o.midis.map((m, j) => ({ t: o.t * qMs, midi: m, id: `${o.staff}:${o.i}:${j}` })));
      const g = gradePerform(exp, r.events.filter((e) => e.t > -0.6 * qMs), tol, qMs * unit, mode === 'mic' && st.voiceMode);
      pp = g.pitchPct; rp = g.rhythmPct; ok = pp >= CFG.phrasePass && rp >= CFG.phrasePass;
      if (expectP === passage) for (const [id, m] of Object.entries(g.marks)) { const k = id.split(':').slice(0, 2).join(':'), prev = Object.entries(MARK_COLOR).find(([, c]) => c === colors[k])?.[0] as Mark | undefined; if (!prev || RANK.indexOf(m) > RANK.indexOf(prev)) colors[k] = MARK_COLOR[m]; }
      text = `${g.counts.ok} right and in time, ${g.counts.early + g.counts.late} mistimed, ${g.counts.wrong} wrong, ${g.counts.miss} missed${g.extras ? `, ${g.extras} extra` : ''}.`;
    }
    if (tKey && !a.tempo && !tempoOverride && tempo === startTempo) reportTempo(tKey, passage.tempo, ok);
    x.pp = pp; x.rp = rp;
    setResult({ ok, pp, rp, colors, text }); setPhase('result'); setCursor(null); onFinish(ok, x);
  }
  const showScore = a.kind === 'perform' || a.visual || phase === 'result';
  const range = q.kbRange ?? [60, 84];
  return (
    <div className="col">
      {showScore && <Score spec={{ passage, colors: phase === 'result' ? result?.colors : undefined }} cursor={phase === 'play' && st.showCursor ? cursor : null} scale={st.notationScale} />}
      {phase === 'scan' && (
        <div className="col">
          <div className="row">
            <button className="btn sm" aria-label="Slower" disabled={!!tempoOverride || tempo <= 40} onClick={() => setTempo(tempo - 4)}>−</button>
            <span className="chip accent">{tempo} bpm</span>
            <button className="btn sm" aria-label="Faster" disabled={!!tempoOverride || tempo >= 168} onClick={() => setTempo(tempo + 4)}>+</button>
            <span className="grow" />
            {!listenFirst && left > 0 && <><span className="muted small" aria-live="polite">Starts in {left} s</span><button className="btn sm ghost" onClick={() => setLeft(0)}>Wait</button></>}
          </div>
          <button className="btn primary big" onClick={begin}><Icon name="playtri" size={16} />{listenFirst ? 'Listen' : 'Start now'}</button>
        </div>
      )}
      {phase === 'listen' && <div className="card center bold" aria-live="polite">Listen…</div>}
      {phase === 'countin' && <div className="count" aria-live="assertive">{count || 1}</div>}
      {phase === 'scan' && a.kind === 'perform' && mode === 'screen' && <><div className="small muted">Find your starting position. Nothing counts until the count-in ends.</div><Keyboard lo={range[0]} hi={range[1]} /></>}
      {phase === 'scan' && a.kind === 'perform' && mode === 'mic' && <MicBar />}
      {phase === 'scan' && a.kind === 'perform' && mode === 'midi' && <MidiBar />}
      {(phase === 'play' || phase === 'countin') && (
        <div className="col">
          {a.kind === 'rhythm' ? (mode === 'mic' ? <MicBar /> : <button className={'tappad' + (hit ? ' hit' : '')} onPointerDown={(e) => { e.preventDefault(); emitTap('screen'); }}>Tap here, or press any key</button>)
            : mode === 'mic' ? <MicBar /> : mode === 'midi' ? <MidiBar /> : <Keyboard lo={range[0]} hi={range[1]} />}
          <button className="btn ghost sm" onClick={() => { clear(); stopAll(); setPhase('scan'); setLeft(0); }}><Icon name="stop" size={14} />Stop</button>
        </div>
      )}
      {phase === 'result' && result && (
        <div className="col" style={{ gap: 8 }}>
          <div className="grid2">
            <div className="card center"><div className="bigstat">{Math.round(result.pp * 100)}%</div><div className="small muted">{a.kind === 'rhythm' ? 'in time' : 'pitch'}</div></div>
            {a.kind === 'perform' && <div className="card center"><div className="bigstat">{Math.round(result.rp * 100)}%</div><div className="small muted">rhythm</div></div>}
            {a.kind === 'rhythm' && <div className="card center"><div className="bigstat">{tempo}</div><div className="small muted">bpm</div></div>}
          </div>
          <div className="small">{result.text}</div>
          <div className="small muted">On the score: green is right and in time, amber is mistimed, red is wrong, grey was missed.</div>
          <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => { stopAll(); playPassage(expectP, tempo * unit); }}><Icon name="playtri" size={14} />Hear how it goes</button>
        </div>
      )}
    </div>
  );
}
