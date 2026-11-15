import { useEffect, useRef, useState } from 'react';
import { Nav, Route } from './nav';
import { load, useS, get } from './store';
import { addMinutes, takeNewBadges } from './sched';
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

const TABS: [Route['n'], string, string][] = [['home', 'Home', 'home'], ['learn', 'Learn', 'learn'], ['practice', 'Practice', 'practice'], ['play', 'Play', 'play'], ['progress', 'Progress', 'progress']];
const isTab = (n: string) => TABS.some((t) => t[0] === n);
const fromHash = (): Route => { try { const h = location.hash.replace('#', ''); if (isTab(h)) return { n: h as any }; } catch { /* no hash access */ } return { n: 'home' }; };

export default function App() {
  const s = useS();
  const [ready, setReady] = useState(false), [stack, setStack] = useState<Route[]>([fromHash()]), [toast, setToast] = useState('');
  const active = useRef(Date.now());
  useEffect(() => { load().then(() => { micState.gate = get().profile.micGate; setReady(true); }); }, []);
  useEffect(() => {
    const mark = () => { active.current = Date.now(); };
    ['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const id = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - active.current < 60000 && get().profile.onboarded) addMinutes(0.25); }, 15000);
    const onHash = () => { const r = fromHash(); setStack((st) => (st.length === 1 && st[0].n !== r.n && isTab(st[0].n) ? [r] : st)); };
    window.addEventListener('hashchange', onHash);
    return () => { clearInterval(id); ['pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, mark)); window.removeEventListener('hashchange', onHash); };
  }, []);
  const toastTimer = useRef<any>(null);
  const showToast = (t: string, ms = 3500) => { setToast(t); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), ms); };
  useEffect(() => { const b = takeNewBadges(); if (b.length) showToast(`Badge earned: ${b.join(', ')}`); }, [s]);
  const top = stack[stack.length - 1];
  useEffect(() => { if (isTab(top.n)) { try { if (location.hash !== '#' + top.n) history.replaceState(null, '', '#' + top.n); } catch { /* sandboxed */ } } window.scrollTo(0, 0); }, [top]);
  const nav = {
    go: (r: Route) => setStack((st) => (isTab(r.n) ? [r] : [...st, r])),
    back: () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : [{ n: 'home' }])),
    toast: (t: string) => showToast(t, 3000),
  };
  if (!ready) return <div className="main center muted" style={{ paddingTop: 80 }}>Loading…</div>;
  if (!s.profile.onboarded) return <div className="app"><div className="shell"><Onboarding /></div></div>;
  const showTabs = isTab(top.n) || top.n === 'tools' || top.n === 'settings';
  let screen: JSX.Element;
  switch (top.n) {
    case 'learn': screen = <Learn />; break; case 'practice': screen = <Practice />; break; case 'play': screen = <Play />; break; case 'progress': screen = <Progress />; break;
    case 'tools': screen = <Tools />; break; case 'settings': screen = <Settings />; break; case 'session': screen = <Session />; break;
    case 'lesson': screen = <LessonView key={top.id} id={top.id} onExit={nav.back} />; break;
    case 'run': screen = <Run r={top} />; break;
    case 'timed': screen = <Timed title={top.title} ex={top.ex} preset={top.preset} highKey={top.highKey} onExit={nav.back} />; break;
    case 'game': screen = <GameScreen key={top.id} id={top.id} daily={top.daily} onExit={nav.back} />; break;
    default: screen = <Home />;
  }
  return (
    <Nav.Provider value={nav}>
      <div className="app">
        {showTabs && <nav className="tabbar" aria-label="Main">{TABS.map(([n, l, ic]) => <button key={n} aria-current={top.n === n ? 'page' : undefined} onClick={() => nav.go({ n } as Route)}><Icon name={ic} />{l}</button>)}</nav>}
        <div className="shell">{screen}</div>
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Nav.Provider>
  );
}
