// The shared question runner: asks any exercise, takes any input, grades, records, gives feedback.
import { useEffect, useRef, useState } from 'react';
import { EX, exParams, Question, Slot, Answer } from '../exercises';
import { mulberry, label, fromMidi, pc } from '../music';
import { freshSeed } from '../gen';
import { Score } from '../notation';
import { onNote } from '../input';
import { stopAll, playSeq } from '../audio';
import { matchStep } from '../grade';
import { record, isWeakItem } from '../sched';
import { get, useS, InputMode } from '../store';
import { Keyboard, KeyMark } from './Keyboard';
import { Icon, InputSwitch, MicBar, MidiBar } from './common';
import { Performer, PerfExtra } from './Perform';

export interface RunItem { ex: string; preset: Record<string, any>; skillId?: string }
export interface RunnerProps {
  items: RunItem[]; count: number; ctx: string; auto?: boolean; combo?: number; seedBase?: number; scan?: number; tempoOverride?: number;
  onAnswer?: (ok: boolean, q: Question, x?: PerfExtra) => void; onDone: (r: { correct: number; total: number }) => void; bare?: boolean; question?: Question; noReplay?: boolean;
}

function makeQ(it: RunItem, idx: number, seedBase?: number): Question {
  const params = exParams(it.ex, it.preset);
  const reps = it.skillId ? get().skills[it.skillId]?.recent.length ?? 0 : 0;
  if (EX[it.ex].track === 'ear' && reps > 5) params.rot = true;
  let best: Question | null = null;
  for (let k = 0; k < 3; k++) {
    const cand = EX[it.ex].gen(params, mulberry(seedBase != null ? seedBase + idx * 101 : freshSeed()));
    if (!best) best = cand;
    if (seedBase != null) break;
    if (isWeakItem(it.skillId, cand.item)) { best = cand; break; }
  }
  return best!;
}

