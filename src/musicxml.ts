// A small MusicXML reader: pitches, rests, chords, durations, key and time, up to two staves.
import { Passage, PNote, StaffP } from './passage';
import { Pitch, midi } from './music';

const KEYS = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const OK = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25, 6];
export function parseMusicXml(xml: string): Passage {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('This file is not valid XML.');
  const parts = [...doc.querySelectorAll('part')];
  if (!parts.length) throw new Error('No <part> found. Export the score as uncompressed MusicXML (.musicxml or .xml).');
  let key = 'C', time: [number, number] = [4, 4], tempo = 80; const staves: StaffP[] = [];
  const num = (el: Element | null, sel: string, d = 0) => { const t = el?.querySelector(sel)?.textContent; return t ? parseFloat(t) : d; };
  parts.slice(0, 2).forEach((part) => {
    const byStaff: Record<number, PNote[]> = {}; let div = 1;
    part.querySelectorAll('measure').forEach((m) => {
      const attr = m.querySelector('attributes');
      if (attr) {
        div = num(attr, 'divisions', div);
        const f = attr.querySelector('key fifths'); if (f) { const minor = attr.querySelector('key mode')?.textContent === 'minor'; const idx = parseInt(f.textContent || '0', 10) + 7; key = KEYS[idx] ?? 'C'; if (minor) key = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'][idx] + 'm'; }
        const b = attr.querySelector('time beats'), bt = attr.querySelector('time beat-type'); if (b && bt) time = [parseInt(b.textContent || '4', 10), parseInt(bt.textContent || '4', 10)];
      }
      const t = m.querySelector('sound[tempo]'); if (t) tempo = parseFloat(t.getAttribute('tempo') || '80');
      m.querySelectorAll('note').forEach((n) => {
        if (n.querySelector('grace')) return;
        const staff = num(n, 'staff', 1), list = (byStaff[staff] = byStaff[staff] ?? []);
        const raw = num(n, 'duration', div) / div, d = OK.reduce((a, b) => (Math.abs(b - raw) < Math.abs(a - raw) ? b : a), 1);
        if (n.querySelector('rest')) { list.push({ p: [], d: Math.abs(raw - time[0] * 4 / time[1]) < 1e-6 ? raw : d, rest: true }); return; }
        const step = n.querySelector('pitch step')?.textContent ?? 'C';
        const p: Pitch = { l: 'CDEFGAB'.indexOf(step), a: num(n, 'pitch alter', 0), o: num(n, 'pitch octave', 4) };
        const tie = [...n.querySelectorAll('tie')].some((x) => x.getAttribute('type') === 'start');
        if (n.querySelector('chord') && list.length) { const last = list[list.length - 1]; last.p = [...last.p, p].sort((a, b) => midi(a) - midi(b)); }
        else list.push({ p: [p], d, tie: tie || undefined });
      });
    });
    Object.keys(byStaff).map(Number).sort().forEach((sn) => {
      const notes = byStaff[sn], sounding = notes.filter((n) => !n.rest), avg = sounding.reduce((a, n) => a + midi(n.p[0]), 0) / (sounding.length || 1);
      if (staves.length < 2) staves.push({ clef: avg < 57 ? 'bass' : 'treble', notes });
    });
  });
  if (!staves.length || !staves[0].notes.length) throw new Error('No notes found in the file.');
  return { key, time, tempo: Math.round(tempo), staves };
}
