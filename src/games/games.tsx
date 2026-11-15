// The nine games. Each reuses the exercise generators and graders, and writes to the same skill records.
import { useEffect, useMemo, useRef, useState } from 'react';
import { get, set, useS, dayKey } from '../store';
import { SKILLS, record, saveBest, saveStars, gameXp, bump } from '../sched';
import { EX, exParams, Question } from '../exercises';
import { hashStr, mulberry, shuffle, fromDi, midi, pc, key as mkKey, diatonic, keyLabel, pname, label, Pitch, di } from '../music';
import { playSeq, stopAll } from '../audio';
import { onNote } from '../input';
import { drawStave } from '../notation';
import { LEVELS } from '../gen';
import { Runner, RunItem } from '../ui/Runner';
import { Keyboard } from '../ui/Keyboard';
import { TopBar, Icon, Stars, Circle, InputSwitch, MicBar, MidiBar, CIRCLE_MAJ, CIRCLE_MIN } from '../ui/common';
import { Timed, Done } from '../screens/Run';
import { LESSONS } from '../content';

export const GAMES = [
  { id: 'rush', name: 'Chord Builder Rush', track: 'theory', blurb: '60 seconds. Build each chord on the keyboard.' },
  { id: 'quest', name: 'Key Quest', track: 'theory', blurb: 'Claim every key on the circle of fifths.' },
  { id: 'boss', name: 'Theory Boss', track: 'theory', blurb: '15 mixed questions, 3 lives, one boss per level.' },
  { id: 'runner', name: 'Staff Runner', track: 'reading', blurb: 'Play each note before it crosses the line.' },
  { id: 'rhythm', name: 'Rhythm Tap', track: 'reading', blurb: '40 stages of rhythms to tap in time.' },
  { id: 'road', name: 'Open Road', track: 'reading', blurb: 'Endless unseen phrases. How long can you keep going?' },
  { id: 'echo', name: 'Echo', track: 'ear', blurb: 'Call and response. The melody grows a note each round.' },
  { id: 'dash', name: 'Degree Dash', track: 'ear', blurb: '60 seconds of scale degrees after a cadence.' },
  { id: 'detective', name: 'Progression Detective', track: 'ear', blurb: '60 cases. Work out the four chords.' },
] as const;
export function dailyChallenge() { const pool = ['rush', 'dash', 'runner', 'echo', 'road', 'rhythm']; const id = pool[hashStr(dayKey()) % pool.length]; return { id, name: GAMES.find((g) => g.id === id)!.name }; }
const skillFor = (ex: string) => Object.values(SKILLS).filter((k) => k.ex === ex && get().skills[k.id]).pop()?.id;
const markDaily = (daily?: boolean) => { if (!daily) return; const k = 'dailyDone:' + dayKey(); if (!get().counters[k]) { set((s) => { s.counters[k] = 1; }); bump('daily'); } };
const TIER = ['Bronze', 'Silver', 'Gold'];
function Tiers({ title, blurb, desc, onPick, onExit, best }: { title: string; blurb: string; desc: string[]; onPick: (t: number) => void; onExit: () => void; best?: (t: number) => string }) {
  return (
    <><TopBar title={title} onBack={onExit} /><main className="main col">
      <p className="muted">{blurb}</p><InputSwitch choice />
      {desc.map((d, t) => <button key={t} className="card tap" onClick={() => onPick(t)}><span className="grow"><b>{desc.length === 3 ? TIER[t] : `Tier ${t + 1}`}</b><br /><span className="small muted">{d}</span></span>{best && <span className="chip">{best(t)}</span>}<Icon name="playtri" size={14} /></button>)}
    </main></>
  );
}
interface GP { daily?: boolean; onExit: () => void }

