import { useRef, useState } from 'react';
import { EX_LIST, ExDef, exParams } from '../exercises';
import { useNav } from '../nav';
import { set, useS } from '../store';
import { modeTracks, TRACK_NAME } from '../content';
import { Sheet, TopBar, Icon } from '../ui/common';
import { parseMusicXml } from '../musicxml';

const PERF = ['R1', 'R2', 'R3', 'R4', 'R5', 'E6', 'S5', 'S6', 'S7', 'S10', 'S12', 'S15'];
export function ParamForm({ ex, value, onChange }: { ex: ExDef; value: Record<string, any>; onChange: (v: Record<string, any>) => void }) {
  const up = (k: string, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="col">
      {ex.params.map((p) => {
        const v = value[p.key];
        if (p.type === 'bool') return <div key={p.key} className="checks"><label><input type="checkbox" checked={!!v} onChange={(e) => up(p.key, e.target.checked)} />{p.label}</label></div>;
        if (p.type === 'num') return <label key={p.key} className="field">{p.label}<input type="number" min={p.min} max={p.max} step={p.step} value={v} onChange={(e) => up(p.key, Math.max(p.min ?? -1e9, Math.min(p.max ?? 1e9, +e.target.value || 0)))} /></label>;
        if (p.type === 'select') return <label key={p.key} className="field">{p.label}<select value={String(v)} onChange={(e) => { const o = p.options!.find((x) => String(x[0]) === e.target.value)!; up(p.key, o[0]); }}>{p.options!.map((o) => <option key={String(o[0])} value={String(o[0])}>{o[1]}</option>)}</select></label>;
        const arr: any[] = Array.isArray(v) ? v : [];
        return (
          <fieldset key={p.key} style={{ border: 0, padding: 0, margin: 0 }}><legend className="bold small" style={{ marginBottom: 5 }}>{p.label}</legend>
            <div className="checks">{p.options!.map((o) => <label key={String(o[0])}><input type="checkbox" checked={arr.includes(o[0])} onChange={(e) => { const nx = e.target.checked ? [...arr, o[0]] : arr.filter((x) => x !== o[0]); if (nx.length) up(p.key, nx); }} />{o[1]}</label>)}</div>
          </fieldset>
        );
      })}
    </div>
  );
}
export function Practice() {
  const s = useS(), nav = useNav();
  const [open, setOpen] = useState<ExDef | null>(null), [params, setParams] = useState<Record<string, any>>({}), [name, setName] = useState(''), [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null), synth = s.profile.mode === 'synth', TRACKS = modeTracks(s.profile.mode);
  const pick = (ex: ExDef) => { setParams(exParams(ex.id)); setOpen(ex); setName(''); };
  const start = (kind: 'drill' | 'challenge' | 'timed') => {
    const ex = open!; setOpen(null);
    const perf = PERF.includes(ex.id);
    if (kind === 'timed') nav.go({ n: 'timed', title: ex.name, ex: ex.id, preset: params, highKey: 'timed:' + ex.id });
    else nav.go({ n: 'run', title: ex.name, sub: kind === 'challenge' ? 'Challenge: 20 questions' : 'Free practice', items: [{ ex: ex.id, preset: params }], count: kind === 'challenge' ? (perf ? 5 : 20) : perf ? 3 : 10, ctx: 'practice', highKey: kind === 'challenge' ? 'challenge:' + ex.id : undefined });
  };
  const importXml = async (f: File) => {
    try { const p = parseMusicXml(await f.text()); const id = 'user-' + Date.now(); set((st) => { st.userPieces.push({ id, title: f.name.replace(/\.(musicxml|xml)$/i, ''), xml: JSON.stringify(p) }); }); setMsg(`Imported "${f.name}".`); }
    catch (e: any) { setMsg(e.message || 'Could not read that file.'); }
  };
  return (
    <>
      <TopBar title="Practice" sub={synth ? '14 synth exercises, free practice' : 'All 27 exercises, fully adjustable'} />
      <main className="main col">
        {!synth && <section>
          <div className="level-h">Reference</div>
          <div className="grid2">
            <button className="card tap" onClick={() => nav.go({ n: 'sheets' })}><Icon name="list" /><span className="grow"><b>Cheat sheets</b><br /><span className="small muted">Look it up</span></span></button>
            <button className="card tap" onClick={() => nav.go({ n: 'cards' })}><Icon name="star" /><span className="grow"><b>Flash cards</b><br /><span className="small muted">Memorise it</span></span></button>
          </div>
        </section>}
        {TRACKS.map((t) => (
          <section key={t}>
            <div className="level-h">{t === 'theory' ? 'Theory and recognition' : TRACK_NAME[t]}</div>
            {EX_LIST.filter((e) => e.track === t).map((e) => <button key={e.id} className="node" onClick={() => pick(e)}><span className="ico">{e.id}</span><span className="grow"><b>{e.name}</b><br /><span className="small muted">{e.blurb}</span></span></button>)}
          </section>
        ))}
        {synth && <button className="card tap" onClick={() => nav.go({ n: 'sandbox' })}><Icon name="keys" /><span className="grow"><span className="small muted">Free play</span><br /><b>Open the synth</b></span><Icon name="playtri" size={14} /></button>}
        {!synth && <section>
          <div className="level-h">Your own pieces</div>
          <p className="small muted">Import an uncompressed MusicXML file (.musicxml or .xml) to read it at tempo. It stays on this device.</p>
          <input ref={file} type="file" accept=".musicxml,.xml,application/xml,text/xml" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importXml(f); e.target.value = ''; }} />
          <button className="btn" onClick={() => file.current?.click()}>Import MusicXML</button>
          {msg && <div className="small" role="status" style={{ marginTop: 6 }}>{msg}</div>}
          {s.userPieces.map((u) => <div key={u.id} className="row card line" style={{ padding: 10, marginTop: 6 }}><b className="grow">{u.title}</b><button className="btn sm" onClick={() => nav.go({ n: 'run', title: u.title, sub: 'Your piece', items: [{ ex: 'R4', preset: { piece: u.id } }], count: 1, ctx: 'practice' })}>Play</button><button className="iconbtn" aria-label={`Delete ${u.title}`} onClick={() => set((st) => { st.userPieces = st.userPieces.filter((x) => x.id !== u.id); })}><Icon name="x" size={18} /></button></div>)}
        </section>}
      </main>
      {open && (
        <Sheet title={open.name} onClose={() => setOpen(null)}>
          <div className="col">
            <p className="muted small">{open.blurb}</p>
            <ParamForm ex={open} value={params} onChange={setParams} />
            {(s.presets[open.id] ?? []).length > 0 && <div><h3>Saved presets</h3><div className="row wrap">{(s.presets[open.id] ?? []).map((pr, i) => <span key={i} className="row" style={{ gap: 0 }}><button className="btn sm" onClick={() => setParams({ ...exParams(open.id), ...pr.params })}>{pr.name}</button><button className="iconbtn" aria-label={`Delete preset ${pr.name}`} onClick={() => set((st) => { st.presets[open.id].splice(i, 1); })}><Icon name="x" size={16} /></button></span>)}</div></div>}
            <div className="row"><input type="text" placeholder="Preset name" aria-label="Preset name" value={name} onChange={(e) => setName(e.target.value)} /><button className="btn" disabled={!name.trim()} onClick={() => { set((st) => { (st.presets[open.id] = st.presets[open.id] ?? []).push({ name: name.trim(), params }); }); setName(''); }}>Save</button></div>
            <button className="btn primary big" onClick={() => start('drill')}>Start</button>
            <div className="row"><button className="btn grow" onClick={() => start('challenge')}>Challenge{s.highs['challenge:' + open.id] != null ? ` · best ${s.highs['challenge:' + open.id]}` : ''}</button>
              {!PERF.includes(open.id) && <button className="btn grow" onClick={() => start('timed')}>60 seconds{s.highs['timed:' + open.id] != null ? ` · best ${s.highs['timed:' + open.id]}` : ''}</button>}</div>
          </div>
        </Sheet>
      )}
    </>
  );
}
