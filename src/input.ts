// One event bus for all three inputs: on-screen keyboard, microphone and MIDI.
import { busyUntil, ac, setMicActive, resetAudio, isIOS } from './audio';
import { CFG } from './config';

export type Source = 'screen' | 'mic' | 'midi';
export interface NoteEv { midi: number; t: number; source: Source; cents?: number }
export interface TapEv { t: number; source: Source }
const noteSubs = new Set<(e: NoteEv) => void>(), tapSubs = new Set<(e: TapEv) => void>();
export const onNote = (cb: (e: NoteEv) => void) => { noteSubs.add(cb); return () => { noteSubs.delete(cb); }; };
export const onTap = (cb: (e: TapEv) => void) => { tapSubs.add(cb); return () => { tapSubs.delete(cb); }; };
export function emitNote(midi: number, source: Source, cents?: number, t = performance.now()) {
  const e = { midi, t, source, cents }; noteSubs.forEach((f) => f(e)); tapSubs.forEach((f) => f({ t, source }));
}
export function emitTap(source: Source, t = performance.now()) { tapSubs.forEach((f) => f({ t, source })); }

// ---------- MIDI ----------
export const midiState = { supported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator, ready: false, devices: [] as string[], error: '' };
const stateSubs = new Set<() => void>();
export const onInputState = (cb: () => void) => { stateSubs.add(cb); return () => { stateSubs.delete(cb); }; };
const bump = () => stateSubs.forEach((f) => f());
export async function initMidi(): Promise<boolean> {
  if (!midiState.supported) { midiState.error = 'This browser does not support Web MIDI.'; bump(); return false; }
  try {
    const access: any = await (navigator as any).requestMIDIAccess();
    const wire = () => {
      midiState.devices = [];
      access.inputs.forEach((inp: any) => {
        midiState.devices.push(inp.name || 'MIDI device');
        inp.onmidimessage = (m: any) => {
          const [st, note, vel] = m.data; const cmd = st & 0xf0;
          if (cmd === 0x90 && vel > 0) emitNote(note, 'midi');
        };
      });
      bump();
    };
    access.onstatechange = wire; wire();
    midiState.ready = true; midiState.error = ''; bump(); return true;
  } catch (e: any) { midiState.error = 'MIDI access was refused or is unavailable here.'; bump(); return false; }
}

// ---------- Microphone ----------
export const micState = { on: false, error: '', note: null as number | null, cents: 0, level: 0, gate: 0.012 };
let micStream: MediaStream | null = null, micTimer: any = null;
/** YIN-style pitch detection. Returns Hz or null. Exported for tests. */
export function detectPitch(buf: Float32Array, sr: number, fmin = 70, fmax = 1200): number | null {
  const n = buf.length, half = Math.floor(n / 2);
  const tauMin = Math.max(2, Math.floor(sr / fmax)), tauMax = Math.min(half - 1, Math.floor(sr / fmin));
  const d = new Float32Array(tauMax + 2);
  for (let tau = 1; tau <= tauMax + 1; tau++) { let s = 0; for (let i = 0; i < half; i++) { const x = buf[i] - buf[i + tau]; s += x * x; } d[tau] = s; }
  let run = 0; const c = new Float32Array(tauMax + 2); c[0] = 1;
  for (let tau = 1; tau <= tauMax + 1; tau++) { run += d[tau]; c[tau] = run ? (d[tau] * tau) / run : 1; }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) if (c[t] < 0.12) { while (t + 1 <= tauMax && c[t + 1] < c[t]) t++; tau = t; break; }
  if (tau < 0) return null;
  const a = c[tau - 1], b = c[tau], cc = c[tau + 1], den = a - 2 * b + cc;
  const shift = den ? (0.5 * (a - cc)) / den : 0;
  return sr / (tau + shift);
}
export async function startMic(): Promise<boolean> {
  if (micState.on) return true;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
    setMicActive(true);
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } as any });
    if (isIOS()) resetAudio();
    const c = ac(), src = c.createMediaStreamSource(micStream), an = c.createAnalyser();
    an.fftSize = 2048; src.connect(an);
    const buf = new Float32Array(an.fftSize);
    let cand = -1, candSince = 0, emitted = -1, lastRms = 0, lastTap = 0, quietSince = 0;
    micTimer = setInterval(() => {
      if (c.state !== 'running') { c.resume().catch(() => {}); return; }
      an.getFloatTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const rms = Math.sqrt(s / buf.length), t = performance.now();
      micState.level = rms;
      if (c.currentTime < busyUntil) { cand = -1; emitted = -1; lastRms = rms; return; }
      // claps / taps: a sharp rise above the gate
      if (rms > micState.gate * 4 && rms > lastRms * 2.2 && t - lastTap > 120) { lastTap = t; emitTap('mic', t - 30); }
      if (rms < micState.gate) {
        if (!quietSince) quietSince = t;
        if (t - quietSince > 60) { cand = -1; emitted = -1; micState.note = null; }
      } else {
        quietSince = 0;
        const hz = detectPitch(buf, c.sampleRate);
        if (hz) {
          const mf = 69 + 12 * Math.log2(hz / 440), m = Math.round(mf), cents = (mf - m) * 100;
          micState.note = m; micState.cents = cents;
          const reattack = rms > lastRms * 2.5 && m === emitted;
          if (m !== cand || reattack) { cand = m; candSince = t; if (reattack) emitted = -1; }
          else if (Math.abs(cents) <= CFG.micCents && t - candSince >= CFG.micStableMs && emitted !== m) { emitted = m; emitNote(m, 'mic', cents, candSince); }
        }
      }
      lastRms = rms; bump();
    }, 25);
    micState.on = true; micState.error = ''; bump(); return true;
  } catch (e: any) {
    setMicActive(false);
    micState.error = e?.name === 'NotAllowedError' ? 'Microphone permission was refused. Allow it in your browser\'s site settings, then try again.' : e?.name === 'NotFoundError' ? 'No microphone was found on this device.' : 'The microphone is not available here (blocked by this page or browser).';
    micState.on = false; bump(); return false;
  }
}
export function stopMic() {
  if (micTimer) clearInterval(micTimer); micTimer = null;
  const was = micState.on || !!micStream;
  micStream?.getTracks().forEach((t) => t.stop()); micStream = null; micState.on = false; micState.note = null; micState.level = 0;
  setMicActive(false);
  if (was && isIOS()) resetAudio(); // back to the normal speaker route
  bump();
}
// A page in the background should not keep listening.
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden && micState.on) stopMic(); });
/** Sample room noise for a moment and set the gate just above it. */
export async function calibrateGate(ms = 1500): Promise<number> {
  const t0 = performance.now(); let peak = 0;
  await new Promise<void>((res) => { const id = setInterval(() => { peak = Math.max(peak, micState.level); if (performance.now() - t0 > ms) { clearInterval(id); res(); } }, 25); });
  micState.gate = Math.min(0.08, Math.max(0.008, peak * 2.2)); return micState.gate;
}
