import { useEffect, useRef, useState } from 'react';
import { useNav } from '../nav';
import { get, set, useS, exportJson, importJson, resetAll } from '../store';
import { ac, click, playNote, audioState } from '../audio';
import { onTap, onNote, emitTap, calibrateGate, micState, startMic, stopMic, initMidi } from '../input';
import { midiName } from '../music';
import { TopBar, InputSwitch, MicBar, MidiBar, Icon } from '../ui/common';

/** Tap along with 8 clicks; stores the median offset for the input that was used. */
export function Latency() {
  const [state, setState] = useState<'idle' | 'run' | 'done'>('idle'), [msg, setMsg] = useState('');
  const R = useRef({ clicks: [] as number[], taps: [] as { t: number; source: string }[] });
  useEffect(() => onTap((e) => { if (state === 'run') R.current.taps.push({ t: e.t, source: e.source }); }), [state]);
  const run = () => {
    const c = ac(), t0 = c.currentTime + 0.3, gap = 0.6, perf0 = performance.now() + 300;
    R.current = { clicks: [], taps: [] };
    for (let i = 0; i < 12; i++) { click(t0 + i * gap, i < 4); if (i >= 4) R.current.clicks.push(perf0 + i * gap * 1000); }
    setState('run'); setMsg('Listen to 4 clicks, then tap along with the next 8.');
    setTimeout(() => {
      const { clicks, taps } = R.current, src = taps[0]?.source ?? 'screen';
      const off = clicks.map((ck) => { const near = taps.filter((t) => t.source === src).map((t) => t.t - ck).sort((a, b) => Math.abs(a) - Math.abs(b))[0]; return near; }).filter((d) => d !== undefined && Math.abs(d) < 280).sort((a, b) => a - b);
      if (off.length < 5) { setMsg('Not enough taps were heard. Try again.'); setState('idle'); return; }
      const med = Math.round(Math.max(-40, Math.min(250, off[Math.floor(off.length / 2)])));
      set((s) => { s.profile.latency[src] = med; }); setMsg(`Saved: ${med} ms for ${src === 'screen' ? 'on-screen taps' : src === 'mic' ? 'the microphone' : 'MIDI'}.`); setState('done');
    }, 300 + 12 * gap * 1000 + 300);
  };
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="small muted">Timing check: tap the pad, press a key, clap (with the microphone on) or play a MIDI key in time with the clicks.</div>
      {state === 'run' ? <button className="tappad" style={{ minHeight: 90 }} onPointerDown={(e) => { e.preventDefault(); emitTap('screen'); }}>Tap with the clicks</button> : <button className="btn" onClick={run}>Start timing check</button>}
      {msg && <div className="small" role="status">{msg}</div>}
    </div>
  );
}
export function SoundTest() {
  const [done, setDone] = useState(false), [, tick] = useState(0);
  useEffect(() => { if (!done) return; const id = setInterval(() => tick((x) => x + 1), 500); return () => clearInterval(id); }, [done]);
  const session = (navigator as any).audioSession?.type;
  return (
    <div className="col" style={{ gap: 6 }}>
      <button className="btn" onClick={() => { [60, 64, 67, 72].forEach((m, i) => playNote(m, ac().currentTime + 0.1 + i * 0.3, 0.5, 'piano', 0.7)); setDone(true); }}><Icon name="playtri" size={14} />Test sound</button>
      {done && <div className="small muted">You should hear four rising notes. If not: turn the volume up; on an iPhone or iPad, flip the ring/silent switch off silent (or turn off Silent Mode in Control Centre); and check no Bluetooth speaker has taken the sound. While the microphone is on, some phones play more quietly or through the earpiece: headphones fix that.</div>}
      {done && <div className="small muted">Status: audio {audioState()}{session ? `, session ${session}` : ''}, microphone {micState.on ? 'on' : 'off'}, volume {Math.round(get().profile.settings.volume * 100)}%.</div>}
    </div>
  );
}
export function InputTest() {
  const [last, setLast] = useState('');
  useEffect(() => onNote((e) => setLast(`${midiName(e.midi)} from ${e.source === 'screen' ? 'the on-screen keyboard' : e.source === 'mic' ? 'the microphone' : 'MIDI'}`)), []);
  return <div className="small" role="status">{last ? `Heard ${last}.` : 'Play or sing any note to test.'}</div>;
}
export function VoiceRange() {
  const s = useS(); const [on, setOn] = useState(false), [left, setLeft] = useState(0);
  const R = useRef<number[]>([]);
  useEffect(() => onNote((e) => { if (on && e.source === 'mic') R.current.push(e.midi); }), [on]);
  useEffect(() => { if (!on) return; if (left <= 0) { const v = R.current; if (v.length >= 2) set((st) => { st.profile.voiceRange = [Math.min(...v), Math.max(...v)]; }); setOn(false); return; } const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id); }, [on, left]);
  const vr = s.profile.voiceRange;
  return <div className="row"><span className="grow small">{on ? `Sing your lowest comfortable note, then your highest… ${left}s` : vr ? `Voice range: ${midiName(vr[0])} to ${midiName(vr[1])}` : 'Voice range not set (optional).'}</span><button className="btn sm" disabled={on} onClick={async () => { if (await startMic()) { R.current = []; setLeft(8); setOn(true); } }}>Set range</button></div>;
}
export function Settings() {
  const s = useS(), nav = useNav(), st = s.profile.settings;
  useEffect(() => () => { if (get().profile.settings.input !== 'mic') stopMic(); }, []); // tests here may have turned the mic on
  const up = (f: (x: typeof st) => void) => set((x) => f(x.profile.settings));
  const [io, setIo] = useState(''), [msg, setMsg] = useState(''), [confirm, setConfirm] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const doExport = () => {
    const json = exportJson(); setIo(json);
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = `learning-music-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setMsg('Export ready. If no file was saved, copy the text below instead.'); } catch { setMsg('Copy the text below and keep it somewhere safe.'); }
  };
  const doImport = (json: string) => { try { importJson(json); setMsg('Progress imported.'); setIo(''); } catch (e: any) { setMsg(e.message || 'That did not look like a Learning Music export.'); } };
  return (
    <><TopBar title="Settings" onBack={nav.back} /><main className="main col">
      <section className="card line col"><h2>Inputs</h2>
        <div className="small muted">Default way to answer. You can switch on any exercise.</div><InputSwitch choice />
        <MicBar /><div className="row"><button className="btn sm" onClick={async () => { if (await startMic()) { setMsg('Stay quiet for a moment…'); const g = await calibrateGate(); set((x) => { x.profile.micGate = g; }); setMsg('Room noise measured.'); } }}>Measure room noise</button>
          <div className="checks"><label><input type="checkbox" checked={st.voiceMode} onChange={(e) => up((x) => { x.voiceMode = e.target.checked; })} />Voice mode: any octave counts</label></div></div>
        <VoiceRange /><MidiBar /><InputTest /><Latency />
        <div className="small muted">Saved timing offsets: on-screen {s.profile.latency.screen} ms, microphone {s.profile.latency.mic} ms, MIDI {s.profile.latency.midi} ms.</div>
      </section>
      <section className="card line col"><h2>Sound</h2>
        <SoundTest />
        <label className="field">Instrument<select value={st.timbre} onChange={(e) => { up((x) => { x.timbre = e.target.value as any; }); playNote(60, undefined, 0.8, e.target.value as any); }}><option value="piano">Piano</option><option value="guitar">Guitar</option><option value="strings">Strings</option><option value="sine">Pure tone</option></select></label>
        <label className="field">Volume<input type="range" min={0} max={1} step={0.05} value={st.volume} onChange={(e) => up((x) => { x.volume = +e.target.value; })} /></label>
        <div className="checks"><label><input type="checkbox" checked={st.sfx} onChange={(e) => up((x) => { x.sfx = e.target.checked; })} />Sound effects for right answers and games</label></div>
        <label className="field">Metronome volume<input type="range" min={0} max={1} step={0.05} value={st.metVolume} onChange={(e) => up((x) => { x.metVolume = +e.target.value; })} /></label>
      </section>
      <section className="card line col"><h2>Notation and display</h2>
        <label className="field">Notation size<input type="range" min={0.8} max={1.6} step={0.1} value={st.notationScale} onChange={(e) => up((x) => { x.notationScale = +e.target.value; })} /></label>
        <label className="field">Note names<select value={st.nameSystem} onChange={(e) => up((x) => { x.nameSystem = e.target.value as any; })}><option value="letters">Letters (C D E)</option><option value="solfege">Solfege (Do Re Mi)</option></select></label>
        <label className="field">Labels on keyboard keys<select value={st.keyLabels} onChange={(e) => up((x) => { x.keyLabels = e.target.value as any; })}><option value="auto">Every key at first, then only the Cs</option><option value="on">Always every key</option><option value="off">Only the C keys</option></select></label>
        <div className="checks"><label><input type="checkbox" checked={st.bigKeys} onChange={(e) => up((x) => { x.bigKeys = e.target.checked; })} />Wide keys (swipe the keyboard sideways)</label><label><input type="checkbox" checked={st.showCursor} onChange={(e) => up((x) => { x.showCursor = e.target.checked; })} />Show the reading cursor</label>
          <label><input type="checkbox" checked={st.theme === 'dark'} onChange={(e) => up((x) => { x.theme = e.target.checked ? 'dark' : 'light'; })} />Dark theme</label>
          <label><input type="checkbox" checked={st.reducedMotion} onChange={(e) => up((x) => { x.reducedMotion = e.target.checked; })} />Reduce motion</label></div>
      </section>
      <section className="card line col"><h2>Daily goals</h2>
        <div className="bold small">Music daily goal</div>
        <div className="seg" role="group" aria-label="Daily goal">{([5, 10, 20] as const).map((g) => <button key={g} aria-pressed={s.profile.dailyGoalMin === g} onClick={() => set((x) => { x.profile.dailyGoalMin = g; })}>{g} min</button>)}</div>
        <div className="bold small">Synth daily goal</div>
        <div className="seg" role="group" aria-label="Synth daily goal">{([5, 10, 20] as const).map((g) => <button key={g} aria-pressed={(s.profile.synthGoalMin ?? 10) === g} onClick={() => set((x) => { x.profile.synthGoalMin = g; })}>{g} min</button>)}</div>
        <div className="small muted">Music and synth each have their own goal. Time counts toward the mode you are in, and meeting either goal keeps your streak.</div>
      </section>
      <section className="card line col"><h2>Your data</h2>
        <div className="small muted">Everything is stored only in this browser. Export a copy now and then, and to move to another device.</div>
        <div className="small muted">Lost your progress and have no export? On the Learn tab, "Skip ahead" lets you start each track at the level you had reached.</div>
        <div className="row wrap"><button className="btn" onClick={doExport}>Export</button><button className="btn" onClick={() => file.current?.click()}>Import a file</button><button className="btn" disabled={!io.trim()} onClick={() => doImport(io)}>Import pasted text</button>
          <button className="btn" disabled={!io} onClick={() => navigator.clipboard?.writeText(io).then(() => setMsg('Copied.'), () => setMsg('Select the text and copy it by hand.'))}>Copy</button></div>
        <input ref={file} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={async (e) => { const f = e.target.files?.[0]; if (f) doImport(await f.text()); e.target.value = ''; }} />
        <textarea aria-label="Exported data, or paste an export here to import" placeholder="Exported data appears here. To import, paste an export and press Import pasted text." value={io} onChange={(e) => setIo(e.target.value)} />
        {msg && <div className="small" role="status">{msg}</div>}
        {!confirm ? <button className="btn" onClick={() => setConfirm(true)}>Reset all progress…</button> : <div className="feedback bad"><div className="txt">Erase all progress on this device?<span>This cannot be undone. Export first if unsure.</span><div className="row" style={{ marginTop: 8 }}><button className="btn sm" onClick={() => setConfirm(false)}>Cancel</button><button className="btn sm" onClick={() => { resetAll(); setConfirm(false); setMsg('Progress erased.'); }}>Erase everything</button></div></div></div>}
      </section>
      <section className="small muted">Learning Music 1.0 · MIT licence · No account, no tracking. Microphone audio is analysed on this device and never recorded or sent anywhere.</section>
    </main></>
  );
}
