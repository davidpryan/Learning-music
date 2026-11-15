import { useState } from 'react';
import { LESSON_BY_ID, TRACK_NAME } from '../content';
import { Runner, RunItem } from '../ui/Runner';
import { Figure, TopBar, Icon } from '../ui/common';
import { passLesson, skillsOf } from '../sched';
import { stopAll } from '../audio';

export function LessonView({ id, onExit }: { id: string; onExit: () => void }) {
  const l = LESSON_BY_ID[id];
  const [step, setStep] = useState(0), [phase, setPhase] = useState<'steps' | 'check' | 'result'>('steps'), [score, setScore] = useState(0), [round, setRound] = useState(0);
  const sk = skillsOf(id);
  const quiz: RunItem[] = (l.quiz ?? l.unlocks).map((u, i) => ({ ex: u.ex, preset: u.preset, skillId: l.quiz ? undefined : sk[i]?.id }));
  const st = l.steps[step], last = step === l.steps.length - 1;
  const finishSteps = () => { stopAll(); if (!quiz.length) { passLesson(id, 5); setScore(5); setPhase('result'); } else setPhase('check'); };
  const pass = score >= 4;
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
            <span className="chip accent" style={{ alignSelf: 'flex-start' }}>Check · 5 questions · pass with 4</span>
            <Runner key={round} items={quiz} count={5} ctx="lesson" onDone={(r) => { setScore(r.correct); if (r.correct >= 4) passLesson(id, r.correct); setPhase('result'); }} />
          </>
        )}
        {phase === 'result' && (
          <div className="col center" style={{ paddingTop: 20 }}>
            <h1>{pass ? 'Lesson passed' : 'Not yet'}</h1>
            {quiz.length > 0 && <div className="bigstat">{score} / 5</div>}
            {pass ? (
              <>
                {sk.length > 0 && <div className="card" style={{ textAlign: 'left' }}><h3>Unlocked for practice, reviews and games</h3>{sk.map((k) => <div key={k.id} className="row" style={{ padding: '3px 0' }}><Icon name="check" size={16} />{k.title}</div>)}</div>}
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