// ---------- 1 + 8: the two timed rushes ----------
const RUSH = [{ quals: ['maj', 'min'], invs: [0], acc: false }, { quals: ['maj', 'min', 'dim', 'aug'], invs: [0, 1, 2], acc: false }, { quals: ['maj7', 'dom7', 'min7', 'hdim7', 'dim7', 'maj', 'min'], invs: [0], acc: true }];
const DASH = [{ keys: ['C'], degs: [0, 2, 4] }, { keys: ['C', 'G', 'F'], degs: [0, 1, 2, 3, 4, 5, 6] }, { keys: ['C', 'G', 'D', 'F', 'Bb', 'Am', 'Em'], degs: [0, 1, 2, 3, 4, 5, 6], chrom: true }];
function Rush({ daily, onExit, kind }: GP & { kind: 'rush' | 'dash' }) {
  const s = useS(); const [tier, setTier] = useState<number | null>(daily ? 0 : null);
  const isRush = kind === 'rush', title = isRush ? 'Chord Builder Rush' : 'Degree Dash';
  if (tier == null) return <Tiers title={title} blurb={isRush ? 'A chord symbol appears; build it on the keyboard. Any octave.' : 'A cadence sets the key, then one note sounds. Name or play its scale degree.'} onExit={onExit} best={(t) => 'Best ' + (s.highs[`${kind}:${t}`] ?? 0)}
    desc={isRush ? ['Major and minor triads', 'All four triads, with inversions', 'Seventh chords on any root'] : ['Degrees 1, 3 and 5 in C', 'All seven degrees, three keys', 'Seven keys, with chromatic notes']} onPick={setTier} />;
  return <Timed title={`${title} · ${TIER[tier]}`} ex={isRush ? 'T10' : 'E3'} preset={isRush ? RUSH[tier] : DASH[tier]} highKey={`${kind}:${tier}`} skillId={skillFor(isRush ? 'T10' : 'E3')} onExit={daily ? onExit : () => setTier(null)}
    onEnd={(score, n) => { saveBest(kind, score); saveBest(kind + 'Count', n); markDaily(daily); }} />;
}

// ---------- 2: Key Quest ----------
function Quest({ onExit }: GP) {
  const s = useS(); const [k, setK] = useState<string | null>(null), [run, setRun] = useState(false), [res, setRes] = useState<null | boolean>(null), [round, setRound] = useState(0);
  if (k && run) {
    const kk = mkKey(k), tonic = pname(kk.tonic);
    const ch = (d: number) => { const c = diatonic(kk, d); return { ex: 'T10', preset: { fixed: { root: pname(c.root), q: c.q } } }; };
    const items: RunItem[] = [{ ex: 'T3', preset: { only: k } }, { ex: 'T8', preset: { types: [kk.minor ? 'minor' : 'major'], tonics: [tonic] } }, ch(0), ch(3), ch(4)];
    return (
      <><TopBar title={`Key Quest · ${keyLabel(k)}`} sub="5 of 5 to claim the key" onBack={() => setRun(false)} /><main className="main col">
        {res == null ? <Runner key={round} auto items={items} count={5} ctx="game" onDone={(r) => { const win = r.correct === 5; if (win) { set((st) => { if (!st.keyQuest.includes(k)) st.keyQuest.push(k); }); gameXp(60); bump('questWins'); } setRes(win); }} />
          : <Done title={res ? 'Key claimed' : 'Not this time'} lines={[keyLabel(k), res ? 'It is yours on the map.' : 'You need all five. Try again.']} onAgain={res ? undefined : () => { setRes(null); setRound(round + 1); }} onExit={() => { setRun(false); setRes(null); }} />}
      </main></>
    );
  }
  return (
    <><TopBar title="Key Quest" sub={`${s.keyQuest.length} of 24 keys claimed`} onBack={onExit} /><main className="main col">
      <p className="muted">Pick a key. Clear its gauntlet (signature, scale, then the I, IV and V chords) with no mistakes to claim it. Major keys are the outer ring, minor keys the inner ring.</p>
      <Circle selected={k ?? undefined} claimed={s.keyQuest} onPick={setK} />
      <InputSwitch />
      <button className="btn primary big" disabled={!k} onClick={() => { setRes(null); setRound(round + 1); setRun(true); }}>{k ? `Start ${keyLabel(k)}${s.keyQuest.includes(k) ? ' (claimed)' : ''}` : 'Pick a key'}</button>
      <div className="small muted center">{CIRCLE_MAJ.filter((x) => s.keyQuest.includes(x)).length} of 12 major · {CIRCLE_MIN.filter((x) => s.keyQuest.includes(x)).length} of 12 minor</div>
    </main></>
  );
}

