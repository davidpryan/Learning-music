// Free play: the teaching synth with every control the lessons have reached, patch saving and share links.
import { useEffect, useRef, useState } from 'react';
import { useS, set } from '../store';
import { useNav } from '../nav';
import { synthControls } from '../sched';
import { PARAMS, PD, Patch, mkPatch, INIT } from '../synth/dsp';
import { Panel, Trace, HoldKeys, StepGrid } from '../synth/ui';
import { stepsToSeq } from '../synth/exercises';
import { ac } from '../audio';
import * as live from '../synth/live';
import { TopBar } from '../ui/common';
import { sharedPatch } from '../synthload';

const encode = (p: Patch) => btoa(JSON.stringify(Object.fromEntries(Object.keys(p).filter((k) => PD[k] && p[k] !== INIT[k]).map((k) => [k, +p[k].toFixed(4)]))));
function decode(h: string): Patch | null { try { const o = JSON.parse(atob(h)); const p: Patch = {}; for (const k of Object.keys(o)) if (PD[k] && typeof o[k] === 'number') p[k] = Math.min(PD[k].max, Math.max(PD[k].min, o[k])); return mkPatch(p); } catch { return null; } }
/** A patch carried in the page address (a share link), read once as the app loads, before the address is tidied. */
let shared: Patch | null = sharedPatch ? decode(sharedPatch) : null;
const fromHash = () => shared;

const SEQ_ROWS = [0, 3, 5, 7, 10, 12];
/** Trim a decoded recording to two seconds of mono at full level, ready for the sampler and granular engines. */
function prepare(buf: AudioBuffer): Float32Array {
  const src = buf.getChannelData(0), n = Math.min(src.length, Math.floor(buf.sampleRate * 2)), out = new Float32Array(n); let pk = 1e-4;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(src[i]));
  for (let i = 0; i < n; i++) out[i] = (src[i] / pk) * 0.9 * Math.min(1, i / 64, (n - i) / 256);
  return out;
}
export function Sandbox({ onExit }: { onExit: () => void }) {
  const s = useS(), nav = useNav();
  const [p, setP] = useState<Patch>(() => fromHash() ?? mkPatch()), [all, setAll] = useState(false), [name, setName] = useState(''), [view, setView] = useState<'spectrum' | 'wave'>('spectrum'), [oct, setOct] = useState(60);
  const [steps, setSteps] = useState<(number | null)[]>(() => [0, null, 12, null, 7, null, 3, 7, 0, null, 12, null, 10, 7, 3, null]), [slides, setSlides] = useState<boolean[]>(() => Array(16).fill(false)), [run, setRun] = useState(false), [smp, setSmp] = useState('The built-in recording'), file = useRef<HTMLInputElement>(null);
  const stepsRef = useRef(steps);
  const pattern = (st = steps, sl = slides) => stepsToSeq(st, oct, 60 / p.bpm / 4, sl);
  const restart = (st = steps, sl = slides) => { const q = pattern(st, sl); if (q.n.length) live.play(p, q.n, q.loop); };
  useEffect(() => { if (run) restart(); }, [oct, p.bpm]);
  const useSound = async (data: ArrayBuffer, name: string) => { try { const buf = await ac().decodeAudioData(data); live.setSample(prepare(buf)); setSmp(name); setP((x) => ({ ...x })); } catch { nav.toast('That file could not be read as sound'); } };
  const record = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), rec = new MediaRecorder(stream), parts: Blob[] = [];
      rec.ondataavailable = (e) => parts.push(e.data); rec.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); useSound(await new Blob(parts).arrayBuffer(), 'Your recording'); };
      setSmp('Recording for two seconds…'); rec.start(); setTimeout(() => rec.stop(), 2100);
    } catch { nav.toast('The microphone is not available'); }
  };
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
          <div className="seg" role="group" aria-label="Keyboard octave"><button aria-pressed={oct === 48} onClick={() => setOct(48)}>Low</button><button aria-pressed={oct === 60} onClick={() => setOct(60)}>Mid</button><button aria-pressed={oct === 72} onClick={() => setOct(72)}>High</button></div>
        </div>
        <div className="dock"><HoldKeys lo={oct} /></div>
        <section className="col" style={{ gap: 8 }}>
          <h3>Step sequencer</h3>
          <button className={'btn' + (run ? '' : ' primary')} aria-pressed={run} onClick={() => { if (run) live.stop(); else restart(); setRun(!run); }}>{run ? 'Stop the pattern' : 'Play the pattern'}</button>
          <StepGrid steps={steps} pitches={SEQ_ROWS} onChange={(i, v) => { const ns = stepsRef.current.slice(); ns[i] = v; stepsRef.current = ns; setSteps(ns); if (run) restart(ns); }} />
          <div className="tb-grid" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }} role="group" aria-label="Slide into the next step">{slides.map((on, i) => <button key={i} className="tb-cell" style={{ height: 24 }} aria-pressed={on} aria-label={`Slide from step ${i + 1}`} onClick={() => { const ns = slides.slice(); ns[i] = !on; setSlides(ns); if (run) restart(steps, ns); }} />)}</div>
          <div className="small muted">Sixteen steps at the patch's tempo. The bottom row ties a step into the next: with Mono, Legato and some Glide, that is a slide.</div>
        </section>
        {ctls.includes('eng') && <section className="col" style={{ gap: 8 }}>
          <h3>Sound for the sampler and granular engines</h3>
          <div className="small" role="status">{smp}</div>
          <input ref={file} type="file" accept="audio/*" style={{ display: 'none' }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) useSound(await f.arrayBuffer(), f.name); e.target.value = ''; }} />
          <div className="row wrap"><button className="btn" onClick={() => file.current?.click()}>Import a sound</button><button className="btn" onClick={record}>Record 2 seconds</button><button className="btn" onClick={() => { live.setSample(null); setSmp('The built-in recording'); setP((x) => ({ ...x })); }}>Use the built-in one</button></div>
          <div className="small muted">Your sound plays at its own pitch on middle C. It stays on this device and is forgotten when you close the app.</div>
        </section>}
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
