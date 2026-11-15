// The shared music model: a Passage feeds notation, audio and grading.
import { Pitch, P, midi } from './music';

export interface PNote { p: Pitch[]; d: number; rest?: boolean; tie?: boolean; sym?: string } // d in quarter-note beats
export interface StaffP { clef: 'treble' | 'bass' | 'percussion'; notes: PNote[] }
export interface Passage { key: string; time: [number, number]; tempo: number; staves: StaffP[]; free?: boolean; title?: string; harm?: number[][] }

export const barLen = (t: [number, number]) => (t[0] * 4) / t[1];

/** Compact text notation: `C4 D4/2 r/1 [C4 E4 G4]/2 E4/1.5~ E4/0.5:Am`. Default length 1 beat; `|` is ignored. */
export function parseNotes(text: string): PNote[] {
  const out: PNote[] = [];
  const re = /(?:\[([^\]]+)\]|(r|[A-G](?:##|#|bb|b)?-?\d))(?:\/([\d.]+))?(~)?(?::(\S+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const d = m[3] ? parseFloat(m[3]) : 1;
    if (m[2] === 'r') out.push({ p: [], d, rest: true });
    else {
      const p = (m[1] ? m[1].trim().split(/\s+/) : [m[2]]).map(P).sort((a, b) => midi(a) - midi(b));
      out.push({ p, d, tie: !!m[4] || undefined, sym: m[5] });
    }
  }
  return out;
}
export function mk(text: string, o: Partial<Passage> & { clef?: StaffP['clef']; bass?: string } = {}): Passage {
  const staves: StaffP[] = [{ clef: o.clef ?? 'treble', notes: parseNotes(text) }];
  if (o.bass) staves.push({ clef: 'bass', notes: parseNotes(o.bass) });
  return { key: o.key ?? 'C', time: o.time ?? [4, 4], tempo: o.tempo ?? 80, staves, free: o.free, title: o.title };
}
export const totalBeats = (notes: PNote[]) => notes.reduce((s, n) => s + n.d, 0);

export interface Onset { t: number; midis: number[]; d: number; staff: number; i: number }
/** Sounding onsets in beats. Tied continuations and rests produce none. */
export function onsets(p: Passage): Onset[] {
  const out: Onset[] = [];
  p.staves.forEach((st, s) => {
    let t = 0, tied = false;
    st.notes.forEach((n, i) => {
      if (!n.rest && !tied) {
        let d = n.d; // extend through ties
        for (let j = i; st.notes[j]?.tie && st.notes[j + 1]; j++) d += st.notes[j + 1].d;
        out.push({ t, midis: n.p.map(midi), d, staff: s, i });
      }
      tied = !!n.tie && !n.rest; t += n.d;
    });
  });
  return out.sort((a, b) => a.t - b.t || a.staff - b.staff);
}
/** Split one staff into measures, keeping each note's original index. */
export function measures(notes: PNote[], len: number): { n: PNote; i: number }[][] {
  const out: { n: PNote; i: number }[][] = [[]]; let t = 0;
  notes.forEach((n, i) => {
    if (t >= len - 1e-6) { out.push([]); t = 0; }
    out[out.length - 1].push({ n, i }); t += n.d;
  });
  return out;
}
export function describe(p: Passage): string {
  return p.staves.map((st) => `${st.clef} staff: ` + st.notes.map((n) => (n.rest ? 'rest' : n.p.map((x) => 'CDEFGAB'[x.l] + (x.a > 0 ? ' sharp' : x.a < 0 ? ' flat' : '') + x.o).join(' and '))).join(', ')).join('. ');
}
