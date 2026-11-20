// Synth mode's own screens: the Play tab with three games, and the placement quiz.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNav } from '../nav';
import { useS, get, set, dayKey } from '../store';
import { LESSONS } from '../content';
import { SKILLS, Skill, saveBest, saveStars, gameXp, bump, placeOut } from '../sched';
import { EX, exParams, Question, Answer } from '../exercises';
import { mulberry, shuffle } from '../music';
import { sfx } from '../audio';
import { Runner, RunItem } from '../ui/Runner';
import { TopBar, Icon, Bar } from '../ui/common';
import { Done } from '../screens/Run';
import { Patch } from './dsp';
import { gradeMatch, seqOf } from './exercises';
import { Panel, Trace } from './ui';
import * as live from './live';

export const SYNTH_GAMES = [
  { id: 's-name', name: 'Name That Sound', blurb: '75 seconds of listening: waveforms, filters, envelopes and effects from your lessons.', needs: ['S1', 'S2', 'S3', 'S4', 'S8', 'S11'], stars: [50, 120, 220] },
  { id: 's-rush', name: 'Knob Rush', blurb: '90 seconds. One knob, one target. Match as many as you can.', needs: ['S5'], stars: [4, 8, 12] },
  { id: 's-golf', name: 'Patch Golf', blurb: 'Nine targets by ear. Every check is a stroke. Fewest strokes wins.', needs: ['S6'], stars: [36, 27, 20] },
] as const;
type GameId = (typeof SYNTH_GAMES)[number]['id'];
const learned = (needs: readonly string[]): Skill[] => Object.values(SKILLS).filter((k) => k.track === 'synth' && get().skills[k.id] && needs.includes(k.ex));
const ready = (id: string) => learned(SYNTH_GAMES.find((g) => g.id === id)!.needs).length > 0;
const opensWith = (needs: readonly string[]) => LESSONS.find((l) => l.track === 'synth' && l.unlocks.some((u) => needs.includes(u.ex)));
const hash = (t: string) => { let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 100000; };
/** Today's synth challenge: the same seeded round for everyone, from the games the learner has reached. */
export function synthDaily(): { id: GameId; name: string; seed: number } | null {
  const pool = SYNTH_GAMES.filter((g) => g.id !== 's-golf' && ready(g.id)); if (!pool.length) return null;
  const seed = hash(dayKey()), g = pool[seed % pool.length]; return { id: g.id, name: g.name, seed };
}
function finish(id: GameId, score: number, stars: number, daily?: boolean) {
  saveStars('sgame:' + id, stars); gameXp(Math.min(60, Math.round(id === 's-name' ? score / 10 : id === 's-rush' ? score * 4 : stars * 15))); if (stars) sfx('win');
  if (!daily) return; const d = dayKey(), k = 'sdailyDone:' + d;
  if (!get().counters[k]) { set((s) => { s.counters[k] = 1; }); bump('daily'); }
}