// ---------- 3: Theory Boss ----------
function Boss({ onExit }: GP) {
  const s = useS(); const [lv, setLv] = useState<number | null>(null), [lives, setLives] = useState(3), [end, setEnd] = useState<null | boolean>(null), [round, setRound] = useState(0);
  const L = useRef(3);
  const items = useMemo(() => (lv ? shuffle(mulberry(Date.now() & 0xffff), Object.values(SKILLS).filter((k) => k.track === 'theory' && k.level === lv)).map((k) => ({ ex: k.ex, preset: k.preset, skillId: get().skills[k.id] ? k.id : undefined })) : []), [lv, round]);
  if (lv == null || !items.length) return (
    <><TopBar title="Theory Boss" onBack={onExit} /><main className="main col">
      <p className="muted">One boss per theory level: 15 questions from that level and 3 lives. Win to earn the level badge; stars for lives left.</p><InputSwitch />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => { const open = LESSONS.some((l) => l.track === 'theory' && l.level === n && s.lessons[l.id]?.passedAt); return <button key={n} className="card tap" disabled={!open} style={{ opacity: open ? 1 : 0.5 }} onClick={() => { L.current = 3; setLives(3); setEnd(null); setRound(round + 1); setLv(n); }}><span className="grow"><b>Level {n} boss</b><br /><span className="small muted">{open ? 'Ready' : 'Pass a level ' + n + ' lesson to unlock'}</span></span><Stars n={s.stars['boss:' + n] ?? 0} /></button>; })}
    </main></>
  );
  return (
    <><TopBar title={`Level ${lv} boss`} onBack={() => setLv(null)} right={<span className="chip accent" aria-label={`${lives} lives`}>{'♥'.repeat(lives) || '0'} lives</span>} /><main className="main col">
      {end == null ? <Runner key={round} auto items={items} count={15} ctx="game" onAnswer={(ok) => { if (!ok) { L.current--; setLives(L.current); if (L.current <= 0) setTimeout(() => setEnd(false), 1200); } }} onDone={() => { if (L.current > 0) { saveStars('boss:' + lv, L.current); gameXp(100); setEnd(true); } }} />
        : <Done title={end ? 'Boss defeated' : 'Out of lives'} lines={[end ? `${lives} ${lives === 1 ? 'life' : 'lives'} left` : 'So close', end ? 'Level badge earned.' : 'Review the level and come back.']} onAgain={() => { L.current = 3; setLives(3); setEnd(null); setRound(round + 1); }} onExit={() => setLv(null)} />}
    </main></>
  );
}

