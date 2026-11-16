import { useState } from 'react';
import { LESSONS, TRACKS, TRACK_NAME, LEVEL_NAME, Track, Lesson } from '../content';
import { useNav } from '../nav';
import { useS } from '../store';
import { lessonStatus, lockReason, skillsOf, trackStats, gateFor, drillFor, PERFORM_EX } from '../sched';
import { Icon, Sheet, TopBar, Bar } from '../ui/common';

const ICON: Record<string, string> = { locked: 'lock', available: 'playtri', passed: 'check', mastered: 'star' };
export function Learn() {
  const s = useS(), nav = useNav();
  const [track, setTrack] = useState<Track>('theory'), [open, setOpen] = useState<Lesson | null>(null);
  const wide = typeof window !== 'undefined' && window.innerWidth >= 900;
  const column = (t: Track) => {
    const ls = LESSONS.filter((l) => l.track === t), levels = [...new Set(ls.map((l) => l.level))], stt = trackStats(s, t);
    return (
      <div key={t} className="grow">
        {wide && <h2>{TRACK_NAME[t]}</h2>}
        <div className="small muted">{stt.passed} of {stt.lessons} lessons · {stt.mastered} of {stt.skills} skills mastered</div>
        <Bar v={stt.passed / stt.lessons} />
        {levels.map((lv) => (
          <div key={lv}>
            <div className="level-h">Level {lv} · {LEVEL_NAME[t][lv]}</div>
            {ls.filter((l) => l.level === lv).map((l) => {
              const stx = lessonStatus(s, l);
              return <button key={l.id} className={'node ' + stx} onClick={() => setOpen(l)} aria-label={`${l.title}, ${stx}`}><span className="ico"><Icon name={ICON[stx]} size={14} /></span><span className="grow"><span className="small muted">{l.id}</span> {l.title}</span>{(() => { const sk = skillsOf(l.id); if (stx === 'locked' || stx === 'available' || !sk.length) return null; const ok = sk.filter((k) => ['practiced', 'mastered'].includes(s.skills[k.id]?.status ?? '')).length; return <span className={'chip' + (ok === sk.length ? ' ok' : '')} aria-label={`${ok} of ${sk.length} skills practiced`}>{ok}/{sk.length}</span>; })()}</button>;
            })}
          </div>
        ))}
      </div>
    );
  };
  const o = open, ost = o ? lessonStatus(s, o) : 'locked';
  const gate = o && ost === 'locked' ? gateFor(s, o.track) : null, gateDrill = gate && gate.lesson.id === o!.id && gate.todo.length ? drillFor(gate.todo) : null;
  return (
    <>
      <TopBar title="Learn" sub="72 lessons in three tracks" />
      <main className="main col" style={wide ? { maxWidth: 1100 } : undefined}>
        {!wide && <div className="seg" role="group" aria-label="Track">{TRACKS.map((t) => <button key={t} aria-pressed={track === t} onClick={() => setTrack(t)}>{TRACK_NAME[t]}</button>)}</div>}
        <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>{wide ? TRACKS.map(column) : column(track)}</div>
      </main>
      {o && (
        <Sheet title={o.title} onClose={() => setOpen(null)}>
          <div className="col">
            <div className="small muted">{TRACK_NAME[o.track]} · level {o.level} · lesson {o.id} · {o.steps.length} steps</div>
            {ost === 'locked' ? <><div className="feedback bad"><Icon name="lock" /><div className="txt">Locked<span>{lockReason(s, o)}</span></div></div>
              {gateDrill && <button className="btn primary big" onClick={() => { setOpen(null); nav.go({ n: 'run', title: `Unlock level ${o.level}`, sub: `${gate!.ready} of ${gate!.need} skills ready`, items: gateDrill.items, count: gateDrill.count, ctx: 'practice' }); }}>Practise toward the unlock</button>}</>
              : <button className="btn primary big" onClick={() => { setOpen(null); nav.go({ n: 'lesson', id: o.id }); }}>{ost === 'available' ? 'Start lesson' : 'Review lesson'}</button>}
            {skillsOf(o.id).length > 0 && <h3 style={{ marginTop: 6 }}>Skills this lesson unlocks</h3>}
            {skillsOf(o.id).map((k) => {
              const ks = s.skills[k.id], status = ks ? ks.status : 'locked', n = ks?.recent.length ?? 0, acc = n ? Math.round((ks!.recent.filter((r) => r.c).length / n) * 100) : 0;
              return (
                <div key={k.id} className="row card line" style={{ padding: 10 }}>
                  <div className="grow"><b>{k.title}</b><div className="small muted">{status === 'locked' ? 'Pass the lesson to unlock' : `${status} · ${n ? acc + '% of last ' + n : 'not practised yet'}`}</div></div>
                  <button className="btn sm" disabled={!ks} onClick={() => { setOpen(null); nav.go({ n: 'run', title: k.title, sub: 'Skill practice', items: [{ ex: k.ex, preset: k.preset, skillId: k.id }], count: PERFORM_EX.includes(k.ex) ? 3 : 10, ctx: 'practice' }); }}>Practise</button>
                  {!PERFORM_EX.includes(k.ex) && <button className="btn sm" disabled={!ks} aria-label={`60-second sprint: ${k.title}`} onClick={() => { setOpen(null); nav.go({ n: 'timed', title: k.title, ex: k.ex, preset: k.preset, highKey: 'sprint:' + k.id, skillId: k.id }); }}>Sprint{s.highs['sprint:' + k.id] ? ` · ${s.highs['sprint:' + k.id]}` : ''}</button>}
                </div>
              );
            })}
          </div>
        </Sheet>
      )}
    </>
  );
}
