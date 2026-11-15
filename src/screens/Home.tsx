import { useNav } from '../nav';
import { useS, dayKey, storageNote } from '../store';
import { dueSkills, nextLesson, liveStreak, playerLevel, playerTitle } from '../sched';
import { CFG } from '../config';
import { Icon, Bar, TopBar } from '../ui/common';
import { dailyChallenge } from '../games/games';

export function Home() {
  const s = useS(), nav = useNav();
  const day = s.days[dayKey()] ?? { min: 0, xp: 0, goal: false }, goal = s.profile.dailyGoalMin;
  const due = dueSkills(s).length, nl = nextLesson(s), streak = liveStreak(s), xp = s.profile.xp;
  const dc = dailyChallenge(), dcDone = !!s.counters['dailyDone:' + dayKey()];
  return (
    <>
      <TopBar title="Learning Music" sub={`${playerTitle(xp)} · level ${playerLevel(xp)}`} right={<>
        <button className="iconbtn" aria-label="Tools" onClick={() => nav.go({ n: 'tools' })}><Icon name="tools" /></button>
        <button className="iconbtn" aria-label="Settings" onClick={() => nav.go({ n: 'settings' })}><Icon name="settings" /></button></>} />
      <main className="main col">
        <div className="card col" style={{ gap: 10 }}>
          <div className="row between">
            <div className="row"><Icon name="flame" /><div><div className="bold">{streak} day streak</div><div className="small muted">One missed day a week is forgiven</div></div></div>
            <div style={{ textAlign: 'right' }}><div className="bold">{Math.floor(day.min)} / {goal} min</div><div className="small muted">{day.goal ? 'Goal met today' : "Today's goal"}</div></div>
          </div>
          <Bar v={day.min / goal} ok={day.goal} />
        </div>
        <button className="btn primary big" onClick={() => nav.go({ n: 'session' })}><Icon name="playtri" size={16} />Start today's session · about {goal} min</button>
        {nl && <button className="card tap" onClick={() => nav.go({ n: 'lesson', id: nl.id })}><Icon name="learn" /><span className="grow"><span className="small muted">Continue · {nl.track} lesson {nl.id}</span><br /><b>{nl.title}</b></span><Icon name="playtri" size={14} /></button>}
        <div className="grid2">
          <button className="card tap" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} onClick={() => nav.go({ n: 'session' })}><span className="bigstat">{due}</span><span className="small muted">reviews due</span></button>
          <div className="card line" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span className="bigstat">{xp % CFG.xpPerLevel}<span className="small muted"> / {CFG.xpPerLevel} XP</span></span><Bar v={(xp % CFG.xpPerLevel) / CFG.xpPerLevel} /><span className="small muted">to level {playerLevel(xp) + 1}</span></div>
        </div>
        <button className="card tap" onClick={() => nav.go({ n: 'game', id: dc.id, daily: true })}><Icon name="star" /><span className="grow"><span className="small muted">Daily challenge{dcDone ? ' · done today' : ''}</span><br /><b>{dc.name}</b></span><Icon name="playtri" size={14} /></button>
        {storageNote() && <div className="feedback bad"><div className="txt"><span>{storageNote()}</span></div></div>}
      </main>
    </>
  );
}