// ---------- 4: Staff Runner ----------
const RUNNER_TIERS: { clef: 'treble' | 'bass'; lo: number; hi: number; acc: boolean; kb: [number, number] }[] = [{ clef: 'treble', lo: 30, hi: 38, acc: false, kb: [64, 77] }, { clef: 'bass', lo: 18, hi: 26, acc: false, kb: [43, 57] }, { clef: 'treble', lo: 26, hi: 42, acc: true, kb: [57, 84] }];
interface RN { id: number; p: Pitch; x: number; born: number }
function StaffRunner({ daily, onExit }: GP) {
  const s = useS(), st = s.profile.settings; const [tier, setTier] = useState<number | null>(daily ? 0 : null), [state, setState] = useState<'run' | 'end'>('run'), [, force] = useState(0), [flash, setFlash] = useState('');
  const field = useRef<HTMLDivElement>(null), bg = useRef<HTMLDivElement>(null);
  const G = useRef({ notes: [] as RN[], score: 0, lives: 3, last: 0, id: 0, w: 340, raf: 0, on: false });
  const T = tier != null ? RUNNER_TIERS[tier] : RUNNER_TIERS[0];
  const topDi = T.clef === 'treble' ? 38 : 26, yOf = (p: Pitch) => 48 + (topDi - di(p)) * 5;
  useEffect(() => {
    if (tier == null || state !== 'run') return;
    const g = G.current; g.notes = []; g.score = 0; g.lives = 3; g.on = true; g.w = field.current?.clientWidth ?? 340; g.last = performance.now();
    if (bg.current) drawStave(bg.current, T.clef, g.w, 170);
    const skill = skillFor('T1'), slow = st.reducedMotion ? 0.6 : 1;
    const spawn = () => { const p = fromDi(T.lo + Math.floor(Math.random() * (T.hi - T.lo + 1))); if (T.acc && Math.random() < 0.3) { p.a = Math.random() < 0.5 ? 1 : -1; if ((p.l === 2 || p.l === 6) && p.a === 1) p.a = 0; if ((p.l === 0 || p.l === 3) && p.a === -1) p.a = 0; } g.notes.push({ id: g.id++, p, x: g.w + 10, born: performance.now() }); };
    const loop = (now: number) => {
      if (!g.on) return; const dt = Math.min(0.05, (now - g.last) / 1000); g.last = now;
      const speed = (42 + 7 * Math.floor(g.score / 10)) * slow;
      g.notes.forEach((n) => { n.x -= speed * dt; });
      if (!g.notes.length || g.notes[g.notes.length - 1].x < g.w - 120) spawn();
      if (g.notes[0] && g.notes[0].x < 62) { g.notes.shift(); g.lives--; setFlash('miss'); setTimeout(() => setFlash(''), 250); if (g.lives <= 0) { g.on = false; saveBest('runner', g.score); gameXp(g.score * 2); markDaily(daily); setState('end'); return; } }
      force((x) => x + 1); g.raf = requestAnimationFrame(loop);
    };
    g.raf = requestAnimationFrame(loop);
    const un = onNote((e) => {
      const n = g.notes[0]; if (!n || !g.on) return;
      const mode = get().profile.settings.input; if ((e.source === 'mic' && mode !== 'mic') || (e.source === 'screen' && mode === 'mic')) return;
      const good = e.source === 'mic' && st.voiceMode ? pc(e.midi) === pc(midi(n.p)) : e.midi === midi(n.p);
      if (good) { g.notes.shift(); g.score++; record({ skillId: skill, ex: 'T1', ctx: 'game', correct: true, ms: performance.now() - n.born, input: e.source, item: `${T.clef}:${pname(n.p, true)}` }); setFlash('hit'); } else setFlash('bad');
      setTimeout(() => setFlash(''), 180);
    });
    return () => { g.on = false; cancelAnimationFrame(g.raf); un(); };
  }, [tier, state]);
  if (tier == null) return <Tiers title="Staff Runner" blurb="Notes scroll toward the line. Play each one before it gets there. Speed rises every 10 notes; you have 3 lives." desc={['Treble staff', 'Bass staff', 'Treble with ledger lines, sharps and flats']} onPick={(t) => { setState('run'); setTier(t); }} onExit={onExit} best={() => 'Best ' + (s.bests.runner ?? 0)} />;
  const g = G.current, mode = st.input;
  return (
    <><TopBar title={`Staff Runner · ${TIER[tier]}`} onBack={daily ? onExit : () => setTier(null)} right={<span className="chip accent">{'♥'.repeat(Math.max(0, g.lives))} · {g.score}</span>} /><main className="main col">
      {state === 'end' ? <Done title="Run over" lines={[`${g.score} notes`, `Best: ${Math.max(g.score, s.bests.runner ?? 0)}`]} onAgain={() => setState('run')} onExit={daily ? onExit : () => setTier(null)} /> : <>
        <div className="runner-field" ref={field} style={{ outline: flash === 'miss' ? '3px solid #b91c1c' : flash === 'bad' ? '3px solid #d97706' : flash === 'hit' ? '3px solid #15803d' : 'none' }} role="img" aria-label={g.notes[0] ? `Next note: ${label(g.notes[0].p, true)}` : 'Staff'}>
          <div ref={bg} style={{ position: 'absolute', inset: 0 }} />
          <svg width="100%" height="170" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
            <line x1="62" x2="62" y1="38" y2="98" stroke="#1f5fd1" strokeWidth="3" />
            {g.notes.map((n, i) => { const y = yOf(n.p), led: number[] = []; for (let yy = 98; yy <= y; yy += 10) led.push(yy); for (let yy = 38; yy >= y; yy -= 10) led.push(yy);
              return <g key={n.id}>{led.map((yy) => <line key={yy} x1={n.x - 11} x2={n.x + 11} y1={yy} y2={yy} stroke="#14171f" strokeWidth="1.3" />)}{n.p.a !== 0 && <text x={n.x - 20} y={y + 5} fontSize="15" fill="#14171f">{n.p.a > 0 ? '♯' : '♭'}</text>}<ellipse cx={n.x} cy={y} rx="6.8" ry="4.9" transform={`rotate(-20 ${n.x} ${y})`} fill={i === 0 ? '#1f5fd1' : '#14171f'} /></g>; })}
          </svg>
        </div>
        <InputSwitch />
        {mode === 'mic' ? <MicBar /> : mode === 'midi' ? <MidiBar /> : <Keyboard lo={T.kb[0]} hi={T.kb[1]} />}
      </>}
    </main></>
  );
}

