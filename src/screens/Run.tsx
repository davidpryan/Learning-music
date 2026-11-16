import { useEffect, useRef, useState } from 'react';
import { useNav, Route } from '../nav';
import { Runner } from '../ui/Runner';
import { answerStyle } from '../exercises';
import { TopBar, Icon, InputSwitch, Stars } from '../ui/common';
import { sfx } from '../audio';
import { get, set, useS } from '../store';
import { buildSession, SessionItem, gameXp } from '../sched';
import { dayKey } from '../store';
import { LessonView } from './Lesson';
import { GAMES } from '../games/games';

export function Done({ title, lines, onAgain, onExit, againLabel = 'Again', stars }: { title: string; lines: string[]; onAgain?: () => void; onExit: () => void; againLabel?: string; stars?: number }) {
  return (
    <div className="col center" style={{ paddingTop: 24 }}>
      <h1>{title}</h1>
      {stars != null && <div style={{ fontSize: 30 }}><Stars n={stars} /></div>}
      {lines.map((l, i) => <div key={i} className={i ? 'muted' : 'bigstat'}>{l}</div>)}
      <div className="row" style={{ marginTop: 12 }}>{onAgain && <button className="btn grow" onClick={onAgain}><Icon name="replay" size={16} />{againLabel}</button>}<button className="btn primary grow" onClick={onExit} autoFocus>Done</button></div>
    </div>
  );
}
export function Run({ r }: { r: Extract<Route, { n: 'run' }> }) {
  const nav = useNav(), s = useS();
  const [done, setDone] = useState<null | { correct: number; total: number }>(null), [round, setRound] = useState(0);
  const xp0 = useRef(get().profile.xp);
  const high = r.highKey ? s.highs[r.highKey] ?? 0 : 0;
  return (
    <>
      <TopBar title={r.title} sub={r.sub} onBack={nav.back} />
      <main className="main">
        {done ? <Done title="Finished" lines={[`${done.correct} of ${done.total} correct`, `+${s.profile.xp - xp0.current} XP`, ...(r.highKey ? [`Best: ${Math.max(high, done.correct)} of ${done.total}`] : [])]} onAgain={() => { xp0.current = get().profile.xp; setDone(null); setRound(round + 1); }} onExit={nav.back} />
          : <Runner key={round} items={r.items} count={r.count} ctx={r.ctx} onDone={(d) => { if (r.highKey) set((st) => { st.highs[r.highKey!] = Math.max(st.highs[r.highKey!] ?? 0, d.correct); }); setDone(d); }} />}
      </main>
    </>
  );
}
/** Timed challenge: as many as you can in 60 seconds. Also the engine behind the two "rush" games. */
export function Timed({ title, ex, preset, highKey, skillId, seconds = 60, onEnd, onExit, rotate, seedBase, stars }: {
  title: string; ex: string; preset: Record<string, any>; highKey: string; skillId?: string; seconds?: number; onEnd?: (score: number, count: number, stars: number) => void; onExit: () => void;
  rotate?: (block: number) => Record<string, any>; seedBase?: number; stars?: [number, number, number];
}) {
  const s = useS();
  const [left, setLeft] = useState(seconds), [score, setScore] = useState(0), [combo, setCombo] = useState(1), [n, setN] = useState(0), [state, setState] = useState<'ready' | 'run' | 'end'>('ready'), [round, setRound] = useState(0), [block, setBlock] = useState(0), [got, setGot] = useState(0);
  const R = useRef({ score: 0, n: 0, answered: 0 });
  useEffect(() => { if (state !== 'run') return; if (left <= 0) { end(); return; } const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id); }, [state, left]);
  const end = () => {
    const st = stars ? stars.filter((t) => R.current.score >= t).length : 0;
    setGot(st); setState('end'); set((x) => { x.highs[highKey] = Math.max(x.highs[highKey] ?? 0, R.current.score); }); gameXp(Math.round(R.current.score / 10)); if (st) sfx('win'); onEnd?.(R.current.score, R.current.n, st);
  };
  const start = () => { R.current = { score: 0, n: 0, answered: 0 }; setScore(0); setN(0); setCombo(1); setLeft(seconds); setBlock(0); setRound(round + 1); setState('run'); };
  return (
    <>
      <TopBar title={title} sub={`${seconds} seconds · combo up to ×5`} onBack={onExit} right={state === 'run' ? <span className="chip accent" aria-live="off">{left}s</span> : undefined} />
      <main className="main col">
        {state === 'ready' && <div className="col center" style={{ paddingTop: 24 }}><h1>{title}</h1><p className="muted">Answer as many as you can in {seconds} seconds. Each right answer in a row raises the multiplier; a miss resets it.</p>{stars && <div className="small muted">Stars at {stars.join(', ')} points</div>}<div className="muted">Best score: {s.highs[highKey] ?? 0}</div>{answerStyle(ex) !== 'choices' && <InputSwitch choice={answerStyle(ex) === 'either'} />}<button className="btn primary big" onClick={start}>Start</button></div>}
        {state === 'run' && <>
          <div className="row between"><span className="chip accent">Score {score}</span><span className={'chip' + (combo >= 3 ? ' ok' : '')}>Combo ×{combo}</span></div>
          <div className="bar"><i style={{ width: `${(left / seconds) * 100}%` }} /></div>
          {answerStyle(ex) !== 'choices' && <InputSwitch choice={answerStyle(ex) === 'either'} />}
          <Runner key={`${round}-${block}`} bare auto items={[{ ex, preset: rotate ? rotate(block) : preset, skillId }]} count={999} ctx="game" combo={combo} seedBase={seedBase != null ? seedBase + block * 7919 : undefined} onDone={() => {}}
            onAnswer={(ok) => { const r = R.current; r.answered++; if (ok) { r.score += 10 * combo; r.n++; setScore(r.score); setN(r.n); setCombo(Math.min(5, combo + 1)); } else setCombo(1); if (rotate && r.answered % 10 === 0) setTimeout(() => setBlock((b) => b + 1), ok ? 600 : 1250); }} />
        </>}
        {state === 'end' && <Done title="Time!" stars={stars ? got : undefined} lines={[`${score} points`, `${n} correct`, `Best: ${Math.max(score, s.highs[highKey] ?? 0)}`]} onAgain={start} onExit={onExit} />}
      </main>
    </>
  );
}

