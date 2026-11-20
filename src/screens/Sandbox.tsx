// Free play: the teaching synth with every control the lessons have reached, patch saving and share links.
import { useEffect, useState } from 'react';
import { useS, set } from '../store';
import { useNav } from '../nav';
import { synthControls } from '../sched';
import { PARAMS, PD, Patch, mkPatch, INIT } from '../synth/dsp';
import { Panel, Trace, HoldKeys } from '../synth/ui';
import * as live from '../synth/live';
import { TopBar } from '../ui/common';

const encode = (p: Patch) => btoa(JSON.stringify(Object.fromEntries(Object.keys(p).filter((k) => PD[k] && p[k] !== INIT[k]).map((k) => [k, +p[k].toFixed(4)]))));
function decode(h: string): Patch | null { try { const o = JSON.parse(atob(h)); const p: Patch = {}; for (const k of Object.keys(o)) if (PD[k] && typeof o[k] === 'number') p[k] = Math.min(PD[k].max, Math.max(PD[k].min, o[k])); return mkPatch(p); } catch { return null; } }
/** A patch carried in the page address (a share link), read once as the app loads, before the address is tidied. */
let shared: Patch | null = (() => { try { return location.hash.startsWith('#patch=') ? decode(location.hash.slice(7)) : null; } catch { return null; } })();
export const hasSharedPatch = () => !!shared;
const fromHash = () => shared;

export function Sandbox({ onExit }: { onExit: () => void }) {
  const s = useS(), nav = useNav();
  const [p, setP] = useState<Patch>(() => fromHash() ?? mkPatch()), [all, setAll] = useState(false), [name, setName] = useState(''), [view, setView] = useState<'spectrum' | 'wave'>('spectrum'), [oct, setOct] = useState(48);
  const learned = synthControls(s), ctls = all || !learned.length ? PARAMS.map((d) => d.id) : learned;
  useEffect(() => { live.setPatch(p); }, [p]);
  useEffect(() => () => { live.stop(); shared = null; }, []);
  const share = async () => { const url = location.href.split('#')[0] + '#patch=' + encode(p); try { await navigator.clipboard.writeText(url); nav.toast('Link copied'); } catch { nav.toast('Could not copy the link'); } };
  return (
    <>
      <TopBar title="The synth" sub={learned.length && !all ? `${learned.length} of ${PARAMS.length} controls unlocked by your lessons` : `All ${PARAMS.length} controls`} onBack={onExit} />
      <main className="main col">
        <Trace kind={view} patch={p} />
        <div className="col" style={{ gap: 8 }}>
          <div className="seg" role="group" aria-label="Picture"><button aria-pressed={view === 'spectrum'} onClick={() => setView('spectrum')}>Spectrum</button><button aria-pressed={view === 'wave'} onClick={() => setView('wave')}>Waveform</button></div>
          <div className="seg" role="group" aria-label="Keyboard octave"><button aria-pressed={oct === 36} onClick={() => setOct(36)}>Low</button><button aria-pressed={oct === 48} onClick={() => setOct(48)}>Mid</button><button aria-pressed={oct === 60} onClick={() => setOct(60)}>High</button></div>
        </div>
        <div className="dock"><HoldKeys lo={oct} /></div>
        <label className="field">Mod wheel<input type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => live.perform({ wheel: +e.target.value })} /></label>
        <Panel ctls={ctls} patch={p} onChange={(id, v) => setP({ ...p, [id]: v })} />
        <div className="row wrap">
          <button className="btn" onClick={() => setP(mkPatch())}>Reset</button>
          <button className="btn" onClick={share}>Copy a link to this patch</button>
          {learned.length > 0 && learned.length < PARAMS.length && <button className="btn" aria-pressed={all} onClick={() => setAll(!all)}>{all ? 'Show only what I have learned' : 'Show every control'}</button>}
        </div>
        <div className="row"><input type="text" placeholder="Patch name" aria-label="Patch name" value={name} onChange={(e) => setName(e.target.value)} /><button className="btn" disabled={!name.trim()} onClick={() => { set((st) => { st.synthPatches = [...(st.synthPatches ?? []), { name: name.trim(), patch: p }]; }); setName(''); }}>Save</button></div>
        {(s.synthPatches ?? []).length > 0 && <section><h3>Saved patches</h3>
          {s.synthPatches.map((sp, i) => <div key={i} className="row node" style={{ cursor: 'default' }}><b className="grow">{sp.name}</b><button className="btn sm" onClick={() => setP(mkPatch(sp.patch))}>Load</button><button className="btn sm ghost" aria-label={`Delete ${sp.name}`} onClick={() => set((st) => { st.synthPatches = st.synthPatches.filter((_, j) => j !== i); })}>Delete</button></div>)}
        </section>}
      </main>
    </>
  );
}
