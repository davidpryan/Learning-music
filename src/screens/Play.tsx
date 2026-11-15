import { useNav } from '../nav';
import { useS, dayKey } from '../store';
import { GAMES, dailyChallenge } from '../games/games';
import { TRACKS, TRACK_NAME } from '../content';
import { TopBar, Icon } from '../ui/common';

export function Play() {
  const s = useS(), nav = useNav(), dc = dailyChallenge();
  const sum = (prefix: string) => Object.entries(s.stars).filter(([k]) => k.startsWith(prefix)).reduce((a, [, v]) => a + v, 0);
  const stat: Record<string, string> = {
    rush: `Best ${s.bests.rush ?? 0}`, quest: `${s.keyQuest.length} / 24 keys`, boss: `${sum('boss:')} / 24 ★`, runner: `Best ${s.bests.runner ?? 0}`, rhythm: `${sum('rhythm:')} / 120 ★`,
    road: `Best run ${s.bests.road ?? 0}`, echo: `Best ${s.bests.echo ?? 0} notes`, dash: `Best ${s.bests.dash ?? 0}`, detective: `${sum('detective:')} / 180 ★`,
  };
  return (
    <>
      <TopBar title="Play" sub="Games count as practice" />
      <main className="main col">
        <button className="card tap" onClick={() => nav.go({ n: 'game', id: dc.id, daily: true })}><Icon name="star" /><span className="grow"><span className="small muted">Daily challenge{s.counters['dailyDone:' + dayKey()] ? ' · done today' : ''}</span><br /><b>{dc.name}</b></span><Icon name="playtri" size={14} /></button>
        {TRACKS.map((t) => (
          <section key={t}>
            <div className="level-h">{TRACK_NAME[t]}</div>
            {GAMES.filter((g) => g.track === t).map((g) => <button key={g.id} className="node" onClick={() => nav.go({ n: 'game', id: g.id })}><span className="ico"><Icon name="play" size={16} /></span><span className="grow"><b>{g.name}</b><br /><span className="small muted">{g.blurb}</span></span><span className="chip">{stat[g.id]}</span></button>)}
          </section>
        ))}
      </main>
    </>
  );
}
