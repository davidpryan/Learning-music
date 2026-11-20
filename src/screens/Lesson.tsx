import { useRef, useState, useMemo } from 'react';
import { planCheck, passMark } from '../check';
import { useNav } from '../nav';
import { LESSON_BY_ID, TRACK_NAME } from '../content';
import { Runner, RunItem } from '../ui/Runner';
import { Figure, TopBar, Icon } from '../ui/common';
import { passLesson, skillsOf, drillFor } from '../sched';
import { stopAll } from '../audio';

export function LessonView({ id, onExit }: { id: string; onExit: () => void }) {
  const l = LESSON_BY_ID[id];
  const [step, setStep] = useState(0), [phase, setPhase] = useState<'steps' | 'check' | 'result'>('steps'), [score, setScore] = useState(0), [round, setRound] = useState(0);
  const sk = skillsOf(id), nav = useNav(), credit = useRef<{ skillId?: string; ok: boolean }[]>([]);
  // Synth lessons get a planned check: every concept once, no repeats, 5 to 8 questions. Music lessons keep five from their own list.
  const quiz: RunItem[] = useMemo(() => (l.track === 'synth' ? planCheck(l, sk.map((k) => k.id)) : (l.quiz ?? l.unlocks).map((u, i) => ({ ex: u.ex, preset: u.preset, skillId: l.quiz ? undefined : sk[i]?.id }))), [id, round]);
  const N = l.track === 'synth' ? quiz.length : 5, need = l.track === 'synth' ? passMark(N) : 4;
  const st = l.steps[step], last = step === l.steps.length - 1;
  const finishSteps = () => { stopAll(); if (!quiz.length) { passLesson(id, 5); setScore(5); setPhase('result'); } else setPhase('check'); };
  const pass = score >= need;
  return (
    <>
      <TopBar title={l.title} sub={`${TRACK_NAME[l.track]} · lesson ${l.id}`} onBack={onExit} />
      <main className="main col">
        {phase === 'steps' && (
          <>
            <div className="dots" aria-label={`Step ${step + 1} of ${l.steps.length}`}>{l.steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
            {st.fig && <Figure key={step} fig={st.fig} />}
            <p style={{ fontSize: 16 }}>{st.t}</p>
            {st.try && <div className="card line col"><span className="chip accent" style={{ alignSelf: 'flex-start' }}>Try it</span><Runner key={step} bare items={[{ ex: st.try.ex, preset: st.try.preset }]} count={1} ctx="lesson" onDone={() => {}} /></div>}
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn grow" disabled={step === 0} onClick={() => { stopAll(); setStep(step - 1); }}>Back</button>
              <button className="btn primary grow" onClick={() => (last ? finishSteps() : (stopAll(), setStep(step + 1)))}>{last ? (quiz.length ? 'Take the check' : 'Finish lesson') : 'Next'}</button>
            </div>
          </>
        )}
        {phase === 'check' && (
          <>
            <span className="chip accent" style={{ alignSelf: 'flex-start' }}>Check · {N} questions · pass with {need}</span>
            <Runner key={round} items={quiz} count={N} ctx="lesson" onAnswer={(ok) => { credit.current.push({ skillId: quiz[credit.current.length % quiz.length].skillId, ok }); }} onDone={(r) => { setScore(r.correct); if (r.correct >= need) passLesson(id, r.correct === N ? 5 : Math.min(4, Math.round((r.correct / N) * 5)), false, credit.current); credit.current = []; setPhase('result'); }} />
          </>
        )}
        {phase === 'result' && (
          <div className="col center" style={{ paddingTop: 20 }}>
            <h1>{pass ? 'Lesson passed' : 'Not yet'}</h1>
            {quiz.length > 0 && <div className="bigstat">{score} / {N}</div>}
            {pass ? (
              <>
                {sk.length > 0 && <div className="card" style={{ textAlign: 'left' }}><h3>Unlocked for practice, reviews and games</h3>{sk.map((k) => <div key={k.id} className="row" style={{ padding: '3px 0' }}><Icon name="check" size={16} />{k.title}</div>)}</div>}
                {sk.length > 0 && <button className="btn big" onClick={() => { const d = drillFor(sk); nav.go({ n: 'run', title: l.title, sub: 'Practise what you unlocked', items: d.items, count: d.count, ctx: 'practice' }); }}>Practise these now</button>}
                <button className="btn primary big" onClick={onExit} autoFocus>Continue</button>
              </>
            ) : (
              <>
                <p className="muted">You need 4 of 5. Go through the steps again, or retake the check.</p>
                <div className="row"><button className="btn grow" onClick={() => { setStep(0); setPhase('steps'); }}>Review the steps</button><button className="btn primary grow" onClick={() => { setRound(round + 1); setPhase('check'); }}>Retake the check</button></div>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
