import { useRef, useState } from 'react';
import { set, useS } from '../store';
import { LESSONS } from '../content';
import { placeOut } from '../sched';
import { Runner, RunItem } from '../ui/Runner';
import { InputSwitch, MicBar, MidiBar } from '../ui/common';
import { Keyboard } from '../ui/Keyboard';
import { InputTest, Latency, SoundTest } from './Settings';
import { ac } from '../audio';

const PLACE: { level: number; items: RunItem[] }[] = [
  { level: 1, items: [{ ex: 'T1', preset: { clefs: ['treble'], range: 'staff' } }, { ex: 'T1', preset: { clefs: ['bass'], range: 'staff' } }] },
  { level: 2, items: [{ ex: 'T4', preset: { values: [4, 3, 2, 1.5, 1, 0.5], ask: 'beats' } }, { ex: 'T5', preset: { times: ['3/4', '4/4'], level: 3 } }] },
  { level: 3, items: [{ ex: 'T3', preset: { maxAcc: 4, kinds: 'both' } }, { ex: 'T3', preset: { maxAcc: 4, mode: 'minor' } }] },
  { level: 4, items: [{ ex: 'T6', preset: { ivs: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'], acc: true } }, { ex: 'T6', preset: { ivs: ['m3', 'M3', 'm6', 'M6', 'm7', 'M7'], acc: true } }] },
  { level: 5, items: [{ ex: 'T9', preset: { quals: ['maj', 'min', 'dim', 'aug'], invs: [0, 1, 2] } }, { ex: 'T9', preset: { quals: ['maj7', 'dom7', 'min7'], invs: [0] } }] },
  { level: 6, items: [{ ex: 'T11', preset: { keys: ['G', 'F', 'D'], kinds: ['triads'] } }, { ex: 'T11', preset: { keys: ['Am', 'Em'], kinds: ['triads'] } }] },
];
export function Onboarding() {
  const s = useS(); const [step, setStep] = useState(0), [placing, setPlacing] = useState(false), [placed, setPlaced] = useState<number | null>(null);
  const R = useRef<boolean[]>([]);
  const done = () => set((x) => { x.profile.onboarded = true; });
  const items = PLACE.flatMap((p) => p.items);
  const finishPlacement = () => {
    let lv = 0; for (let i = 0; i < PLACE.length; i++) { if (R.current[i * 2] && R.current[i * 2 + 1]) lv = PLACE[i].level; else break; }
    if (lv) placeOut(LESSONS.filter((l) => l.track === 'theory' && l.level <= lv).map((l) => l.id));
    setPlaced(lv); setPlacing(false);
  };
  return (
    <main className="main col" style={{ paddingTop: 28 }}>
      <div className="dots" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
      {step === 0 && <>
        <h1>Welcome to Learning Music</h1>
        <p className="muted">Theory, sight reading and ear training in one place, from zero. No account, nothing to pay, and your progress stays on this device.</p>
        <h2>How much time each day?</h2>
        <div className="seg" role="group" aria-label="Daily goal">{([5, 10, 20] as const).map((g) => <button key={g} aria-pressed={s.profile.dailyGoalMin === g} onClick={() => set((x) => { x.profile.dailyGoalMin = g; })}>{g} min</button>)}</div>
        <p className="small muted">Short and daily beats long and rare. You can change this later.</p>
        <h2>Can you hear it?</h2>
        <SoundTest />
      </>}
      {step === 1 && <>
        <h1>How will you answer?</h1>
        <p className="muted">All three work everywhere they can, and you can switch at any time. The on-screen keyboard needs nothing. The microphone hears one note at a time, sung or played. A MIDI keyboard is the most exact.</p>
        <InputSwitch />
        {s.profile.settings.input === 'mic' && <MicBar />}{s.profile.settings.input === 'midi' && <MidiBar />}
        {s.profile.settings.input !== 'mic' && s.profile.settings.input !== 'midi' && <Keyboard lo={60} hi={72} short />}
        <InputTest />
      </>}
      {step === 2 && <>
        <h1>Timing check (optional)</h1>
        <p className="muted">Devices add a small delay between your tap and the app hearing it. This measures it so rhythm is graded fairly. You can skip it and do it later in Settings.</p>
        <Latency />
      </>}
      {step === 3 && <>
        <h1>Already know some theory?</h1>
        {placing ? <Runner auto items={items} count={items.length} ctx="placement" onAnswer={(ok) => { R.current.push(ok); }} onDone={finishPlacement} />
          : placed != null ? <p>{placed ? `Theory levels 1 to ${placed} are marked as passed. You can still review any lesson.` : 'You will start from the first lesson, which is the right place to begin.'}</p>
            : <><p className="muted">Take a 3-minute placement quiz of 12 questions to skip theory lessons you already know, or start from the very beginning.</p><button className="btn" onClick={() => { ac(); R.current = []; setPlacing(true); }}>Take the placement quiz</button></>}
      </>}
      {!placing && <div className="row" style={{ marginTop: 10 }}>
        {step > 0 && <button className="btn grow" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 ? <button className="btn primary grow" onClick={() => { ac(); setStep(step + 1); }}>{step === 2 ? 'Next' : 'Next'}</button> : <button className="btn primary grow" onClick={done}>Start learning</button>}
      </div>}
      {step === 0 && <button className="btn ghost sm" onClick={done}>Skip setup</button>}
    </main>
  );
}