export function Session() { const [k, setK] = useState(0); return <SessionRun key={k} more={() => setK(k + 1)} />; }
function SessionRun({ more }: { more: () => void }) {
  const nav = useNav(), s = useS();
  const [items] = useState<SessionItem[]>(() => buildSession(get()));
  const [i, setI] = useState(0), [asked, setAsked] = useState(false), [stop, setStop] = useState(false);
  const day = s.days[dayKey()], goalMet = !!day?.goal;
  const it = items[i];
  const next = () => setI(i + 1);
  if (!items.length) return <><TopBar title="Today's session" onBack={nav.back} /><main className="main"><Done title="Nothing is due" lines={['All caught up', 'Start a lesson from the Learn tab, or play a game.']} onExit={nav.back} /></main></>;
  if (stop || i >= items.length) return <><TopBar title="Today's session" onBack={nav.back} /><main className="main"><Done title="Session complete" lines={[`${Math.floor(day?.min ?? 0)} min today`, goalMet ? 'Daily goal met.' : `${Math.max(1, Math.ceil(s.profile.dailyGoalMin - (day?.min ?? 0)))} min to go for today's goal.`]} onAgain={more} againLabel={goalMet ? 'One more round' : 'Keep going'} onExit={nav.back} /></main></>;
  if (goalMet && !asked && i > 0) return <><TopBar title="Today's session" onBack={nav.back} /><main className="main col center" style={{ paddingTop: 24 }}><h1>Daily goal reached</h1><p className="muted">{items.length - i} more step{items.length - i > 1 ? 's' : ''} in this session. Everything from here is optional.</p><div className="row"><button className="btn grow" onClick={() => setStop(true)}>Finish</button><button className="btn primary grow" onClick={() => setAsked(true)}>Keep going</button></div></main></>;
  const head = <TopBar title="Today's session" sub={`Step ${i + 1} of ${items.length}`} onBack={nav.back} right={<button className="btn sm ghost" onClick={next}>Skip</button>} />;
  if (it.kind === 'lesson') return <LessonView key={i} id={it.lesson.id} onExit={next} />;
  return (
    <>{head}<main className="main col">
      <div className="bar"><i style={{ width: `${(i / items.length) * 100}%` }} /></div>
      {it.kind === 'review' && <><span className="chip accent" style={{ alignSelf: 'flex-start' }}>Review · {it.skill.title}</span><Runner key={i} items={[{ ex: it.skill.ex, preset: it.skill.preset, skillId: it.skill.id }]} count={it.n} ctx="session" onDone={next} /></>}
      {it.kind === 'reading' && <><span className="chip accent" style={{ alignSelf: 'flex-start' }}>Reading · {it.skill.title}</span><Runner key={i} items={[{ ex: it.skill.ex, preset: it.skill.preset, skillId: it.skill.id }]} count={1} ctx="session" onDone={next} /></>}
      {it.kind === 'ear' && <><span className="chip accent" style={{ alignSelf: 'flex-start' }}>Ear · {it.skill.title}</span><Runner key={i} items={[{ ex: it.skill.ex, preset: it.skill.preset, skillId: it.skill.id }]} count={it.n} ctx="session" onDone={next} /></>}
      {it.kind === 'game' && <div className="col center" style={{ paddingTop: 16 }}><h1>Finish with a game?</h1><p className="muted">{it.why}</p><div className="row"><button className="btn grow" onClick={next}>No thanks</button><button className="btn primary grow" onClick={() => nav.go({ n: 'game', id: it.game })}>Play {GAMES.find((g) => g.id === it.game)?.name}</button></div></div>}
    </main></>
  );
}