// ---------- 5: Rhythm Tap ----------
const stageCfg = (n: number) => ({ level: [1, 1, 2, 3, 3, 5, 6, 6][Math.floor((n - 1) / 5)], tempo: 60 + ((n - 1) % 5) * 8 + Math.floor((n - 1) / 10) * 4, time: n > 25 && n <= 30 ? '6/8' : n > 10 && n <= 15 ? '3/4' : '4/4' });
function RhythmTap({ daily, onExit }: GP) {
  const s = useS(); const [stage, setStage] = useState<number | null>(daily ? Math.min(40, Object.keys(s.stars).filter((k) => k.startsWith('rhythm:')).length + 1) : null), [res, setRes] = useState<null | { stars: number; text: string }>(null), [round, setRound] = useState(0);
  const got = (n: number) => s.stars['rhythm:' + n] ?? 0;
  if (stage == null) return (
    <><TopBar title="Rhythm Tap" sub={`${Array.from({ length: 40 }, (_, i) => got(i + 1)).reduce((a, b) => a + b, 0)} of 120 stars`} onBack={onExit} /><main className="main col">
      <p className="muted">Tap each rhythm in time. Perfect is within 40 ms, Good within 100 ms. One star opens the next stage.</p><InputSwitch />
      <div className="grid3">{Array.from({ length: 40 }, (_, i) => i + 1).map((n) => { const open = n === 1 || got(n - 1) > 0; return <button key={n} className="card tap" style={{ flexDirection: 'column', gap: 2, alignItems: 'center', opacity: open ? 1 : 0.45, minHeight: 64 }} disabled={!open} onClick={() => { setRes(null); setStage(n); }} aria-label={`Stage ${n}, ${got(n)} stars${open ? '' : ', locked'}`}><b>{n}</b><Stars n={got(n)} /></button>; })}</div>
    </main></>
  );
  const c = stageCfg(stage);
  return (
    <><TopBar title={`Rhythm Tap · stage ${stage}`} sub={`${c.time} · ${c.tempo} bpm`} onBack={daily ? onExit : () => setStage(null)} /><main className="main col">
      {res ? <div className="col center" style={{ paddingTop: 16 }}><h1>{res.stars ? 'Stage clear' : 'Not yet'}</h1><div style={{ fontSize: 30 }}><Stars n={res.stars} /></div><div className="muted">{res.text}</div>
        <div className="row"><button className="btn grow" onClick={() => { setRes(null); setRound(round + 1); }}><Icon name="replay" size={16} />Again</button>{res.stars > 0 && stage < 40 && <button className="btn primary grow" onClick={() => { setRes(null); setStage(stage + 1); }}>Next stage</button>}<button className="btn grow" onClick={daily ? onExit : () => setStage(null)}>Stages</button></div></div>
        : <Runner key={`${stage}-${round}`} bare auto items={[{ ex: 'R1', preset: { level: c.level, bars: 4, time: c.time }, skillId: skillFor('R1') }]} count={1} ctx="game" seedBase={stage * 7919} tempoOverride={c.tempo} scan={4} onDone={() => {}}
          onAnswer={(_ok, _q, x) => { const tot = (x?.perfect ?? 0) + (x?.good ?? 0) + (x?.miss ?? 0) || 1, hitShare = ((x?.perfect ?? 0) + (x?.good ?? 0)) / tot, perf = (x?.perfect ?? 0) / tot; const stars = hitShare >= 0.95 && perf >= 0.5 ? 3 : hitShare >= 0.85 ? 2 : hitShare >= 0.7 ? 1 : 0; if (stars) { saveStars('rhythm:' + stage, stars); gameXp(stars * 15); } markDaily(daily); setTimeout(() => setRes({ stars, text: `${x?.perfect ?? 0} perfect, ${x?.good ?? 0} good, ${x?.miss ?? 0} missed` }), 1500); }} />}
    </main></>
  );
}