// ---------- Name That Sound ----------
function NameGame({ daily, seed, onExit }: GP) {
  const s = useS(), SECS = 75, STARS = SYNTH_GAMES[0].stars;
  const [state, setState] = useState<'ready' | 'run' | 'end'>('ready'), [left, setLeft] = useState(SECS), [score, setScore] = useState(0), [combo, setCombo] = useState(1), [n, setN] = useState(0), [round, setRound] = useState(0);
  const R = useRef({ score: 0, n: 0 });
  const items: RunItem[] = useMemo(() => shuffle(mulberry(seed ?? Date.now() & 0xffff), learned(SYNTH_GAMES[0].needs)).map((k) => ({ ex: k.ex, preset: k.preset, skillId: k.id })), [round]);
  useEffect(() => { if (state !== 'run') return; if (left <= 0) { const st = STARS.filter((t) => R.current.score >= t).length; set((x) => { x.highs['s-name'] = Math.max(x.highs['s-name'] ?? 0, R.current.score); }); finish('s-name', R.current.score, st, daily); setState('end'); return; } const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id); }, [state, left]);
  const start = () => { R.current = { score: 0, n: 0 }; setScore(0); setN(0); setCombo(1); setLeft(SECS); setRound(round + 1); setState('run'); };
  return (
    <>
      <TopBar title="Name That Sound" sub={`${SECS} seconds · combo up to ×5`} onBack={onExit} right={state === 'run' ? <span className="chip accent">{left}s</span> : undefined} />
      <main className="main col">
        {state === 'ready' && <div className="col center" style={{ paddingTop: 24 }}><h1>Name That Sound</h1><p className="muted">Listening questions from every synth lesson you have passed. Each right answer in a row raises the multiplier; a miss resets it.</p><div className="small muted">Stars at {STARS.join(', ')} points</div><div className="muted">Best score: {s.highs['s-name'] ?? 0}</div><button className="btn primary big" onClick={start}>Start</button></div>}
        {state === 'run' && <>
          <div className="row between"><span className="chip accent">Score {score}</span><span className={'chip' + (combo >= 3 ? ' ok' : '')}>Combo ×{combo}</span></div>
          <div className="bar"><i style={{ width: `${(left / SECS) * 100}%` }} /></div>
          <Runner key={round} bare auto items={items} count={999} ctx="game" combo={combo} seedBase={seed} onDone={() => {}} onAnswer={(ok) => { const r = R.current; if (ok) { r.score += 10 * combo; r.n++; setScore(r.score); setN(r.n); setCombo(Math.min(5, combo + 1)); } else setCombo(1); }} />
        </>}
        {state === 'end' && <Done title="Time!" stars={STARS.filter((t) => score >= t).length} lines={[`${score} points`, `${n} correct`, `Best: ${Math.max(score, s.highs['s-name'] ?? 0)}`]} onAgain={start} onExit={onExit} />}
      </main>
    </>
  );
}

// ---------- shared: draw a match question from the skills learned ----------
type Match = Extract<Answer, { kind: 'match' }>;
function draw(exs: readonly string[], rng: () => number, more: Record<string, any> = {}): { q: Question; a: Match } {
  const pool = learned(exs), k = pool[Math.floor(rng() * pool.length)], q = EX[k.ex].gen({ ...exParams(k.ex, k.preset), ...more }, rng);
  return { q, a: q.answer as Match };
}

// ---------- Knob Rush ----------
function KnobRush({ daily, seed, onExit }: GP) {
  const s = useS(), SECS = 90, STARS = SYNTH_GAMES[1].stars;
  const [state, setState] = useState<'ready' | 'run' | 'end'>('ready'), [left, setLeft] = useState(SECS), [score, setScore] = useState(0), [cur, setCur] = useState<{ q: Question; a: Match } | null>(null), [p, setP] = useState<Patch>({}), [which, setWhich] = useState<'mine' | 'target'>('mine'), [flash, setFlash] = useState(false);
  const R = useRef({ score: 0, rng: mulberry(1), lock: false });
  useEffect(() => () => live.stop(), []);
  useEffect(() => { if (state !== 'run') return; if (left <= 0) { live.stop(); const st = STARS.filter((t) => R.current.score >= t).length; saveBest('s-rush', R.current.score); finish('s-rush', R.current.score, st, daily); setState('end'); return; } const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id); }, [state, left]);
  const next = () => { const c = draw(['S5'], R.current.rng, { show: true }); if (c.a.view === 'none') c.a.view = 'spectrum'; R.current.lock = false; setCur(c); setP({ ...c.a.start }); setWhich('mine'); setFlash(false); const sq = seqOf(c.a.seq); live.play(c.a.start, sq.n, sq.loop); };
  const start = () => { R.current = { score: 0, rng: mulberry(seed ?? (Date.now() & 0xffff)), lock: false }; setScore(0); setLeft(SECS); setState('run'); next(); };
  const change = (id: string, v: number) => {
    if (!cur || R.current.lock) return; const np = { ...p, [id]: v }; setP(np);
    if (which === 'mine') live.setPatch(np); else { const sq = seqOf(cur.a.seq); live.play(np, sq.n, sq.loop); setWhich('mine'); }
    if (gradeMatch(cur.a, np).ok) { R.current.lock = true; R.current.score++; setScore(R.current.score); setFlash(true); sfx('ok'); setTimeout(next, 450); }
  };
  const hear = (w: 'mine' | 'target') => { if (!cur) return; const sq = seqOf(cur.a.seq); live.play(w === 'mine' ? p : cur.a.target, sq.n, sq.loop); setWhich(w); };
  return (
    <>
      <TopBar title="Knob Rush" sub={`${SECS} seconds · one knob at a time`} onBack={onExit} right={state === 'run' ? <span className="chip accent">{left}s</span> : undefined} />
      <main className="main col">
        {state === 'ready' && <div className="col center" style={{ paddingTop: 24 }}><h1>Knob Rush</h1><p className="muted">Turn the knob until your line sits on the filled target. The moment it matches, the next one arrives. Your sound plays the whole time.</p><div className="small muted">Stars at {STARS.join(', ')} matches</div><div className="muted">Best: {s.bests['s-rush'] ?? 0} matches</div><button className="btn primary big" onClick={start}>Start</button></div>}
        {state === 'run' && cur && <>
          <div className="row between"><span className="chip accent">Matched {score}</span><span className="chip">{cur.q.prompt.replace(/^Match the target with the /, '').replace(/\.$/, '')}</span></div>
          <div className="bar"><i style={{ width: `${(left / SECS) * 100}%` }} /></div>
          {flash ? <div className="feedback ok" role="status"><div className="txt">Matched</div></div> : <Trace kind={cur.a.view === 'none' ? 'spectrum' : cur.a.view} patch={p} target={cur.a.target} seq={cur.a.seq} />}
          <div className="row" role="group" aria-label="Listen"><button className="tb-chip grow" aria-pressed={which === 'target'} onClick={() => hear('target')}>Hear the target</button><button className="tb-chip grow" aria-pressed={which === 'mine'} onClick={() => hear('mine')}>Hear mine</button></div>
          <Panel ctls={cur.a.ctls} patch={p} onChange={change} blind />
        </>}
        {state === 'end' && <Done title="Time!" stars={STARS.filter((t) => score >= t).length} lines={[`${score} matched`, `Best: ${Math.max(score, s.bests['s-rush'] ?? 0)}`]} onAgain={start} onExit={onExit} />}
      </main>
    </>
  );
}

