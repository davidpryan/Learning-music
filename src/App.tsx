import { useEffect, useRef, useState } from 'react';
import { Nav, Route } from './nav';
import { load, useS, get, dayKey } from './store';
import { addMinutes, takeNewBadges, playerLevel, playerTitle, liveStreak } from './sched';
import { sfx } from './audio';
import { micState } from './input';
import { Icon } from './ui/common';
import { Home } from './screens/Home';
import { Learn } from './screens/Learn';
import { LessonView } from './screens/Lesson';
import { Practice } from './screens/Practice';
import { Play } from './screens/Play';
import { Progress } from './screens/Progress';
import { Tools } from './screens/Tools';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { Run, Session, Timed } from './screens/Run';
import { GameScreen } from './games/games';
import { Sandbox, hasSharedPatch } from './screens/Sandbox';

const TABS: [Route['n'], string, string][] = [['home', 'Home', 'home'], ['learn', 'Learn', 'learn'], ['practice', 'Practice', 'practice'], ['play', 'Play', 'play'], ['progress', 'Progress', 'progress']];
const isTab = (n: string) => TABS.some((t) => t[0] === n);
const fromHash = (): Route => { try { const h = location.hash.replace('#', ''); if (isTab(h)) return { n: h as any }; } catch { /* no hash access */ } return { n: 'home' }; };

export default function App() {
  const s = useS();
  const [ready, setReady] = useState(false), [stack, setStack] = useState<{ r: Route; k: number }[]>([{ r: fromHash(), k: 0 }]), [toast, setToast] = useState('');
  const active = useRef(Date.now());
  useEffect(() => { load().then(() => { micState.gate = get().profile.micGate; setReady(true); if (hasSharedPatch() && get().profile.onboarded) setStack((st) => (st.some((e) => e.r.n === 'sandbox') ? st : [...st, { r: { n: 'sandbox' }, k: 9999 }])); }); }, []);
  useEffect(() => {
    const mark = () => { active.current = Date.now(); };
    ['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const id = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - active.current < 60000 && get().profile.onboarded) addMinutes(0.25); }, 15000);
    const onHash = () => { const r = fromHash(); setStack((st) => (st.length === 1 && st[0].r.n !== r.n && isTab(st[0].r.n) ? [{ r, k: st[0].k + 1 }] : st)); };
    window.addEventListener('hashchange', onHash);
    return () => { clearInterval(id); ['pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, mark)); window.removeEventListener('hashchange', onHash); };
  }, []);
  const toastTimer = useRef<any>(null);
  const showToast = (t: string, ms = 3500) => { setToast(t); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), ms); };
  const seen = useRef({ level: 0, goal: false, init: false });
  useEffect(() => {
    const b = takeNewBadges(), lv = playerLevel(s.profile.xp), goal = !!s.days[dayKey()]?.goal, was = seen.current;
    if (ready && was.init) {
      if (b.length) showToast(`Badge earned: ${b.slice(0, 2).join(', ')}${b.length > 2 ? ` and ${b.length - 2} more` : ''}`);
      else if (lv > was.level) { showToast(`Level ${lv} reached · ${playerTitle(s.profile.xp)}`); sfx('win'); }
      else if (goal && !was.goal) showToast(`Daily goal met · ${liveStreak(s)} day streak`);
    }
    seen.current = { level: lv, goal, init: ready };
  }, [s, ready]);
  const top = stack[stack.length - 1].r;
  useEffect(() => { if (isTab(top.n)) { try { if (location.hash !== '#' + top.n) history.replaceState(null, '', '#' + top.n); } catch { /* sandboxed */ } } window.scrollTo(0, 0); }, [top]);
  // The phone's Back button and the browser's Back both step back through screens instead of leaving the app.
  const hist = useRef({ pushed: 0, pops: 0 });
  const seq = useRef(1);
  const pop = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : [{ r: { n: 'home' }, k: seq.current++ }]));
  useEffect(() => {
    const h = () => { hist.current.pops++; hist.current.pushed = Math.max(0, hist.current.pushed - 1); pop(); };
    window.addEventListener('popstate', h); return () => window.removeEventListener('popstate', h);
  }, []);
  const nav = {
    go: (r: Route) => {
      if (isTab(r.n)) hist.current.pushed = 0;
      else { try { history.pushState({ lm: 1 }, ''); hist.current.pushed++; } catch { /* sandboxed: in-app Back still works */ } }
      setStack((st) => (isTab(r.n) ? [{ r, k: seq.current++ }] : [...st, { r, k: seq.current++ }]));
    },
    back: () => {
      const h = hist.current;
      if (h.pushed > 0) { const before = h.pops; try { history.back(); } catch { /* fall through */ } setTimeout(() => { if (h.pops === before) { h.pushed = 0; pop(); } }, 300); return; }
      pop();
    },
    toast: (t: string) => showToast(t, 3000),
  };
  if (!ready) return <div className="main center muted" style={{ paddingTop: 80 }}>Loading…</div>;
  if (!s.profile.onboarded) return <div className="app"><div className="shell"><Onboarding /></div></div>;
  const showTabs = isTab(top.n) || top.n === 'tools' || top.n === 'settings';
  // Every screen on the stack stays mounted (hidden) so going back returns to exactly where you were.
  const render = (r: Route): JSX.Element => {
    switch (r.n) {
      case 'learn': return <Learn />; case 'practice': return <Practice />; case 'play': return <Play />; case 'progress': return <Progress />;
      case 'tools': return <Tools />; case 'settings': return <Settings />; case 'session': return <Session />;
      case 'lesson': return <LessonView id={r.id} onExit={nav.back} />;
      case 'run': return <Run r={r} />;
      case 'timed': return <Timed title={r.title} ex={r.ex} preset={r.preset} highKey={r.highKey} skillId={r.skillId} onExit={nav.back} />;
      case 'sandbox': return <Sandbox onExit={nav.back} />;
      case 'game': return <GameScreen id={r.id} daily={r.daily} onExit={nav.back} />;
      default: return <Home />;
    }
  };
  return (
    <Nav.Provider value={nav}>
      <div className="app">
        {showTabs && <nav className="tabbar" aria-label="Main">{TABS.map(([n, l, ic]) => <button key={n} aria-current={top.n === n ? 'page' : undefined} onClick={() => nav.go({ n } as Route)}><Icon name={ic} />{l}</button>)}</nav>}
        {stack.map((e, i) => <div className="shell" data-sec={e.r.n} key={e.k} hidden={i !== stack.length - 1}>{render(e.r)}</div>)}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Nav.Provider>
  );
}
