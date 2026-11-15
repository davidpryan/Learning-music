import { useNav } from '../nav';
import { useS, dayKey, addDays } from '../store';
import { TRACKS, TRACK_NAME, LEVEL_NAME } from '../content';
import { BADGES } from '../content/badges';
import { trackStats, weakSpots, liveStreak, playerLevel, playerTitle } from '../sched';
import { TopBar, Bar } from '../ui/common';

function Trend({ pts, unit, label }: { pts: (number | null)[]; unit: string; label: string }) {
  const vals = pts.filter((v): v is number => v != null);
  if (vals.length < 2) return <div className="small muted">{label}: not enough practice yet to draw a trend.</div>;
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1, W = 300, H = 70;
  const xy = pts.map((v, i) => (v == null ? null : [8 + (i * (W - 16)) / (pts.length - 1), H - 10 - ((v - lo) / span) * (H - 22)] as [number, number])).filter((p): p is [number, number] => !!p);
  return (
    <div><div className="row between small"><b>{label}</b><span className="muted">latest {vals[vals.length - 1].toFixed(unit === '%' ? 0 : 1)}{unit} · range {lo.toFixed(unit === '%' ? 0 : 1)} to {hi.toFixed(unit === '%' ? 0 : 1)}{unit}</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 70 }} role="img" aria-label={`${label} over the last 14 days, latest ${vals[vals.length - 1].toFixed(1)}${unit}`}><polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" />{xy.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--accent)" />)}</svg></div>
  );
}
export function Progress() {
  const s = useS(), nav = useNav(), today = dayKey();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const byDay = (f: (a: typeof s.attempts) => number | null) => days.map((d) => { const a = s.attempts.filter((x) => dayKey(new Date(x.t)) === d); return a.length >= 3 ? f(a) : null; });
  const acc = byDay((a) => (a.filter((x) => x.c).length / a.length) * 100);
  const rt = byDay((a) => { const m = a.filter((x) => x.c && x.ms > 0 && x.pp === undefined).map((x) => x.ms / 1000).sort((p, q) => p - q); return m.length ? m[Math.floor(m.length / 2)] : null; });
  const cal = Array.from({ length: 35 }, (_, i) => addDays(today, i - 34));
  const weak = weakSpots(s);
  return (
    <>
      <TopBar title="Progress" sub={`${playerTitle(s.profile.xp)} · level ${playerLevel(s.profile.xp)} · ${s.profile.xp} XP`} />
      <main className="main col">
        {TRACKS.map((t) => { const st = trackStats(s, t); return (
          <div key={t} className="card col" style={{ gap: 6 }}>
            <div className="row between"><b>{TRACK_NAME[t]}</b><span className="chip accent">{st.level ? `Level ${st.level} · ${LEVEL_NAME[t][st.level]}` : 'Not started'}</span></div>
            <div className="small muted">Lessons {st.passed} / {st.lessons}</div><Bar v={st.passed / st.lessons} />
            <div className="small muted">Skills: {st.mastered} mastered, {st.practiced} practiced, {st.learning} learning, of {st.skills}</div><Bar v={st.mastered / st.skills} ok />
          </div>); })}
        <div className="card line col"><h2>Last 14 days</h2><Trend pts={acc} unit="%" label="Accuracy" /><Trend pts={rt} unit=" s" label="Median response time" /></div>
        <div className="card line col"><h2>Weak spots</h2>
          {weak.length ? weak.map((w) => <div key={w.skill.id} className="row"><div className="grow"><b>{w.skill.title}</b><div className="small muted">{TRACK_NAME[w.skill.track]} · {Math.round(w.acc * 100)}% lately</div></div><button className="btn sm" onClick={() => nav.go({ n: 'run', title: w.skill.title, sub: 'Targeted drill', items: [{ ex: w.skill.ex, preset: w.skill.preset, skillId: w.skill.id }], count: ['R1', 'R2', 'R3', 'R4', 'R5', 'E6'].includes(w.skill.ex) ? 3 : 10, ctx: 'practice' })}>Drill</button></div>)
            : <div className="small muted">Nothing stands out yet. Skills under 85% accuracy will appear here with a one-tap drill.</div>}
        </div>
        <div className="card line col"><div className="row between"><h2 style={{ margin: 0 }}>Practice calendar</h2><span className="chip">{liveStreak(s)} day streak</span></div>
          <div className="cal" role="img" aria-label={`Practice calendar for the last five weeks. Goal met on ${cal.filter((d) => s.days[d]?.goal).length} days.`}>{cal.map((d) => { const x = s.days[d]; return <div key={d} className={x?.goal ? 'goal' : x && x.min > 0.5 ? 'some' : ''} title={`${d}: ${Math.floor(x?.min ?? 0)} min`}>{+d.slice(8)}</div>; })}</div>
          <div className="small muted">Filled: goal met. Tinted: some practice.</div>
        </div>
        <div className="card line col"><h2>Badges · {s.profile.badges.length} of {BADGES.length}</h2>
          <div className="grid2">{BADGES.map((b) => { const got = s.profile.badges.includes(b.id); return <div key={b.id} className={'badge' + (got ? '' : ' off')}><b>{got ? '★ ' : ''}{b.name}</b>{b.desc}{got ? '' : ' (not yet)'}</div>; })}</div>
        </div>
      </main>
    </>
  );
}