// ---------- Patch Golf ----------
const HOLES = 9, MAX_STROKES = 6;
function PatchGolf({ onExit }: GP) {
  const s = useS(), STARS = SYNTH_GAMES[2].stars;
  const [state, setState] = useState<'ready' | 'run' | 'end'>('ready'), [hole, setHole] = useState(0), [strokes, setStrokes] = useState(0), [total, setTotal] = useState(0), [cur, setCur] = useState<{ q: Question; a: Match } | null>(null), [p, setP] = useState<Patch>({}), [which, setWhich] = useState<'mine' | 'target' | null>(null), [msg, setMsg] = useState(''), [sunk, setSunk] = useState(false);
  const R = useRef({ rng: mulberry(1), total: 0 });
  useEffect(() => () => live.stop(), []);
  const tee = (h: number) => { const c = draw(['S6'], R.current.rng); setCur(c); setP({ ...c.a.start }); setHole(h); setStrokes(0); setMsg(''); setSunk(false); setWhich(null); live.stop(); };
  const start = () => { R.current = { rng: mulberry(Date.now() & 0xffff), total: 0 }; setTotal(0); setState('run'); tee(0); };
  const stars = (t: number) => STARS.filter((x) => t <= x).length, best = s.bests['s-golf'] ? 100 - s.bests['s-golf'] : null;
  const advance = () => { if (hole + 1 >= HOLES) { live.stop(); saveBest('s-golf', 100 - R.current.total); finish('s-golf', R.current.total, stars(R.current.total)); setState('end'); } else tee(hole + 1); };
  const hear = (w: 'mine' | 'target') => { if (!cur) return; if (which === w) { live.stop(); setWhich(null); return; } const sq = seqOf(cur.a.seq); live.play(w === 'mine' ? p : cur.a.target, sq.n, sq.loop); setWhich(w); };
  const change = (id: string, v: number) => { if (!cur || sunk) return; const np = { ...p, [id]: v }; setP(np); const sq = seqOf(cur.a.seq); if (which === 'mine') live.setPatch(np); else { live.play(np, sq.n, sq.loop); setWhich('mine'); } };
  const check = () => {
    if (!cur) return; const n = strokes + 1, g = gradeMatch(cur.a, p); setStrokes(n);
    if (g.ok || n >= MAX_STROKES) { const cost = g.ok ? n : MAX_STROKES + 1; R.current.total += cost; setTotal(R.current.total); setSunk(true); live.stop(); setWhich(null); if (g.ok) sfx('ok'); setMsg(g.ok ? `In the hole in ${n}.` : `Out of strokes: this one counts ${cost}.`); }
    else setMsg(`${g.say}: turn it ${g.up ? 'up' : 'down'}.`);
  };
  return (
    <>
      <TopBar title="Patch Golf" sub={`${HOLES} holes · par ${STARS[1]}`} onBack={onExit} right={state === 'run' ? <span className="chip accent">{total} so far</span> : undefined} />
      <main className="main col">
        {state === 'ready' && <div className="col center" style={{ paddingTop: 24 }}><h1>Patch Golf</h1><p className="muted">Nine targets to match by ear, with no picture. Turn the controls as much as you like; each time you check is one stroke. After a miss you are told which control is furthest off.</p><div className="small muted">Stars at {STARS.join(', ')} strokes or fewer</div><div className="muted">{best != null ? `Best round: ${best} strokes` : 'No round played yet'}</div><button className="btn primary big" onClick={start}>Tee off</button></div>}
        {state === 'run' && cur && <>
          <div className="row between"><span className="chip accent">Hole {hole + 1} of {HOLES}</span><span className="chip">Stroke {Math.min(strokes + 1, MAX_STROKES)} of {MAX_STROKES}</span></div>
          <Bar v={hole / HOLES} />
          <div className="row" role="group" aria-label="Listen"><button className="tb-chip grow" aria-pressed={which === 'target'} onClick={() => hear('target')}>Hear the target</button><button className="tb-chip grow" aria-pressed={which === 'mine'} onClick={() => hear('mine')}>Hear mine</button></div>
          <Panel ctls={cur.a.ctls} patch={p} onChange={change} blind={!sunk} marks={sunk ? cur.a.target : undefined} />
          {msg && <div className={'feedback ' + (sunk && msg.startsWith('In') ? 'ok' : 'bad')} role="status" aria-live="polite"><div className="txt"><span>{msg}</span></div></div>}
          {sunk ? <button className="btn primary big" onClick={advance} autoFocus>{hole + 1 >= HOLES ? 'Finish the round' : 'Next hole'}</button> : <button className="btn primary big" onClick={check}>Check: stroke {strokes + 1}</button>}
        </>}
        {state === 'end' && <Done title="Round over" stars={stars(total)} lines={[`${total} strokes`, `Par is ${STARS[1]}`, `Best round: ${best != null ? Math.min(best, total) : total}`]} onAgain={start} onExit={onExit} />}
      </main>
    </>
  );
}