export function Runner(p: RunnerProps) {
  const s = useS(), settings = s.profile.settings;
  const [i, setI] = useState(0), [tryN, setTryN] = useState(0);
  const [q, setQ] = useState<Question>(() => p.question ?? makeQ(p.items[0], 0, p.seedBase));
  const [res, setRes] = useState<null | { ok: boolean }>(null), [hint, setHint] = useState(false);
  const R = useRef({ t0: performance.now(), correct: 0, timer: null as any, done: false });
  const item = p.items[i % p.items.length], a = q.answer;
  const isPerf = a.kind === 'rhythm' || a.kind === 'perform';
  const hasAlt = a.kind === 'steps' && !!a.alt;
  const mode: InputMode = a.kind === 'slots' ? 'choice' : settings.input === 'choice' && !hasAlt ? 'screen' : settings.input;

  useEffect(() => {
    R.current.t0 = performance.now();
    if (import.meta.env.DEV) (window as any).__q = q; // test hook, stripped from production builds
    if (q.play) { try { const d = q.play(); R.current.t0 = performance.now() + d * 1000; } catch { /* audio needs a tap first */ } }
  }, [q]);
  useEffect(() => () => { clearTimeout(R.current.timer); stopAll(); }, []);

  const next = () => {
    clearTimeout(R.current.timer); stopAll();
    if (i + 1 >= p.count) { if (!R.current.done) { R.current.done = true; p.onDone({ correct: R.current.correct, total: p.count }); } return; }
    setI(i + 1); setQ(makeQ(p.items[(i + 1) % p.items.length], i + 1, p.seedBase)); setRes(null); setHint(false); setTryN(0);
  };
  const finish = (ok: boolean, used: string = mode, x?: PerfExtra) => {
    if (res) return;
    const ms = Math.max(0, performance.now() - R.current.t0);
    record({ skillId: item.skillId, ex: item.ex, ctx: p.ctx, correct: ok, ms, input: used, hinted: hint, pp: x?.pp, rp: x?.rp, item: q.item, combo: p.combo });
    if (ok) R.current.correct++;
    // a miss always sounds the right answer
    if (!ok && a.kind === 'steps') { stopAll(); try { playSeq(a.steps.map((st, k) => ({ t: k * 0.55, d: 0.55, midis: st })), 60, settings.timbre, 0.25, false); } catch { /* no audio yet */ } }
    setRes({ ok }); p.onAnswer?.(ok, q, x);
    if (p.auto) R.current.timer = setTimeout(next, isPerf ? 1800 : ok ? 650 : 1300);
    else if (ok && !isPerf) R.current.timer = setTimeout(next, 800);
  };
  const retry = () => { setRes(null); setTryN(tryN + 1); };

  return (
    <div className="col">
      {!p.bare && (
        <div className="row">
          <span className="chip" aria-label={`Question ${i + 1} of ${p.count}`}>{i + 1} / {p.count > 900 ? '∞' : p.count}</span>
          <span className="grow" />
          {q.play && <button className="btn sm" onClick={() => { stopAll(); q.play!(); }}><Icon name="replay" size={14} />Replay</button>}
          {!isPerf && !res && <button className="btn sm" onClick={() => setHint(true)} disabled={hint}><Icon name="hint" size={14} />Hint</button>}
          {!res && !p.auto && <button className="btn sm ghost" onClick={() => finish(false)}>{isPerf ? 'Skip' : 'Show answer'}</button>}
        </div>
      )}
      <div>
        <div className="prompt">{q.prompt}</div>
        {q.sub && <div className="muted small" style={{ marginTop: 2 }}>{q.sub}</div>}
      </div>
      {q.score && !isPerf && <Score spec={res && !res.ok && q.reveal ? q.reveal : q.score} scale={settings.notationScale} />}
      {!q.score && res && q.reveal && <Score spec={q.reveal} scale={settings.notationScale} />}
      {q.kb && <Keyboard lo={q.kbRange?.[0] ?? 48} hi={q.kbRange?.[1] ?? 72} marks={Object.fromEntries(q.kb.map((m) => [m, 'accent' as KeyMark]))} display short labels={false} />}
      {q.play && p.bare && !p.noReplay && <button className="btn" onClick={() => { stopAll(); q.play!(); }}><Icon name="replay" size={14} />Hear it again</button>}
      {hint && !res && a.kind === 'steps' && <div className="chip accent" style={{ alignSelf: 'flex-start' }}>Hint: {a.steps.length > 1 ? 'it starts on ' : 'it includes '}{label(fromMidi(a.steps[0][0]))}</div>}

      {a.kind === 'steps' && !isPerf && (
        <>
          {!p.bare && <InputSwitch choice={hasAlt} />}
          {mode === 'choice' && a.alt
            ? <SlotsArea key={`s${i}`} slots={a.alt} done={!!res} hint={hint} onFinish={(ok) => finish(ok, 'choice')} />
            : <StepsArea key={`k${i}`} q={q} a={a} mode={mode} done={!!res} ok={res?.ok} labels={hint || undefined} onFinish={finish} />}
        </>
      )}
      {a.kind === 'slots' && <SlotsArea key={`s${i}`} slots={a.slots} done={!!res} hint={hint} onFinish={(ok) => finish(ok, 'choice')} />}
      {isPerf && (
        <>
          {!p.bare && !res && <InputSwitch />}
          <Performer key={`p${i}-${tryN}`} a={a as any} q={q} mode={mode} scan={p.scan ?? (p.bare && p.ctx === 'lesson' ? 0 : undefined)} tempoOverride={p.tempoOverride} onFinish={(ok, x) => finish(ok, mode, x)} />
        </>
      )}

      {res && (
        <div className={'feedback ' + (res.ok ? 'ok' : 'bad')} role="status" aria-live="polite">
          <Icon name={res.ok ? 'check' : 'x'} />
          <div className="txt">{isPerf ? (res.ok ? 'Passed' : 'Not yet: aim for 80% on both') : res.ok ? 'Correct' : 'Not quite'}{!isPerf && <span>{q.explain}</span>}</div>
        </div>
      )}
      {res && !p.auto && (!res.ok || isPerf) && (
        <div className="row">
          {isPerf && <button className="btn grow" onClick={retry}><Icon name="replay" size={16} />Try again</button>}
          <button className="btn primary grow" onClick={next} autoFocus>{i + 1 >= p.count ? 'Finish' : 'Next'}</button>
        </div>
      )}
    </div>
  );
}

