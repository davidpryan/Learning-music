// Passage -> engraved SVG via VexFlow.
import { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam, StaveConnector, Dot, StaveTie, Annotation, Fraction } from 'vexflow';
import { Passage, PNote, barLen, measures, describe } from './passage';
import { key, vfKey, midi } from './music';

export interface ScoreSpec { passage: Passage; colors?: Record<string, string>; showTime?: boolean; perLine?: number }
export interface Box { x: number; y: number; w: number; h: number }

const DUR: [number, string, number][] = [[4, 'w', 0], [3, 'h', 1], [2, 'h', 0], [1.5, 'q', 1], [1, 'q', 0], [0.75, '8', 1], [0.5, '8', 0], [0.25, '16', 0], [6, 'w', 1]];
const vfDur = (d: number) => DUR.find((x) => Math.abs(x[0] - d) < 1e-6) ?? DUR[4];

export function drawScore(el: HTMLElement, spec: ScoreSpec, scale = 1): Box[] {
  el.innerHTML = '';
  const ps = spec.passage, k = key(ps.key), nS = ps.staves.length;
  const W = Math.max(260, (el.clientWidth || 340)) / scale;
  const len = ps.free ? 1e9 : barLen(ps.time);
  const ms = ps.staves.map((st) => measures(st.notes, len));
  const nM = Math.max(...ms.map((m) => m.length));
  const perLine = ps.free ? 1 : spec.perLine ?? (W < 520 ? 2 : 4);
  const lines = Math.ceil(nM / perLine);
  const staffGap = 92, sysH = nS * staffGap + 28;
  const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(W * scale, (lines * sysH + 14) * scale);
  const ctx = renderer.getContext(); ctx.scale(scale, scale);
  const showTime = spec.showTime ?? !ps.free;
  const boxes: Box[] = [];
  const beamGroups = ps.time[1] === 8 ? [new Fraction(3, 8)] : undefined;

  for (let line = 0; line < lines; line++) {
    const first = line * perLine, count = Math.min(perLine, nM - first);
    const extra = 38 + Math.abs(k.acc) * 11 + (line === 0 && showTime ? 26 : 0);
    let mw = (W - 12 - extra) / (lines > 1 ? perLine : count);
    let x = 6;
    if (ps.free) {
      const n = ps.staves[0].notes.length;
      const want = Math.min(W - 12, extra + 46 + n * 52);
      mw = want - extra; x = (W - want) / 2;
    }
    const y0 = 8 + line * sysH;
    for (let m = first; m < first + count; m++) {
      const w = mw + (m === first ? extra : 0);
      const staves: Stave[] = [], voices: Voice[] = [], drawLater: (() => void)[] = [];
      for (let s = 0; s < nS; s++) {
        const st = ps.staves[s];
        const stave = new Stave(x, y0 + s * staffGap, w);
        if (m === first) {
          stave.addClef(st.clef);
          if (k.acc !== 0 && st.clef !== 'percussion') stave.addKeySignature(ps.key);
          if (line === 0 && showTime) stave.addTimeSignature(`${ps.time[0]}/${ps.time[1]}`);
        }
        if (m === nM - 1 && !ps.free) stave.setEndBarType(3 /* END */);
        stave.setContext(ctx).draw();
        staves.push(stave);
        const cells = ms[s][m] ?? [];
        if (!cells.length) continue;
        const notes = cells.map(({ n, i }) => {
          const [, dur, dots] = vfDur(n.d);
          const perc = st.clef === 'percussion';
          const sn = new StaveNote({
            clef: perc ? 'treble' : st.clef,
            keys: n.rest ? [st.clef === 'bass' ? 'd/3' : 'b/4'] : perc ? ['b/4'] : [...n.p].sort((a, b) => midi(a) - midi(b)).map(vfKey),
            duration: dur + (dots ? 'd' : '') + (n.rest ? 'r' : ''),
            auto_stem: !perc, ...(perc ? { stem_direction: 1 } : {}),
          });
          if (dots) Dot.buildAndAttach([sn], { all: true });
          if (n.sym) sn.addModifier(new Annotation(n.sym).setFont('Arial', 12, 'bold').setVerticalJustification(Annotation.VerticalJustify.TOP));
          const c = spec.colors?.[`${s}:${i}`];
          if (c) sn.setStyle({ fillStyle: c, strokeStyle: c });
          return { sn, n };
        });
        const voice = new Voice({ num_beats: ps.time[0], beat_value: ps.time[1] }).setStrict(false);
        voice.addTickables(notes.map((x) => x.sn));
        if (st.clef !== 'percussion') Accidental.applyAccidentals([voice], ps.key);
        voices.push(voice);
        const beams = Beam.generateBeams(notes.map((x) => x.sn), beamGroups ? { groups: beamGroups } : undefined);
        drawLater.push(() => {
          voice.draw(ctx, stave);
          beams.forEach((b) => b.setContext(ctx).draw());
          notes.forEach((x, j) => {
            if (x.n.tie && notes[j + 1] && !notes[j + 1].n.rest)
              new StaveTie({ first_note: x.sn, last_note: notes[j + 1].sn, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
          });
        });
      }
      if (nS > 1) {
        const sx = Math.max(...staves.map((s) => s.getNoteStartX()));
        staves.forEach((s) => s.setNoteStartX(sx));
        if (m === first) new StaveConnector(staves[0], staves[nS - 1]).setType('brace').setContext(ctx).draw();
        new StaveConnector(staves[0], staves[nS - 1]).setType(m === first ? 'singleLeft' : 'singleLeft').setContext(ctx).draw();
        new StaveConnector(staves[0], staves[nS - 1]).setType('singleRight').setContext(ctx).draw();
      }
      if (voices.length) {
        const f = new Formatter();
        voices.forEach((v) => f.joinVoices([v]));
        f.format(voices, Math.max(40, staves[0].getNoteEndX() - staves[0].getNoteStartX() - 12));
        drawLater.forEach((d) => d());
      }
      boxes.push({ x: x * scale, y: (y0 + 30) * scale, w: w * scale, h: (nS * staffGap - 10) * scale });
      x += w;
    }
  }
  return boxes;
}

/** A bare full-width stave (used by Staff Runner). Top line is at y = 48, lines are 10 px apart. */
export function drawStave(el: HTMLElement, clef: 'treble' | 'bass', width: number, height = 150) {
  el.innerHTML = '';
  const r = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG); r.resize(width, height);
  const ctx = r.getContext(); new Stave(4, 8, width - 8).addClef(clef).setContext(ctx).draw();
}

/** Engraved passage. `cursor` highlights one measure (the reading cursor). */
export function Score({ spec, cursor, scale = 1 }: { spec: ScoreSpec; cursor?: number | null; scale?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [err, setErr] = useState(false);
  const sig = JSON.stringify(spec);
  useEffect(() => {
    const el = ref.current!; let lastW = -1;
    const draw = () => {
      if (el.clientWidth === lastW) return; lastW = el.clientWidth;
      try { setBoxes(drawScore(el, spec, scale)); setErr(false); } catch (e) { console.error('notation', e); setErr(true); }
    };
    draw();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [sig, scale]);
  const b = cursor != null ? boxes[cursor] : null;
  return (
    <div className="score" role="img" aria-label={'Music notation. ' + describe(spec.passage)}>
      {b && <div className="score-cursor" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />}
      <div ref={ref} className="score-svg" />
      {err && <div className="muted small">Notation could not be drawn. {describe(spec.passage)}</div>}
    </div>
  );
}
export type { PNote };
