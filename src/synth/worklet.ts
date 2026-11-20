// Runs the engine on the audio thread.
import { Engine, setUserSample } from './dsp';
declare const sampleRate: number;
declare class AudioWorkletProcessor { port: MessagePort; constructor(); }
declare function registerProcessor(name: string, ctor: any): void;
class SynthProcessor extends AudioWorkletProcessor {
  e = new Engine(sampleRate);
  constructor() {
    super();
    this.port.onmessage = (m: MessageEvent) => {
      const d = m.data, e = this.e;
      if (d.stop) e.allOff(d.stop === 2); // first, so a new phrase in the same message is not cancelled
      if ('sample' in d) setUserSample(d.sample);
      if (d.patch) e.setPatch(d.patch);
      if (d.seq) e.setSeq(d.seq, d.loop ?? 0);
      if (d.on != null) e.noteOn(d.on, d.vel ?? 0.8);
      if (d.off != null) e.noteOff(d.off);
      if (d.bend != null) e.bendV = d.bend; if (d.wheel != null) e.wheel = d.wheel; if (d.after != null) e.after = d.after;
    };
  }
  process(_in: Float32Array[][], out: Float32Array[][]) { const o = out[0]; this.e.render(o[0], o[1] ?? o[0], o[0].length); return true; }
}
registerProcessor('lm-synth', SynthProcessor);