function StepsArea({ q, a, mode, done, ok, labels, onFinish }: { q: Question; a: Extract<Answer, { kind: 'steps' }>; mode: InputMode; done: boolean; ok?: boolean; labels?: boolean; onFinish: (ok: boolean, used?: string) => void }) {
  const voice = get().profile.settings.voiceMode;
  const [idx, setIdx] = useState(0), [sel, setSel] = useState<number[]>([]), [marks, setMarks] = useState<Record<number, KeyMark>>({});
  const st = useRef({ idx: 0, sel: [] as number[], first: -1, done: false });
  const range = q.kbRange ?? [60, 84];
  const advance = (good: boolean, src: string) => {
    const c = st.current;
    if (!good) { c.done = true; onFinish(false, src); return; }
    if (c.idx + 1 >= a.steps.length) { c.done = true; onFinish(true, src); return; }
    c.idx++; c.sel = []; c.first = -1; setIdx(c.idx); setSel([]);
  };
  const evalChord = (src: string) => { const c = st.current; advance(matchStep(a.steps[c.idx], c.sel, a.octaveFree, a.bass, src === 'mic' ? c.first : undefined), src); };
  useEffect(() => onNote((e) => {
    const c = st.current; if (c.done) return;
    if ((e.source === 'mic' && mode !== 'mic') || (e.source === 'screen' && mode !== 'screen')) return;
    const exp = a.steps[c.idx];
    if (exp.length === 1) {
      const good = matchStep(exp, [e.midi], a.octaveFree || (e.source === 'mic' && voice));
      setMarks((m) => ({ ...m, [e.midi]: good ? 'ok' : 'bad' })); advance(good, e.source);
    } else {
      if (e.source === 'screen' && c.sel.includes(e.midi)) c.sel = c.sel.filter((x) => x !== e.midi); else if (!c.sel.includes(e.midi)) c.sel = [...c.sel, e.midi];
      if (c.first < 0) c.first = e.midi;
      setSel(c.sel);
      if (e.source !== 'screen' && c.sel.length >= exp.length) evalChord(e.source);
    }
  }), [mode]);
  // after a miss, show the right keys
  const reveal: Record<number, KeyMark> = {};
  if (done && ok === false) for (const m of a.steps[st.current.idx]) { let k = m; if (a.octaveFree) { k = range[0] + ((pc(m) - pc(range[0]) + 12) % 12); if (m >= range[0] && m <= range[1]) k = m; } reveal[k] = 'ok'; }
  const multi = a.steps[idx].length > 1;
  return (
    <div className="col" style={{ gap: 8 }}>
      {a.steps.length > 1 && <div className="row"><span className="chip">Step {Math.min(idx + 1, a.steps.length)} of {a.steps.length}</span><div className="grow"><div className="bar"><i style={{ width: `${(idx / a.steps.length) * 100}%` }} /></div></div></div>}
      {mode === 'mic' && <><MicBar /><div className="small muted">{multi ? 'Sing or play the chord one note at a time, lowest first.' : 'Sing or play the note. Hold it steady.'}</div></>}
      {mode === 'midi' && <MidiBar />}
      {mode === 'screen' && <Keyboard lo={range[0]} hi={range[1]} marks={{ ...marks, ...reveal }} selected={sel} labels={labels} />}
      {mode === 'screen' && multi && !done && <button className="btn primary" disabled={!sel.length} onClick={() => evalChord('screen')}>Check chord ({sel.length} selected)</button>}
    </div>
  );
}

function SlotsArea({ slots, done, hint, onFinish }: { slots: Slot[]; done: boolean; hint: boolean; onFinish: (ok: boolean) => void }) {
  const [pick, setPick] = useState<(string | null)[]>(slots.map(() => null));
  const check = (pk: (string | null)[]) => onFinish(pk.every((x, j) => x === slots[j].value));
  const choose = (si: number, c: string) => { if (done) return; const np = [...pick]; np[si] = c; setPick(np); if (slots.length === 1) check(np); };
  return (
    <div className="col">
      {slots.map((sl, si) => {
        const wrong = sl.choices.filter((c) => c !== sl.value), gone = hint ? wrong.filter((_, j) => j % 2 === 0).slice(0, Math.max(0, wrong.length - 1)) : [];
        const tight = !sl.scores && sl.choices.every((c) => c.length <= 4);
        return (
          <div key={si}>
            {slots.length > 1 && <h3>{sl.label}</h3>}
            <div className={sl.scores ? 'col' : 'choices' + (tight ? ' tight' : '')} role="group" aria-label={sl.label}>
              {sl.choices.map((c, ci) => {
                const cls = done ? (c === sl.value ? ' right' : pick[si] === c ? ' wrong' : '') : gone.includes(c) ? ' gone' : '';
                return <button key={c} className={'choice' + cls} aria-pressed={pick[si] === c} disabled={done || gone.includes(c)} onClick={() => choose(si, c)} style={sl.scores ? { textAlign: 'left', padding: 8 } : undefined}>{c}{done && c === sl.value ? ' ✓' : done && pick[si] === c ? ' ✗' : ''}{sl.scores && <Score spec={sl.scores[ci]} />}</button>;
              })}
            </div>
          </div>
        );
      })}
      {slots.length > 1 && !done && <button className="btn primary" disabled={pick.some((x) => x == null)} onClick={() => check(pick)}>Check</button>}
    </div>
  );
}
