import { useNav } from '../nav';
import { useS, dayKey } from '../store';
import { GAMES, dailyChallenge, gameStars } from '../games/games';
import { TRACKS, TRACK_NAME } from '../content';
import { TopBar, Icon } from '../ui/common';

export function Play() {
  const s = useS(), nav = useNav(), dc = dailyChallenge();
  const best: Record<string, string> = { rush: `Best ${s.bests.rush ?? 0}`, runner: `Best ${s.bests.runner ?? 0}`, road: `Best run ${s.bests.road ?? 0}`, echo: `Best ${s.bests.echo ?? 0} notes`, dash: `Best ${s.bests.dash ?? 0}`, quest: 'keys claimed', boss: 'lives kept', rhythm: '40 stages', detective: '60 cases' };
  const total = GAMES.reduce((a, g) => a + gameStars(s, g.id)[0], 0), max = GAMES.reduce((a, g) => a + gameStars(s, g.id)[1], 0);
  const log = [...s.dailyLog].reverse().slice(0, 5), name = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;
  return (
    <>
      <TopBar title="Play" sub={`Games count as practice · ${total} of ${max} stars`} />
      <main className="main col">
        <button className="card tap" onClick={() => nav.go({ n: 'game', id: dc.id, daily: true })}><Icon name="star" /><span className="grow"><span className="small muted">Daily challenge{s.counters['dailyDone:' + dayKey()] ? ' · done today' : ' · the same for everyone today'}</span><br /><b>{dc.name}</b></span><Icon name="playtri" size={14} /></button>
        {log.length > 0 && <div className="small muted">Recent daily challenges: {log.map((e) => `${e.d.slice(5)} ${name(e.game)} ${e.score}`).join(' · ')}</div>}
        {TRACKS.map((t) => (
          <section key={t}>
            <div className="level-h">{TRACK_NAME[t]}</div>
            {GAMES.filter((g) => g.track === t).map((g) => { const [got, of] = gameStars(s, g.id); return (
              <button key={g.id} className="node" onClick={() => nav.go({ n: 'game', id: g.id })}><span className="ico"><Icon name="play" size={16} /></span><span className="grow"><b>{g.name}</b><br /><span className="small muted">{g.blurb}</span></span>
                <span style={{ textAlign: 'right', flex: '0 0 auto' }}><span className={'chip' + (got ? ' accent' : '')} aria-label={`${got} of ${of} stars`}>★ {got}/{of}</span><br /><span className="small muted">{best[g.id]}</span></span></button>); })}
          </section>
        ))}
      </main>
    </>
  );
}