// ---------- 6: Open Road ----------
function Road({ daily, onExit }: GP) {
  const s = useS(); const [tier, setTier] = useState<number | null>(daily ? 0 : null), [run, setRun] = useState(0), [tempo, setTempo] = useState(60), [end, setEnd] = useState(false), [n, setN] = useState(0);
  const lv = tier != null ? [1, 2, 4][tier] : 1;
  if (tier == null) return <Tiers title="Open Road" blurb="Unseen four-bar phrases, one after another. Pass each at 80% to stay on the road. The tempo rises 4 bpm every 3 passes." desc={['Level 1: C to G, right hand', 'Level 2: one octave, either clef', 'Level 4: five-finger positions in C, G and F']} onPick={(t) => { setRun(0); setN(0); setEnd(false); setTempo(LEVELS[[1, 2, 4][t]].tempo - 8); setTier(t); }} onExit={onExit} best={() => 'Best run ' + (s.bests.road ?? 0)} />;
  return (
    <><TopBar title={`Open Road · ${TIER[tier]}`} sub={`Run of ${run} · ${tempo} bpm`} onBack={daily ? onExit : () => setTier(null)} /><main className="main col">
      {end ? <Done title="End of the road" lines={[`Run of ${run}`, `Best: ${Math.max(run, s.bests.road ?? 0)}`]} onAgain={() => { setRun(0); setEnd(false); setTempo(LEVELS[lv].tempo - 8); setN(n + 1); }} onExit={daily ? onExit : () => setTier(null)} />
        : <><InputSwitch /><Runner key={n} bare auto items={[{ ex: 'R2', preset: { level: lv }, skillId: skillFor('R2') }]} count={1} ctx="game" tempoOverride={tempo} scan={6} onDone={() => {}}
          onAnswer={(ok) => setTimeout(() => { if (ok) { const r = run + 1; setRun(r); if (r % 3 === 0) setTempo(tempo + 4); setN(n + 1); } else { saveBest('road', run); gameXp(run * 20); markDaily(daily); setEnd(true); } }, 1700)} /></>}
    </main></>
  );
}

