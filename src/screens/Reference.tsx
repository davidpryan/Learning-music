// Two reference sections: cheat sheets to look things up, and flash cards to memorise them.
import { useMemo, useState } from 'react';
import { useNav } from '../nav';
import { P, Pitch, midi, pname, pretty, key as mkKey, keyLabel, keyScale, SCALES, scale, QUAL, IVS, ivLong, addInterval, chordTones, allKeys, mulberry, shuffle } from '../music';
import { mk, Passage } from '../passage';
import { Score } from '../notation';
import { playSeq, stopAll } from '../audio';
import { get, set, useS } from '../store';
import { Keyboard, KeyMark } from '../ui/Keyboard';
import { TopBar, Icon, Bar } from '../ui/common';

const freeP = (text: string, o: Partial<Passage> & { clef?: 'treble' | 'bass' } = {}): Passage => ({ ...mk(text, o), free: true });
const names = (ps: Pitch[]) => ps.map((p) => pretty(pname(p))).join('  ');
const hear = (ms: number[], together = false) => { stopAll(); try { playSeq(together ? [{ t: 0, d: 2, midis: ms }] : ms.map((m, i) => ({ t: i * 0.5, d: 0.5, midis: [m] })), 60, get().profile.settings.timbre, 0.05, false); } catch { /* no audio yet */ } };
/** Notes of a scale as MIDI numbers rising from the tonic near middle C. */
const up = (ps: Pitch[]) => { const out: number[] = []; let last = -1; for (const p of ps) { let m = midi({ ...p, o: 4 }); while (m <= last) m += 12; out.push(m); last = m; } return out; };

// ---------- shared facts (the cheat sheets and the flash cards read the same tables) ----------
export const LENGTHS: { name: string; beats: number; code: string; count: string }[] = [
  { name: 'Whole note', beats: 4, code: '4', count: '1 2 3 4' }, { name: 'Dotted half note', beats: 3, code: '3', count: '1 2 3' },
  { name: 'Half note', beats: 2, code: '2', count: '1 2' }, { name: 'Dotted quarter note', beats: 1.5, code: '1.5', count: '1 (and) 2' },
  { name: 'Quarter note', beats: 1, code: '1', count: '1' }, { name: 'Eighth note', beats: 0.5, code: '0.5', count: 'two fit in one beat: 1 and' },
  { name: 'Sixteenth note', beats: 0.25, code: '0.25', count: 'four fit in one beat: 1 e and a' },
];
const beatsText = (b: number) => (b === 0.5 ? 'half a beat' : b === 0.25 ? 'a quarter of a beat' : b === 1 ? '1 beat' : `${b === 1.5 ? '1½' : b} beats`);
const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], BLACKS: [number, string, string][] = [[61, 'C#', 'Db'], [63, 'D#', 'Eb'], [66, 'F#', 'Gb'], [68, 'G#', 'Ab'], [70, 'A#', 'Bb']];
const WHITE_TIP: Record<string, string> = { C: 'just left of the two black keys', D: 'between the two black keys', E: 'just right of the two black keys', F: 'just left of the three black keys', G: 'between the first two of the three black keys', A: 'between the last two of the three black keys', B: 'just right of the three black keys' };
const MAJ = allKeys(false), MIN = allKeys(true);
const sig = (name: string) => { const a = mkKey(name).acc; return a === 0 ? 'no sharps or flats' : `${Math.abs(a)} ${a > 0 ? 'sharp' : 'flat'}${Math.abs(a) > 1 ? 's' : ''}`; };
const SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const sigNotes = (name: string) => { const a = mkKey(name).acc; return (a > 0 ? SHARPS.slice(0, a).map((x) => x + '♯') : [...SHARPS].reverse().slice(0, -a).map((x) => x + '♭')).join(' '); };
const relMinor = (major: string) => pname(addInterval(mkKey(major).tonic, -2, -3)) + 'm';
const STEP_PATTERN: Record<string, string> = { major: 'W W H W W W H', minor: 'W H W W H W W', harmonic: 'W H W W H W+H H', melodic: 'W H W W W W H (going up)' };
const ROOTS12 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const IV_LIST = ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
const FORMULA: Record<string, string> = { maj: '1 3 5', min: '1 ♭3 5', dim: '1 ♭3 ♭5', aug: '1 3 ♯5', maj7: '1 3 5 7', dom7: '1 3 5 ♭7', min7: '1 ♭3 5 ♭7', hdim7: '1 ♭3 ♭5 ♭7', dim7: '1 ♭3 ♭5 𝄫7' };
const TREBLE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'], BASS = ['E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];

