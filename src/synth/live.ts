// Main-thread handle on the synth: loads the worklet once and plays patches through the app's audio output.
// Where worklets are unavailable it falls back to rendering each phrase ahead of time.
import workletUrl from './worklet.ts?worker&url';
import { ac, synthOut, stopHooks } from '../audio';
import { Patch, SeqNote, mkPatch, renderOffline } from './dsp';

let node: AudioWorkletNode | null = null, loading: Promise<void> | null = null, failed = false, timers: any[] = [], src: AudioBufferSourceNode | null = null, analyser: AnalyserNode | null = null;
let last: { patch: Patch; seq: SeqNote[]; loop: number } | null = null, rerender: any = null, cur: Patch = mkPatch();
function ensure(): Promise<void> {
  if (node || failed) return Promise.resolve();
  if (!loading) {
    const ctx = ac();
    loading = (ctx.audioWorklet ? ctx.audioWorklet.addModule(workletUrl) : Promise.reject(new Error('no worklet')))
      .then(() => { node = new AudioWorkletNode(ctx, 'lm-synth', { numberOfInputs: 0, outputChannelCount: [2] }); node.connect(out()); })
      .catch((e) => { console.warn('Synth falls back to pre-rendered audio:', e); failed = true; });
  }
  return loading;
}
function out(): AudioNode { if (!analyser) { analyser = ac().createAnalyser(); analyser.fftSize = 2048; analyser.connect(synthOut()); } return analyser; }
const post = (m: any) => { ensure().then(() => node?.port.postMessage(m)); };
function bufferPlay(patch: Patch, seq: SeqNote[], loop: number) {
  try { src?.stop(); } catch { /* ended */ }
  const ctx = ac(), end = Math.max(...seq.map((s) => s.t + s.d)), secs = loop || end + Math.min(3, patch.ar + patch.dly * 2 + patch.rev * 2 + 0.3), data = renderOffline(patch, seq, secs, ctx.sampleRate);
  const buf = ctx.createBuffer(1, data.length, ctx.sampleRate); buf.getChannelData(0).set(data);
  src = ctx.createBufferSource(); src.buffer = buf; src.loop = loop > 0; src.connect(out()); src.start();
}
function start(p: Patch, seq: SeqNote[], loop: number) {
  last = { patch: p, seq, loop }; cur = p;
  ensure().then(() => { if (last?.patch !== p) return; if (node) node.port.postMessage({ stop: 1, patch: p, seq, loop }); else bufferPlay(p, seq, loop); });
}
/** Play a patch over a phrase. Returns the phrase length in seconds. */
export function play(patch: Patch, seq: SeqNote[], loop = 0): number {
  clearTimers(); start(mkPatch(patch), seq, loop);
  return loop || Math.max(...seq.map((s) => s.t + s.d)) + 0.3;
}
/** Play several patches one after another over the same phrase, with a short gap. Returns the total length. */
export function playSeries(patches: Patch[], seq: SeqNote[], gap = 0.45): number {
  clearTimers(); const one = Math.max(...seq.map((s) => s.t + s.d)) + gap;
  play(patches[0], seq);
  patches.slice(1).forEach((p, i) => timers.push(setTimeout(() => start(mkPatch(p), seq, 0), (i + 1) * one * 1000)));
  return patches.length * one;
}
/** Change the sounding patch without restarting the phrase. */
export function setPatch(patch: Patch) {
  const p = mkPatch(patch); if (last) last.patch = p; cur = p;
  if (node) node.port.postMessage({ patch: p });
  else if (failed && last && src) { clearTimeout(rerender); rerender = setTimeout(() => last && bufferPlay(last.patch, last.seq, last.loop), 90); }
  else post({ patch: p });
}
export const noteOn = (note: number, vel = 0.8) => { ensure().then(() => { if (node) node.port.postMessage({ patch: cur, on: note, vel }); else bufferPlay(cur, [{ t: 0, d: 0.6, note, vel }], 0); }); };
export const noteOff = (note: number) => post({ off: note });
export const perform = (m: { bend?: number; wheel?: number; after?: number }) => post(m);
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
export function stop() { clearTimers(); last = null; node?.port.postMessage({ stop: 1, seq: [] }); try { src?.stop(); } catch { /* ended */ } src = null; }
export const liveAnalyser = () => (out(), analyser!);
export const usingFallback = () => failed;
stopHooks.push(stop);