// ---------- 7: Echo ----------
const SC = [0, 2, 4, 5, 7, 9, 11];
function Echo({ daily, onExit }: GP) {
  const s = useS(); const [seq, setSeq] = useState<number[]>(() => [pickDeg(), pickDeg()]), [round, setRound] = useState(0), [replays, setReplays] = useState(2), [end, setEnd] = useState<null | number>(null), [started, setStarted] = useState(false);
  function pickDeg(prev?: number) { let d = prev ?? [0, 2, 4][Math.floor(Math.random() * 3)]; if (prev != null) { d += (Math.random() < 0.7 ? 1 : 2) * (Math.random() < 0.5 ? 1 : -1); d = Math.max(-1, Math.min(8, d)); if (d === prev) d = prev + (prev > 3 ? -1 : 1); } return d; }
  const ms = seq.map((d) => 60 + SC[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7));
  const play = () => playSeq(ms.map((m, i) => ({ t: i * 0.75, d: 0.7, midis: [m] })), 60, s.profile.settings.timbre);
  const q: Question = { prompt: `Echo these ${seq.length} notes`, sub: 'C major · starts on a note of the C chord', play, kbRange: [55, 79], item: 'echo:' + seq.length, explain: ms.map((m) => label({ l: [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc(m)], a: 0, o: 4 })).join(' '),
    answer: { kind: 'steps', steps: ms.map((m) => [m]), octaveFree: true, alt: seq.map((d, i) => ({ label: `Note ${i + 1}`, choices: ['1', '2', '3', '4', '5', '6', '7'], value: String((((d % 7) + 7) % 7) + 1) })) } };
  const restart = () => { setSeq([pickDeg(), pickDeg()]); setRound(round + 1); setReplays(2); setEnd(null); };
  return (
    <><TopBar title="Echo" sub={`Round ${seq.length - 1} · best ${s.bests.echo ?? 0} notes`} onBack={onExit} /><main className="main col">
      {!started ? <div className="col center" style={{ paddingTop: 20 }}><h1>Echo</h1><p className="muted">Listen to a short melody in C major, then play or sing it back. Every round adds a note. You get two replays per round.</p><InputSwitch choice /><button className="btn primary big" onClick={() => setStarted(true)}>Start</button></div>
        : end != null ? <Done title="Echo over" lines={[`${end} notes echoed`, `Best: ${Math.max(end, s.bests.echo ?? 0)}`]} onAgain={restart} onExit={onExit} />
          : <><div className="row"><InputSwitch choice /></div><button className="btn" disabled={replays <= 0} onClick={() => { stopAll(); play(); setReplays(replays - 1); }}><Icon name="replay" size={14} />Hear it again ({replays} left)</button>
            <Runner key={round} bare auto noReplay question={q} items={[{ ex: 'E7', preset: {}, skillId: skillFor('E7') }]} count={1} ctx="game" onDone={() => {}}
              onAnswer={(ok) => setTimeout(() => { if (ok) { saveBest('echo', seq.length); gameXp(seq.length * 5); setSeq([...seq, pickDeg(seq[seq.length - 1])]); setRound(round + 1); setReplays(2); } else { markDaily(daily); setEnd(seq.length - 1); } }, ok ? 700 : 1500)} /></>}
    </main></>
  );
}

