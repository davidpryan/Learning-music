import { useNav } from '../nav';
import { useS, dayKey, storageNote } from '../store';
import { dayProgress, dueSkills, nextLesson, liveStreak, playerLevel, playerTitle, gateFor, drillFor, setMode } from '../sched';
import { modeTracks, TRACK_NAME } from '../content';
import { CFG } from '../config';
import { Icon, Bar, TopBar } from '../ui/common';
import { dailyChallenge } from '../games/games';

export function Home() {
  const s = useS(), nav = useNav();
  const day = dayProgress(s), goal = day.target;
  const due = dueSkills(s).length, nl = nextLesson(s), streak = liveStreak(s), xp = s.profile.xp;
  const synth = s.profile.mode === 'synth', TRACKS = modeTracks(s.profile.mode);
  const dc = synth ? null : dailyChallenge(), dcDone = !!s.counters['dailyDone:' + dayKey()];
  const fresh = !Object.keys(s.lessons).length, freshSynth = synth && !Object.keys(s.lessons).some((id) => id.startsWith('S'));
  const gates = TRACKS.map((t) => ({ t, g: gateFor(s, t) })).filter((x) => x.g && x.g.todo.length);
  return (
    <>
      <TopBar title="Learning Music" sub={`${playerTitle(xp)} · level ${playerLevel(xp)}`} right={<>
        <button className="iconbtn" aria-label="Tools" onClick={() => nav.go({ n: 'tools' })}><Icon name="tools" /></button>
        <button className="iconbtn" aria-label="Settings" onClick={() => nav.go({ n: 'settings' })}><Icon name="settings" /></button></>} />
      <main className="main col">
        <div className="seg" role="group" aria-label="What to learn">
          <button aria-pressed={!synth} onClick={() => setMode('music')}>Music</button>
          <button aria-pressed={synth} onClick={() => setMode('synth')}>Synth</button>
        </div>
        <div className="card col" style={{ gap: 10 }}>
          <div className="row between">
            <div className="row"><Icon name="flame" /><div><div className="bold">{streak} day streak</div><div className="small muted">One missed day a week is forgiven</div></div></div>
            <div style={{ textAlign: 'right' }}><div className="bold">{Math.floor(day.min)} / {goal} min</div><div className="small muted">{day.goal ? 'Goal met today' : `Today's ${s.profile.mode === 'synth' ? 'synth' : 'music'} goal`}</div></div>
          </div>
          <Bar v={day.min / goal} ok={day.goal} />
        </div>
        {fresh && <div className="card line col" style={{ gap: 6 }}><b>How this works</b>
          <div className="small">1. Take a short lesson. Passing its 5-question check unlocks skills.</div>
          <div className="small">2. Practise those skills in drills, in the daily session, or in games. They all count.</div>
          <div className="small">3. The app brings each skill back just before you would forget it. A new level opens once most skills of the one before are solid.</div></div>}
        {freshSynth && <div className="card line col" style={{ gap: 6 }}><b>Learn to use a synthesizer</b>
          <div className="small">103 short lessons, from what a sound is to rebuilding sounds by ear. Each one ends with you turning the controls of a real synth.</div>
          <div className="small">Use headphones if you can. Phone speakers hide bass and small changes in tone.</div>
          <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => nav.go({ n: 'splace' })}>Already know the basics? Take the placement quiz</button></div>}
        <button className="btn primary big" onClick={() => nav.go({ n: 'session' })}><Icon name="playtri" size={16} />Start today's session · about {goal} min</button>
        {nl && <button className="card tap" onClick={() => nav.go({ n: 'lesson', id: nl.id })}><Icon name="learn" /><span className="grow"><span className="small muted">Continue · {nl.track} lesson {nl.id}</span><br /><b>{nl.title}</b></span><Icon name="playtri" size={14} /></button>}
        {gates.map(({ t, g }) => { const d = drillFor(g!.todo); return (
          <button key={t} className="card tap" onClick={() => nav.go({ n: 'run', title: `Unlock ${TRACK_NAME[t]} level ${g!.lesson.level}`, sub: `${g!.ready} of ${g!.need} skills ready`, items: d.items, count: d.count, ctx: 'practice' })}>
            <Icon name="lock" /><span className="grow"><span className="small muted">{TRACK_NAME[t]} level {g!.lesson.level} is locked · {g!.ready} of {g!.need} skills ready</span><br /><b>Practise to unlock it</b><Bar v={g!.ready / g!.need} /></span><Icon name="playtri" size={14} /></button>); })}
        <div className="grid2">
          <button className="card tap" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} onClick={() => nav.go({ n: 'session' })}><span className="bigstat">{due}</span><span className="small muted">reviews due</span></button>
          <div className="card line" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span className="bigstat">{xp % CFG.xpPerLevel}<span className="small muted"> / {CFG.xpPerLevel} XP</span></span><Bar v={(xp % CFG.xpPerLevel) / CFG.xpPerLevel} /><span className="small muted">to level {playerLevel(xp) + 1}</span></div>
        </div>
        {synth && <button className="card tap" onClick={() => nav.go({ n: 'sandbox' })}><Icon name="keys" /><span className="grow"><span className="small muted">Free play</span><br /><b>Open the synth</b></span><Icon name="playtri" size={14} /></button>}
        {dc && <button className="card tap" onClick={() => nav.go({ n: 'game', id: dc.id, daily: true })}><Icon name="star" /><span className="grow"><span className="small muted">Daily challenge{dcDone ? ' · done today' : ''}</span><br /><b>{dc.name}</b></span><Icon name="playtri" size={14} /></button>}
        {storageNote() && <div className="feedback bad"><div className="txt"><span>{storageNote()}</span></div></div>}
      </main>
    </>
  );
}