// ---------- cheat sheets ----------
function Row({ left, title, sub, onPlay, stack }: { left?: JSX.Element; title: string; sub?: string; onPlay?: () => void; stack?: boolean }) {
  return <div className={'sheet-row' + (stack ? ' stack' : '')}>{left && <div className="sheet-fig">{left}</div>}<div className="grow"><b>{title}</b>{sub && <><br /><span className="small muted">{sub}</span></>}</div>{onPlay && <button className="iconbtn" aria-label={`Hear ${title}`} onClick={onPlay}><Icon name="playtri" size={16} /></button>}</div>;
}
function LengthSheet() {
  return (
    <div className="col">
      <p className="muted small">Lengths are counted in beats. In 4/4, 3/4 and 2/4 the quarter note gets one beat. Each note has a rest of the same length, shown beside it.</p>
      {LENGTHS.map((l) => <Row key={l.name} left={<Score spec={{ passage: freeP(`B4/${l.code} r/${l.code}`) }} />} title={`${l.name} · ${beatsText(l.beats)}`} sub={`Count: ${l.count}`} />)}
      <div className="card line small"><b>Dots and ties</b><br />A dot adds half of the note's own length: a dotted half is 2 + 1 = 3 beats. A tie joins two notes of the same pitch into one longer sound.</div>
      <div className="card line small"><b>Time signatures</b><br />The top number is how many beats are in each bar; the bottom number is which note gets the beat (4 = quarter, 8 = eighth).<br />2/4: two quarter-note beats · 3/4: three · 4/4: four · 6/8: six eighth notes, felt as two groups of three.</div>
    </div>
  );
}
function KeysSheet() {
  return (
    <div className="col">
      <p className="muted small">The black keys come in groups of two and three. That pattern repeats, and it is how you find every note. Tap a key to hear it.</p>
      <Keyboard lo={60} hi={72} labels />
      {WHITE.map((w) => <Row key={w} title={w} sub={`White key ${WHITE_TIP[w]}`} onPlay={() => hear([midi(P(w + '4'))])} />)}
      {BLACKS.map(([m, s, f]) => <Row key={m} title={`${pretty(s)} or ${pretty(f)}`} sub={`Black key between ${s[0]} and ${f[0]}: a half step above ${s[0]}, a half step below ${f[0]}`} onPlay={() => hear([m])} />)}
      <div className="card line small"><b>Half steps and whole steps</b><br />A half step is the very next key, black or white. A whole step skips one key. E to F and B to C are half steps with no black key between.<br /><b>Middle C</b> (C4) is the C nearest the middle of a piano. Each C starts a new octave number.</div>
    </div>
  );
}
function StaffSheet() {
  return (
    <div className="col">
      <p className="muted small">Notes sit on lines or in spaces. Higher on the staff means higher in pitch, and the letters run A to G and then start again.</p>
      <b>Treble clef (right hand)</b>
      <Row stack left={<Score spec={{ passage: freeP('E4/4 G4/4 B4/4 D5/4 F5/4') }} />} title="Lines: E G B D F" sub="Every Good Boy Does Fine" />
      <Row stack left={<Score spec={{ passage: freeP('F4/4 A4/4 C5/4 E5/4') }} />} title="Spaces: F A C E" sub="They spell FACE" />
      <b>Bass clef (left hand)</b>
      <Row stack left={<Score spec={{ passage: freeP('G2/4 B2/4 D3/4 F3/4 A3/4', { clef: 'bass' }) }} />} title="Lines: G B D F A" sub="Good Boys Do Fine Always" />
      <Row stack left={<Score spec={{ passage: freeP('A2/4 C3/4 E3/4 G3/4', { clef: 'bass' }) }} />} title="Spaces: A C E G" sub="All Cows Eat Grass" />
      <b>Middle C</b>
      <Row stack left={<Score spec={{ passage: freeP('C4/4') }} />} title="One ledger line below the treble staff" sub="The same key as the note one ledger line above the bass staff" />
      <div className="card line small"><b>Landmarks</b><br />The treble clef curls around the G line (G4). The two dots of the bass clef sit either side of the F line (F3). Find those and count up or down by step.</div>
    </div>
  );
}
function ScaleSheet() {
  const [type, setType] = useState('major');
  const tonics = type === 'major' ? MAJ : ['minor', 'harmonic', 'melodic'].includes(type) ? MIN.map((m) => m.replace(/m$/, '')) : ROOTS12;
  const keyed = type === 'major' || type === 'minor';
  return (
    <div className="col">
      <label className="field">Scale type<select value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(SCALES).map(([id, s]) => <option key={id} value={id}>{s.name}</option>)}</select></label>
      {STEP_PATTERN[type] && <div className="card line small"><b>Pattern of steps</b>: {STEP_PATTERN[type]}<br />W is a whole step, H is a half step.</div>}
      {tonics.map((t) => { const ps = scale(P(t + '4'), type); return <Row key={t} title={`${pretty(t)} ${SCALES[type].name.toLowerCase()}: ${names(ps)}`} sub={keyed ? `Key signature: ${sig(type === 'minor' ? t + 'm' : t)}${sigNotes(type === 'minor' ? t + 'm' : t) ? ' (' + sigNotes(type === 'minor' ? t + 'm' : t) + ')' : ''}` : undefined} onPlay={() => { const ms = up(ps); hear([...ms, ms[0] + 12]); }} />; })}
    </div>
  );
}
function SigSheet() {
  return (
    <div className="col">
      <div className="card line small"><b>Order of sharps</b>: F C G D A E B<br /><b>Order of flats</b>: B E A D G C F (the same letters backwards)<br />Sharp keys: the major key is a half step above the last sharp. Flat keys: the major key is the second-to-last flat (one flat is F major).</div>
      {MAJ.map((k) => <Row key={k} left={<Score spec={{ passage: mk('r/4', { key: k }), showTime: false }} />} title={`${keyLabel(k)} · ${keyLabel(relMinor(k))}`} sub={`${sig(k)}${sigNotes(k) ? ': ' + sigNotes(k) : ''}`} />)}
    </div>
  );
}
function IntervalSheet() {
  return (
    <div className="col">
      <p className="muted small">An interval is the distance between two notes. Count letter names for the number (C to E is a 3rd) and half steps for the quality.</p>
      {IV_LIST.map((n) => { const [st, se] = IVS[n], b = addInterval(P('C4'), st, se); return <Row key={n} title={`${ivLong(n)} (${n})`} sub={`${se} half step${se === 1 ? '' : 's'} · C to ${pretty(pname(b))}`} onPlay={() => hear([60, midi(b)])} />; })}
    </div>
  );
}
function ChordSheet() {
  const k = mkKey('C'), sc = keyScale(k), RN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], Q = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  return (
    <div className="col">
      <p className="muted small">A chord is built by stacking 3rds on a root. The numbers are scale degrees of the root's major scale.</p>
      {Object.entries(QUAL).map(([id, q]) => { const ps = chordTones(P('C4'), id); return <Row key={id} title={`${q.name} · C${q.sym}`} sub={`${FORMULA[id]} · ${names(ps)}`} onPlay={() => hear(up(ps), true)} />; })}
      <b>Chords in a major key</b>
      <div className="card line small">Upper-case numerals are major, lower-case are minor, ° is diminished. In C major:<br />{RN.map((r, i) => `${r} = ${pretty(pname(sc[i]))}${QUAL[Q[i]].sym}`).join(' · ')}</div>
    </div>
  );
}
const SHEETS: [string, string, () => JSX.Element][] = [['lengths', 'Note and rest lengths', LengthSheet], ['keys', 'Keys on the keyboard', KeysSheet], ['staff', 'Notes on the staff', StaffSheet], ['scales', 'Notes in every scale', ScaleSheet], ['sigs', 'Key signatures', SigSheet], ['intervals', 'Intervals', IntervalSheet], ['chords', 'Chords', ChordSheet]];
export function CheatSheets() {
  const nav = useNav(); const [tab, setTab] = useState('lengths'); const T = SHEETS.find((t) => t[0] === tab)![2];
  return (
    <><TopBar title="Cheat sheets" sub="Look it up" onBack={nav.back} /><main className="main col">
      <label className="field">Topic<select value={tab} onChange={(e) => { stopAll(); setTab(e.target.value); }}>{SHEETS.map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></label>
      <T />
      <button className="btn" onClick={() => nav.go({ n: 'cards' })}>Memorise these with flash cards</button>
    </main></>
  );
}

// ---------- flash cards ----------
interface Face { text?: string; sub?: string; score?: Passage; showTime?: boolean; kb?: number[]; play?: number[]; chord?: boolean }
interface Card { id: string; front: Face; back: Face; /** full save key, set on cards gathered from several decks */ key?: string }
interface Deck { id: string; name: string; blurb: string; cards: Card[] }
const kbCard = (m: number, name: string): Card => ({ id: String(m), front: { text: 'Which key is marked?', kb: [m] }, back: { text: name, kb: [m], play: [m] } });
export const DECKS: Deck[] = [
  { id: 'lengths', name: 'Note and rest lengths', blurb: 'See a note or rest, say its name and how long it lasts.', cards: [
    ...LENGTHS.map((l) => ({ id: 'n' + l.code, front: { text: 'What is this note, and how long is it?', score: freeP(`B4/${l.code}`) }, back: { text: l.name, sub: `${beatsText(l.beats)} · count: ${l.count}` } })),
    ...LENGTHS.filter((l) => l.beats !== 3 && l.beats !== 1.5).map((l) => ({ id: 'r' + l.code, front: { text: 'What is this rest, and how long is it?', score: freeP(`r/${l.code}`) }, back: { text: l.name.replace('note', 'rest'), sub: `${beatsText(l.beats)} of silence` } })),
  ] },
  { id: 'keys', name: 'Keys on the keyboard', blurb: 'A key is marked. Name it.', cards: [...WHITE.map((w) => kbCard(midi(P(w + '4')), w)), ...BLACKS.map(([m, s, f]) => kbCard(m, `${pretty(s)} or ${pretty(f)}`))] },
  { id: 'treble', name: 'Treble clef notes', blurb: 'A note on the treble staff. Name it.', cards: TREBLE.map((n) => ({ id: n, front: { text: 'Which note is this?', score: freeP(n + '/4') }, back: { text: n[0], sub: n === 'C4' ? 'Middle C' : undefined, kb: [midi(P(n))], play: [midi(P(n))] } })) },
  { id: 'bass', name: 'Bass clef notes', blurb: 'A note on the bass staff. Name it.', cards: BASS.map((n) => ({ id: n, front: { text: 'Which note is this?', score: freeP(n + '/4', { clef: 'bass' }) }, back: { text: n[0], sub: n === 'C4' ? 'Middle C' : undefined, kb: [midi(P(n))], play: [midi(P(n))] } })) },
  { id: 'sigs', name: 'Key signatures', blurb: 'See a key signature, name the major and minor key.', cards: MAJ.map((k) => ({ id: k, front: { text: 'Which keys have this signature?', score: mk('r/4', { key: k }), showTime: false }, back: { text: `${keyLabel(k)} · ${keyLabel(relMinor(k))}`, sub: `${sig(k)}${sigNotes(k) ? ': ' + sigNotes(k) : ''}` } })) },
  { id: 'major', name: 'Major scales', blurb: 'Name the seven notes of each major scale.', cards: MAJ.map((k) => { const ps = scale(P(k + '4'), 'major'); return { id: k, front: { text: `${pretty(k)} major scale`, sub: 'Say the notes in order' }, back: { text: names(ps), sub: sig(k), kb: up(ps), play: [...up(ps), up(ps)[0] + 12] } }; }) },
  { id: 'minor', name: 'Natural minor scales', blurb: 'Name the seven notes of each minor scale.', cards: MIN.map((k) => { const t = k.replace(/m$/, ''), ps = scale(P(t + '4'), 'minor'); return { id: k, front: { text: `${pretty(t)} minor scale`, sub: 'Natural minor. Say the notes in order' }, back: { text: names(ps), sub: sig(k), kb: up(ps), play: [...up(ps), up(ps)[0] + 12] } }; }) },
  { id: 'intervals', name: 'Intervals', blurb: 'How many half steps is each interval?', cards: IV_LIST.map((n) => { const [st, se] = IVS[n], b = addInterval(P('C4'), st, se); return { id: n, front: { text: ivLong(n), sub: 'How many half steps? What is it above C?' }, back: { text: `${se} half step${se === 1 ? '' : 's'}`, sub: `C to ${pretty(pname(b))}`, kb: [60, midi(b)], play: [60, midi(b)] } }; }) },
  { id: 'chordtypes', name: 'Chord types', blurb: 'The recipe for each kind of chord.', cards: Object.entries(QUAL).map(([id, q]) => { const ps = chordTones(P('C4'), id); return { id, front: { text: `${q.name} chord`, sub: `Written C${q.sym}. Which scale degrees?` }, back: { text: FORMULA[id], sub: `C${q.sym}: ${names(ps)}`, kb: up(ps), play: up(ps), chord: true } }; }) },
  { id: 'triads', name: 'Major and minor triads', blurb: 'Name the three notes of each chord.', cards: ROOTS12.flatMap((r) => (['maj', 'min'] as const).map((q) => { const ps = chordTones(P(r + '4'), q); return { id: r + q, front: { text: `${pretty(r)} ${q === 'maj' ? 'major' : 'minor'}`, sub: 'Which three notes?' }, back: { text: names(ps), kb: up(ps), play: up(ps), chord: true } }; })) },
];
type CardSave = { cards?: Record<string, number>; cardDue?: Record<string, number> };
const DAY = 86400000;
/** Days until a card comes back, by how many times running it was known. A miss sends it back to the start. */
export const CARD_GAPS = [0, 1, 3, 7, 16, 35, 70];
const keyOf = (d: Deck, c: Card) => c.key ?? `${d.id}:${c.id}`;
const box = (s: CardSave, d: string, c: string) => s.cards?.[`${d}:${c}`] ?? 0;
/** Every card that has been studied before and is due again, across all decks. Cards never studied are not counted. */
export function dueCards(s: CardSave, now = Date.now()): Card[] {
  const out: Card[] = [];
  for (const d of DECKS) for (const c of d.cards) { const k = `${d.id}:${c.id}`; if (s.cards && k in s.cards && (s.cardDue?.[k] ?? 0) <= now) out.push({ ...c, id: k, key: k }); }
  return out;
}
export const cardsDue = (s: CardSave, now = Date.now()) => dueCards(s, now).length;
const deckDue = (s: CardSave, d: Deck, now = Date.now()) => d.cards.filter((c) => { const k = `${d.id}:${c.id}`; return s.cards && k in s.cards && (s.cardDue?.[k] ?? 0) <= now; }).length;
/** Cards you have got right twice running count as known. */
export const deckKnown = (s: CardSave, d: Deck) => d.cards.filter((c) => box(s, d.id, c.id) >= 2).length;

function FaceView({ f }: { f: Face }) {
  const lo = f.kb ? Math.min(60, Math.floor(Math.min(...f.kb) / 12) * 12) : 60, hi = f.kb ? Math.max(72, Math.ceil((Math.max(...f.kb) + 1) / 12) * 12) : 72;
  return (
    <div className="col" style={{ gap: 8 }}>
      {f.text && <div className="fc-text">{f.text}</div>}
      {f.sub && <div className="muted">{f.sub}</div>}
      {f.score && <div className="fc-score"><Score spec={{ passage: f.score, showTime: f.showTime }} /></div>}
      {f.kb && <Keyboard lo={lo} hi={hi} marks={Object.fromEntries(f.kb.map((m) => [m, 'accent' as KeyMark]))} labels={false} display short />}
    </div>
  );
}
function Study({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  // weakest cards first, shuffled within each box
  const first = useMemo(() => shuffle(mulberry(Date.now() & 0xffff), deck.cards).sort((a, b) => (get().cards[keyOf(deck, a)] ?? 0) - (get().cards[keyOf(deck, b)] ?? 0)).map((c) => c.id), [deck.id]);
  const [queue, setQueue] = useState(first), [flipped, setFlipped] = useState(false), [missed, setMissed] = useState<string[]>([]), [round, setRound] = useState(0);
  const s = useS(); const card = deck.cards.find((c) => c.id === queue[0]);
  const mark = (ok: boolean) => {
    if (!card) return; stopAll();
    set((st) => { st.cards = st.cards ?? {}; st.cardDue = st.cardDue ?? {}; const k = keyOf(deck, card), b = ok ? Math.min(CARD_GAPS.length - 1, (st.cards[k] ?? 0) + 1) : 0; st.cards[k] = b; st.cardDue[k] = Date.now() + CARD_GAPS[b] * DAY; });
    if (!ok && !missed.includes(card.id)) setMissed([...missed, card.id]);
    const rest = queue.slice(1); if (!ok) rest.splice(Math.min(3, rest.length), 0, card.id); // a missed card comes back after a few others
    setQueue(rest); setFlipped(false);
  };
  const again = (ids: string[]) => { setQueue(ids); setMissed([]); setFlipped(false); setRound(round + 1); };
  const mixed = deck.id === 'due', total = deck.cards.length, known = mixed ? total - queue.length : deckKnown(s, deck);
  return (
    <><TopBar title={deck.name} sub={mixed ? `${known} of ${total} reviewed` : `${known} of ${total} known`} onBack={onExit} /><main className="main col">
      <Bar v={known / total} />
      {card ? <>
        <div className="small muted">{queue.length} to go</div>
        {/* front and back share one box of fixed minimum height, so the buttons below do not jump when the card turns */}
        <div className="flashcard" key={`${round}-${card.id}`} role="group" aria-label={flipped ? 'Answer' : 'Question'}>
          <FaceView f={card.front.score || card.front.kb || !flipped ? card.front : { text: card.front.text }} />
          {flipped && <><hr /><FaceView f={{ ...card.back, kb: card.front.kb ? undefined : card.back.kb }} /></>}
        </div>
        {!flipped ? <button className="btn primary big" onClick={() => setFlipped(true)}>Show answer</button>
          : <div className="row"><button className="btn grow big" onClick={() => mark(false)}>Again</button>{card.back.play && <button className="btn big" style={{ flex: '0 0 60px', padding: 0 }} aria-label="Hear it" onClick={() => hear(card.back.play!, card.back.chord)}><Icon name="playtri" size={16} /></button>}<button className="btn primary grow big" onClick={() => mark(true)}>Got it</button></div>}
        <div className="small muted center">Say the answer to yourself first, then check. Be honest: "Again" brings the card back in a moment.</div>
      </> : <div className="col center" style={{ paddingTop: 16 }}>
        <h1>Deck done</h1>
        <p className="muted">{missed.length ? `${missed.length} card${missed.length > 1 ? 's' : ''} needed another look.` : 'Every card right first time.'} {mixed ? 'Each card comes back after a longer gap every time you know it.' : `${known} of ${total} known.`}</p>
        {missed.length > 0 && <button className="btn primary big" onClick={() => again(missed)}>Go over the {missed.length} I missed</button>}
        {!mixed && <button className="btn big" onClick={() => again(shuffle(mulberry(Date.now() & 0xffff), deck.cards).map((c) => c.id))}>Whole deck again</button>}
        <button className="btn ghost" onClick={onExit}>Choose another deck</button>
      </div>}
    </main></>
  );
}
export function FlashCards() {
  const nav = useNav(), s = useS(); const [deck, setDeck] = useState<string | null>(null);
  const due = useMemo(() => dueCards(get()), [deck]);
  const d = deck === 'due' ? { id: 'due', name: 'Cards due today', blurb: '', cards: due } : DECKS.find((x) => x.id === deck);
  if (d) return <Study deck={d} onExit={() => { stopAll(); setDeck(null); }} />;
  return (
    <><TopBar title="Flash cards" sub="Memorise the basics" onBack={nav.back} /><main className="main col">
      <p className="muted small">Pick a deck. Cards you get right twice running count as known. Each card then comes back after a longer and longer gap (a day, 3 days, a week, and so on); a miss starts it again.</p>
      {due.length > 0 && <button className="btn primary big" onClick={() => setDeck('due')}>Review {due.length} card{due.length > 1 ? 's' : ''} due today</button>}
      {DECKS.map((x) => { const k = deckKnown(s, x); return (
        <button key={x.id} className="node" onClick={() => setDeck(x.id)}><span className="grow"><b>{x.name}</b><br /><span className="small muted">{x.blurb}</span><Bar v={k / x.cards.length} /></span><span style={{ textAlign: 'right', flex: '0 0 auto' }}><span className={'chip' + (k ? ' accent' : '')}>{k}/{x.cards.length}</span>{deckDue(s, x) > 0 && <><br /><span className="small muted">{deckDue(s, x)} due</span></>}</span></button>); })}
      <button className="btn" onClick={() => nav.go({ n: 'sheets' })}>Look things up in the cheat sheets</button>
    </main></>
  );
}