// ---------- 9: Progression Detective ----------
const caseCfg = (n: number) => { const keys = ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb']; const pool = n <= 20 ? ['I', 'IV', 'V'] : n <= 40 ? ['I', 'ii', 'IV', 'V', 'vi'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'V7/V', '♭VII']; return { keys: [keys[(n - 1) % (n <= 20 ? 3 : n <= 40 ? 5 : 7)]], pool, len: 4, style: 'band', tempo: 96 + (n % 3) * 6 }; };
function Detective({ onExit }: GP) {
  const s = useS(); const [n, setN] = useState<number | null>(null), [listens, setListens] = useState(0), [pick, setPick] = useState<(string | null)[]>([null, null, null, null]), [checked, setChecked] = useState<boolean[] | null>(null), [solved, setSolved] = useState(0), [tries, setTries] = useState(0);
  const q = useMemo(() => (n ? EX.E9.gen(exParams('E9', caseCfg(n)), mulberry(n * 104729)) : null), [n]);
  const got = (c: number) => s.stars['detective:' + c] ?? 0;
  if (n == null || !q || q.answer.kind !== 'steps') return (
    <><TopBar title="Progression Detective" sub={`${Object.keys(s.stars).filter((k) => k.startsWith('detective:')).length} of 60 cases solved`} onBack={onExit} /><main className="main col">
      <p className="muted">Each case is a four-chord loop played by a small band. Listen, then put the right chord in each slot. Solve it after one listen for 3 stars, within three for 2.</p>
      <div className="grid3">{Array.from({ length: 60 }, (_, i) => i + 1).map((c) => { const open = c === 1 || got(c - 1) > 0; return <button key={c} className="card tap" style={{ flexDirection: 'column', gap: 2, alignItems: 'center', opacity: open ? 1 : 0.45, minHeight: 64 }} disabled={!open} onClick={() => { setListens(0); setPick([null, null, null, null]); setChecked(null); setSolved(0); setTries(0); setN(c); }} aria-label={`Case ${c}, ${got(c)} stars${open ? '' : ', locked'}`}><b>Case {c}</b><Stars n={got(c)} /></button>; })}</div>
    </main></>
  );
  const slots = q.answer.alt!;
  const check = () => {
    const marks = slots.map((sl, i) => pick[i] === sl.value), all = marks.every(Boolean); setChecked(marks);
    if (tries === 0) record({ skillId: skillFor('E9'), ex: 'E9', ctx: 'game', correct: all, ms: 20000, input: 'choice', item: q.item });
    setTries(tries + 1);
    if (all) { const stars = listens <= 1 ? 3 : listens <= 3 ? 2 : 1; const first = !got(n); saveStars('detective:' + n, stars); gameXp(stars * 20); if (first) bump('cases'); setSolved(stars); stopAll(); }
  };
  return (
    <><TopBar title={`Case ${n}`} sub={q.sub} onBack={() => { stopAll(); setN(null); }} right={<span className="chip">{listens} listen{listens === 1 ? '' : 's'}</span>} /><main className="main col">
      {solved ? <div className="col center" style={{ paddingTop: 16 }}><h1>Case solved</h1><div style={{ fontSize: 30 }}><Stars n={solved} /></div><div className="muted">{q.explain}</div><div className="row"><button className="btn grow" onClick={() => setN(null)}>Cases</button>{n < 60 && <button className="btn primary grow" onClick={() => { setListens(0); setPick([null, null, null, null]); setChecked(null); setSolved(0); setTries(0); setN(n + 1); }}>Next case</button>}</div></div> : <>
        <button className="btn primary big" onClick={() => { stopAll(); q.play!(); setListens(listens + 1); }}><Icon name="playtri" size={16} />{listens ? 'Listen again' : 'Listen'}</button>
        {slots.map((sl, i) => <div key={i}><h3>{sl.label}{checked ? (checked[i] ? ' · right' : ' · try another') : ''}</h3><div className="choices tight" role="group" aria-label={sl.label}>{sl.choices.map((c) => <button key={c} className={'choice' + (checked && pick[i] === c ? (checked[i] ? ' right' : ' wrong') : '')} aria-pressed={pick[i] === c} onClick={() => { setPick((prev) => { const np = [...prev]; np[i] = c; return np; }); setChecked(null); }}>{c}</button>)}</div></div>)}
        <button className="btn primary" disabled={pick.some((x) => !x) || !listens} onClick={check}>Check</button>
      </>}
    </main></>
  );
}

export function GameScreen({ id, daily, onExit }: { id: string; daily?: boolean; onExit: () => void }) {
  const p = { daily, onExit };
  switch (id) {
    case 'rush': return <Rush {...p} kind="rush" />; case 'dash': return <Rush {...p} kind="dash" />;
    case 'quest': return <Quest {...p} />; case 'boss': return <Boss {...p} />; case 'runner': return <StaffRunner {...p} />;
    case 'rhythm': return <RhythmTap {...p} />; case 'road': return <Road {...p} />; case 'echo': return <Echo {...p} />; default: return <Detective {...p} />;
  }
}