interface GP { daily?: boolean; seed?: number; onExit: () => void }
export function SynthGame({ id, daily, onExit }: { id: string; daily?: boolean; onExit: () => void }) {
  const p = { daily, onExit, seed: daily ? hash(dayKey()) : undefined };
  return id === 's-rush' ? <KnobRush {...p} /> : id === 's-golf' ? <PatchGolf {...p} /> : <NameGame {...p} />;
}

// ---------- the Play tab in synth mode ----------
export function SynthPlay() {
  const s = useS(), nav = useNav(), dc = synthDaily(), done = !!s.counters['sdailyDone:' + dayKey()];
  const best: Record<string, string> = { 's-name': `Best ${s.highs['s-name'] ?? 0}`, 's-rush': `Best ${s.bests['s-rush'] ?? 0}`, 's-golf': s.bests['s-golf'] ? `Best ${100 - s.bests['s-golf']} strokes` : 'Not played' };
  const total = SYNTH_GAMES.reduce((a, g) => a + (s.stars['sgame:' + g.id] ?? 0), 0);
  return (
    <>
      <TopBar title="Play" sub={`Games count as practice · ${total} of 9 stars`} />
      <main className="main col">
        {dc ? <button className="card tap" onClick={() => nav.go({ n: 'game', id: dc.id, daily: true })}><Icon name="star" /><span className="grow"><span className="small muted">Daily challenge{done ? ' · done today' : ' · from what you have learned'}</span><br /><b>{dc.name}</b></span><Icon name="playtri" size={14} /></button>
          : <div className="card line"><span className="small muted">Games open as your lessons reach them. Pass the first synth lesson and Name That Sound starts.</span></div>}
        <section>
          {SYNTH_GAMES.map((g) => { const ok = ready(g.id), l = opensWith(g.needs), got = s.stars['sgame:' + g.id] ?? 0; return (
            <button key={g.id} className={'node' + (ok ? '' : ' later')} disabled={!ok} onClick={() => nav.go({ n: 'game', id: g.id })}><span className="ico"><Icon name={ok ? 'play' : 'lock'} size={16} /></span>
              <span className="grow"><b>{g.name}</b><br /><span className="small muted">{ok || !l ? g.blurb : `Opens with lesson ${l.id}, “${l.title}”`}</span></span>
              {ok && <span style={{ textAlign: 'right', flex: '0 0 auto' }}><span className={'chip' + (got ? ' accent' : '')} aria-label={`${got} of 3 stars`}>★ {got}/3</span><br /><span className="small muted">{best[g.id]}</span></span>}</button>); })}
        </section>
        <button className="card tap" onClick={() => nav.go({ n: 'sandbox' })}><Icon name="keys" /><span className="grow"><span className="small muted">Free play</span><br /><b>Open the synth</b></span><Icon name="playtri" size={14} /></button>
      </main>
    </>
  );
}

// ---------- placement ----------
const QUICK = ['S1', 'S2', 'S3', 'S4', 'S8'];
/** Twelve listening questions, three from each of units 1 to 4. Two right out of three passes a unit; units pass in order. */
export function SynthPlacement({ onExit }: { onExit: () => void }) {
  const items = useMemo(() => [1, 2, 3, 4].flatMap((unit) => { const ls = LESSONS.filter((l) => l.track === 'synth' && l.level === unit), us = ls.flatMap((l) => l.unlocks.filter((u) => QUICK.includes(u.ex)).slice(0, 1)); return [us[0], us[Math.floor(us.length / 2)], us[us.length - 1]].map((u) => ({ ex: u.ex, preset: u.preset })); }), []);
  const [state, setState] = useState<'ready' | 'run' | 'end'>('ready'), [units, setUnits] = useState(0), R = useRef<boolean[]>([]);
  const end = () => {
    let passed = 0; for (let u = 0; u < 4; u++) { if (R.current.slice(u * 3, u * 3 + 3).filter(Boolean).length >= 2) passed = u + 1; else break; }
    if (passed) {
      placeOut(LESSONS.filter((l) => l.track === 'synth' && l.level <= passed).map((l) => l.id));
      // The quiz showed these skills, so the next unit opens at once instead of waiting on practice drills.
      set((s) => { for (const k of Object.values(SKILLS)) if (k.track === 'synth' && k.level <= passed && s.skills[k.id]) s.skills[k.id].status = 'practiced'; });
    }
    setUnits(passed); setState('end');
  };
  return (
    <>
      <TopBar title="Synth placement" sub="12 listening questions · about 4 minutes" onBack={onExit} />
      <main className="main col">
        {state === 'ready' && <div className="col center" style={{ paddingTop: 24 }}><h1>Already know the basics?</h1><p className="muted">Twelve questions by ear on sound, oscillators, filters and envelopes. Each unit you pass is skipped, so you start where the course gets new. Use headphones if you can.</p><button className="btn primary big" onClick={() => { R.current = []; setState('run'); }}>Start the quiz</button><button className="btn ghost" onClick={onExit}>Start from the beginning instead</button></div>}
        {state === 'run' && <Runner auto items={items} count={items.length} ctx="placement" onAnswer={(ok) => { R.current.push(ok); }} onDone={end} />}
        {state === 'end' && <Done title={units ? `You start at unit ${units + 1}` : 'Start at unit 1'} lines={[`${R.current.filter(Boolean).length} of 12 right`, units ? `Units 1 to ${units} are marked as passed. You can still open their lessons.` : 'Nothing is skipped. The first units go quickly.']} onExit={onExit} />}
      </main>
    </>
  );
}
