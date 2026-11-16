import { L, s, tr, u, Lesson } from './types';
const BOTH = ['treble', 'bass'];
const TRIADS = ['maj', 'min', 'dim', 'aug'], SEVENTHS = ['maj7', 'dom7', 'min7', 'hdim7', 'dim7'];
const IV_MP = ['M2', 'M3', 'P4', 'P5', 'M6', 'M7', 'P8'], IV_ALL = ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

export const THEORY_A: Lesson[] = [
  // ---------------- Level 1: Sound and the staff ----------------
  L('1.1', 'theory', 1, 'Pitch and the keyboard', [
    s('Musical sounds are higher or lower. That quality is called pitch. On a keyboard, pitch rises as you move right and falls as you move left. Press play to hear three notes climb.', { sound: 'C4/1 C5/1 C6/1', label: 'Low to high' }),
    s('The black keys come in groups of two and three. That repeating pattern is your map: every key can be found from it.', { kb: 'C#4 D#4 F#4 G#4 A#4' }),
    s('The white key just left of any group of two black keys is C. The C nearest the middle of a piano is called middle C.', { kb: 'C4', play: true }),
    s('White keys are named with seven letters. Starting from C they run C D E F G A B, and then C comes round again.', { kb: 'C4 D4 E4 F4 G4 A4 B4', play: true }),
    s('F sits just left of the group of three black keys. With C and F as anchors you can name any white key. Try it.', { kb: 'C4 F4' }, tr('T2', { black: false })),
  ], [u('T2', 'Name the white keys', { black: false })]),
  L('1.2', 'theory', 1, 'The musical alphabet and octaves', [
    s('The musical alphabet has only seven letters. After G it starts again at A. Going up: A B C D E F G A. Going down, it runs backwards.', { kb: 'A3 B3 C4 D4 E4 F4 G4 A4', play: true }),
    s('Two notes with the same letter, eight white keys apart, are an octave apart. They blend so well they sound like the same note, higher or lower.', { sound: 'C4/1 C5/1 [C4 C5]/2', label: 'An octave' }),
    s('To tell octaves apart, each note gets a number. Middle C is C4. The number goes up at every C: B3 is just below middle C, and the next C up is C5.', { kb: 'B3 C4 C5' }),
    s('So every key has a full name: a letter and an octave number. Name these keys.', undefined, tr('T2', { black: false })),
  ], [], { quiz: [{ ex: 'T2', preset: { black: false } }] }),
  L('1.3', 'theory', 1, 'The staff and treble clef', [
    s('Written music uses a staff: five lines and four spaces. Each note sits on a line or in a space. Higher on the staff means higher in pitch.', { staff: 'E4/4 G4/4 B4/4 D5/4 F5/4', play: true }),
    s('A clef tells you which notes the lines stand for. The treble clef curls around the second line from the bottom and marks it as the G above middle C.', { staff: 'G4/4', play: true }),
    s('From that G, notes step through the alphabet: line, space, line, space. One step up the staff is one letter forward.', { staff: 'E4/4 F4/4 G4/4 A4/4 B4/4', play: true }),
    s('The five treble lines, bottom to top, are E G B D F. The four spaces spell F A C E.', { staff: 'F4/4 A4/4 C5/4 E5/4', play: true }),
    s('Middle C sits just below the staff on its own short line, called a ledger line. D hangs right under the bottom line.', { staff: 'C4/4 D4/4 E4/4', play: true }, tr('T1', { clefs: ['treble'], range: 'low' })),
  ], [u('T1', 'Treble: C up to G', { clefs: ['treble'], range: 'low' }), u('T1', 'Treble staff notes', { clefs: ['treble'], range: 'staff' })]),
  L('1.4', 'theory', 1, 'Bass clef', [
    s('Lower notes are written in the bass clef. Its two dots sit either side of the fourth line, marking that line as the F below middle C.', { staff: 'F3/4', clef: 'bass', play: true }),
    s('The bass lines, bottom to top, are G B D F A. The spaces are A C E G.', { staff: 'G2/4 B2/4 D3/4 F3/4 A3/4', clef: 'bass', play: true }),
    s('Careful: the same position means a different letter in each clef. The bottom line is E in treble but G in bass.', { staff: 'A2/4 C3/4 E3/4 G3/4', clef: 'bass', play: true }),
    s('Middle C sits on a ledger line just above the bass staff, with B right on top of the staff below it.', { staff: 'A3/4 B3/4 C4/4', clef: 'bass', play: true }, tr('T1', { clefs: ['bass'], range: 'low' })),
  ], [u('T1', 'Bass: C up to G', { clefs: ['bass'], range: 'low' }), u('T1', 'Bass staff notes', { clefs: ['bass'], range: 'staff' })]),
  L('1.5', 'theory', 1, 'The grand staff and middle C', [
    s('Piano music joins a treble staff and a bass staff with a brace. Together they form the grand staff. Usually the right hand reads the top staff and the left hand the bottom.', { staff: 'C5/4', bass: 'C3/4' }),
    s('Middle C lives between the two staves. Written for the right hand it hangs below the treble staff; for the left hand it floats above the bass staff. It is the same key.', { staff: 'C4/4', bass: 'C4/4' }),
    s('Reading up from the bass staff, the notes continue straight through middle C into the treble staff with no gap.', { staff: 'r/4 r/4 r/4 D4/4 E4/4', bass: 'A3/4 B3/4 C4/4 r/4 r/4' }),
    s('Now read notes in either clef. Check the clef first, every time.', undefined, tr('T1', { clefs: BOTH, range: 'staff' })),
  ], [u('T1', 'Both clefs', { clefs: BOTH, range: 'staff' })]),
  L('1.6', 'theory', 1, 'Ledger lines', [
    s('Notes above or below a staff sit on short extra lines called ledger lines. They extend the staff using the same line-space pattern.', { staff: 'F5/4 G5/4 A5/4 B5/4 C6/4', play: true }),
    s('Above the treble staff: G sits on top of the staff, A is on the first ledger line and C is on the second.', { staff: 'G5/4 A5/4 C6/4' }),
    s('Below the treble staff: middle C is on one ledger line and A is on two.', { staff: 'C4/4 B3/4 A3/4', play: true }),
    s('For the bass staff, middle C is one line above and E is two lines above. Below it, E is on one ledger line and C on two.', { staff: 'C4/4 E4/4 E2/4 C2/4', clef: 'bass' }),
    s('Tip: read ledger notes by counting from the nearest staff line, not from scratch.', undefined, tr('T1', { clefs: BOTH, range: 'ledger' })),
  ], [u('T1', 'One ledger line', { clefs: BOTH, range: 'wide' }), u('T1', 'Ledger lines', { clefs: BOTH, range: 'ledger' })]),

  // ---------------- Level 2: Rhythm ----------------
  L('2.1', 'theory', 2, 'Beat, tempo and the measure', [
    s('Most music has a steady pulse you could tap your foot to. That pulse is the beat.', { click: 80, label: 'A steady beat' }),
    s('Tempo is how fast the beats go, counted in beats per minute (bpm). At 60 bpm there is one beat every second. Compare a slow and a fast tempo.', { click: 132, label: 'A faster beat' }),
    s('Beats are grouped into measures, also called bars, separated by vertical bar lines. The first beat of each measure feels the strongest.', { staff: 'B4 B4 B4 B4 B4 B4 B4 B4', perc: true, play: true }),
    s('Counting the beats aloud, "1 2 3 4, 1 2 3 4", is the single most useful rhythm habit. You will use it in every lesson from here.'),
  ], []),
  L('2.2', 'theory', 2, 'Whole, half and quarter notes', [
    s('A quarter note usually lasts one beat. It has a filled-in head and a stem.', { staff: 'B4 B4 B4 B4', perc: true, play: true }),
    s('A half note lasts two beats. Its head is open, with a stem.', { staff: 'B4/2 B4/2', perc: true, play: true }),
    s('A whole note lasts four beats: an open head and no stem at all.', { staff: 'B4/4', perc: true, play: true }),
    s('The values nest inside each other. One whole note equals two half notes, which equal four quarter notes.', { staff: 'B4/4 B4/2 B4/2 B4 B4 B4 B4', perc: true, play: true }, tr('T4', { values: [4, 2, 1], ask: 'name' })),
  ], [u('T4', 'Name whole, half, quarter', { values: [4, 2, 1], ask: 'name' }), u('T4', 'Count their beats', { values: [4, 2, 1], ask: 'beats' })]),
  L('2.3', 'theory', 2, 'Rests', [
    s('Silence is written too. Every note value has a rest of the same length.', { staff: 'B4 r/1 B4 r/1', perc: true, play: true }),
    s('A whole rest hangs below a line like a hole in the ground. A half rest sits on top of a line like a hat.', { staff: 'r/4 r/2 r/2', perc: true }),
    s('A quarter rest is a zigzag stroke and lasts one beat. Keep counting through rests; the beat never stops.', { staff: 'B4 r/1 r/1 B4', perc: true, play: true }, tr('T4', { values: [4, 2, 1], rests: true, ask: 'name' })),
  ], [u('T4', 'Notes and rests', { values: [4, 2, 1], rests: true, ask: 'name' })]),
  L('2.4', 'theory', 2, 'Eighths and sixteenths', [
    s('An eighth note lasts half a beat. Alone it has a flag; in pairs or groups the flags join into a beam.', { staff: 'B4/0.5 B4/0.5 B4/0.5 B4/0.5 B4 B4', perc: true, play: true }),
    s('Count eighths by saying "and" between the beats: "1 and 2 and 3 and 4 and".', { staff: 'B4 B4/0.5 B4/0.5 B4 B4/0.5 B4/0.5', perc: true, play: true }),
    s('A sixteenth note lasts a quarter of a beat and has two flags or beams. Four of them fill one beat, counted "1 e and a".', { staff: 'B4/0.25 B4/0.25 B4/0.25 B4/0.25 B4 B4/2', perc: true, play: true }),
    s('Eighth and sixteenth rests exist too: a slanted stroke with one or two small hooks.', undefined, tr('T4', { values: [4, 2, 1, 0.5, 0.25], ask: 'beats' })),
  ], [u('T4', 'Eighths and sixteenths', { values: [4, 2, 1, 0.5, 0.25], rests: true, ask: 'name' }), u('T4', 'Beats: all simple values', { values: [4, 2, 1, 0.5, 0.25], ask: 'beats' })]),
  L('2.5', 'theory', 2, 'Time signatures: 4/4, 3/4, 2/4', [
    s('The two stacked numbers at the start of a piece are the time signature. The top number says how many beats are in each measure.', { staff: 'B4 B4 B4 B4', perc: true, time: [4, 4] }),
    s('The bottom number says which note value counts as one beat. A 4 means the quarter note. So 4/4 is four quarter-note beats per measure.'),
    s('3/4 has three beats per measure, the feel of a waltz: strong, weak, weak.', { staff: 'B4 B4 B4 B4/2 B4', perc: true, time: [3, 4], play: true }),
    s('2/4 has two beats per measure, like a march. Whatever the signature, every measure must add up to exactly that many beats.', { staff: 'B4 B4 B4/2', perc: true, time: [2, 4], play: true }, tr('T5', { times: ['4/4', '3/4', '2/4'], level: 2 })),
  ], [u('T5', 'Fill the measure', { times: ['4/4', '3/4', '2/4'], level: 3 })]),
  L('2.6', 'theory', 2, 'Dots and ties', [
    s('A dot after a note adds half of its value. A dotted half note lasts 2 + 1 = 3 beats.', { staff: 'B4/3 B4', perc: true, play: true }),
    s('A dotted quarter lasts one and a half beats. It is usually followed by an eighth note to complete two beats.', { staff: 'B4/1.5 B4/0.5 B4/2', perc: true, play: true }),
    s('A tie is a curved line joining two notes of the same pitch. Play the first and hold it through the second: their lengths add together.', { staff: 'B4/2 B4~ B4 B4/4', perc: false, play: true }),
    s('Ties can cross a bar line, which a single note cannot do.', undefined, tr('T4', { values: [4, 3, 2, 1.5, 1, 0.5], ask: 'beats' })),
  ], [u('T4', 'Dotted notes', { values: [4, 3, 2, 1.5, 1, 0.5], ask: 'beats' }), u('T5', 'Fill the measure with dots', { times: ['4/4', '3/4'], level: 5 })]),
  L('2.7', 'theory', 2, 'Compound meter: 6/8', [
    s('In 6/8 each measure holds six eighth notes. They are felt in two groups of three, so there are two main beats per measure.', { staff: 'B4/0.5 B4/0.5 B4/0.5 B4/0.5 B4/0.5 B4/0.5', perc: true, time: [6, 8], play: true }),
    s('Each main beat is a dotted quarter note, because it divides into three eighths. Meters whose beats divide in three are called compound.', { staff: 'B4/1.5 B4/1.5', perc: true, time: [6, 8], play: true }),
    s('3/4 and 6/8 both hold six eighth notes, but 3/4 is three beats of two and 6/8 is two beats of three. Listen for the difference in the grouping.', { staff: 'B4 B4/0.5 B4/1.5', perc: true, time: [6, 8], play: true }, tr('T5', { times: ['6/8'], level: 5 })),
  ], [u('T5', 'Fill a 6/8 measure', { times: ['6/8'], level: 5 })]),
  L('2.8', 'theory', 2, 'Pickups and syncopation', [
    s('Many tunes begin before the first strong beat. Those opening notes form a pickup, or anacrusis. "Happy Birthday" starts with one.', { staff: 'r/2 C4/0.5 C4/0.5 D4 C4 F4 E4/2 r/1', time: [3, 4], play: true }),
    s('The pickup measure is incomplete. Its missing beats are usually made up in the final measure of the piece.'),
    s('Syncopation puts emphasis where you do not expect it: on a weak beat or between beats. It makes rhythm feel lively.', { staff: 'B4/0.5 B4 B4/0.5 B4 B4', perc: true, play: true }),
    s('When rhythms get tricky, count the smallest value out loud and clap. Slow and correct beats fast and wrong.', undefined, tr('T5', { times: ['4/4', '3/4', '6/8'], level: 5 })),
  ], [], { quiz: [{ ex: 'T5', preset: { times: ['4/4', '3/4', '6/8'], level: 5 } }, { ex: 'T4', preset: { values: [4, 3, 2, 1.5, 1, 0.5, 0.25], rests: true, ask: 'name' } }] }),

  // ---------------- Level 3: Scales and keys ----------------
  L('3.1', 'theory', 3, 'Half steps and whole steps', [
    s('A half step is the distance from one key to the very next key, black or white. It is the smallest step in most Western music.', { kb: 'C4 C#4', play: true }),
    s('Between E and F, and between B and C, there is no black key. Those white-key neighbours are a half step apart.', { kb: 'E4 F4 B4 C5', play: true }),
    s('A whole step is two half steps: skip exactly one key. C to D is a whole step, and so is E to F sharp.', { kb: 'E4 F#4', play: true }),
    s('Scales and chords are all built from patterns of half and whole steps. Play the note asked for.', undefined, tr('T7', { ivs: ['m2', 'M2'], dir: 'up' })),
  ], [u('T7', 'Half and whole steps up', { ivs: ['m2', 'M2'], dir: 'up' }), u('T7', 'Half and whole steps down', { ivs: ['m2', 'M2'], dir: 'down' })]),
  L('3.2', 'theory', 3, 'Sharps, flats and naturals', [
    s('A sharp raises a note by a half step. F sharp is the black key just right of F.', { kb: 'F4 F#4', play: true }),
    s('A flat lowers a note by a half step. B flat is the black key just left of B.', { kb: 'Bb4 B4', play: true }),
    s('Each black key therefore has two names: C sharp is also D flat. Two names for one key are called enharmonic.', { kb: 'C#4' }),
    s('On the staff, the sign goes before the note and lasts until the next bar line. A natural sign cancels it.', { staff: 'F4 F#4 G4 Bb4', play: true }, tr('T1', { clefs: ['treble'], range: 'staff', acc: true })),
  ], [u('T2', 'All twelve keys', { black: true }), u('T1', 'Notes with sharps and flats', { clefs: BOTH, range: 'staff', acc: true })]),
  L('3.3', 'theory', 3, 'The major scale', [
    s('A scale is a ladder of notes. The major scale follows a fixed pattern of steps: whole, whole, half, whole, whole, whole, half.', { kb: 'C4 D4 E4 F4 G4 A4 B4 C5', play: true }),
    s('Starting on C, that pattern uses only white keys. The half steps fall between E and F and between B and C.', { staff: 'C4 D4 E4 F4 G4 A4 B4 C5', play: true }),
    s('Start anywhere else and you need black keys to keep the pattern. G major needs F sharp.', { staff: 'G4 A4 B4 C5 D5 E5 F#5 G5', play: true }),
    s('F major needs B flat. Each letter is used exactly once, which is why it is B flat and not A sharp.', { staff: 'F4 G4 A4 Bb4 C5 D5 E5 F5', play: true }, tr('T8', { types: ['major'], tonics: ['C'] })),
  ], [u('T8', 'Major scales: C, G, F', { types: ['major'], tonics: ['C', 'G', 'F'] })]),
  L('3.4', 'theory', 3, 'Sharp key signatures', [
    s('Rather than writing a sharp before every F, music in G major puts one sharp at the start of every staff. That is the key signature.', { staff: 'G4 A4 B4 C5 D5 E5 F5 G5', key: 'G', play: true }),
    s('Sharps are always added in the same order: F C G D A E B. Each new sharp key keeps the earlier ones.', { staff: 'D4/4', key: 'A' }),
    s('To name a sharp key, find the last sharp and go up a half step. Three sharps end on G sharp, so the key is A major.', { staff: 'A4/4', key: 'A' }),
    s('No sharps or flats means C major.', undefined, tr('T3', { kinds: 'sharps', maxAcc: 4 })),
  ], [u('T3', 'Sharp keys up to 4 sharps', { kinds: 'sharps', maxAcc: 4 }), u('T8', 'Major scales: D, A, E', { types: ['major'], tonics: ['D', 'A', 'E'] })]),
  L('3.5', 'theory', 3, 'Flat key signatures', [
    s('Flat keys work the same way. One flat, B flat, is the signature of F major.', { staff: 'F4 G4 A4 B4 C5 D5 E5 F5', key: 'F', play: true }),
    s('Flats are added in the order B E A D G C F, which is the order of sharps backwards.', { staff: 'Eb4/4', key: 'Eb' }),
    s('To name a flat key, look at the second-to-last flat: that is the key. Three flats (B, E, A) give E flat major. F major, with one flat, you simply remember.', { staff: 'Ab4/4', key: 'Ab' }, tr('T3', { kinds: 'flats', maxAcc: 4 })),
  ], [u('T3', 'Flat keys up to 4 flats', { kinds: 'flats', maxAcc: 4 }), u('T8', 'Major scales: B♭, E♭, A♭', { types: ['major'], tonics: ['Bb', 'Eb', 'Ab'] })]),
  L('3.6', 'theory', 3, 'The circle of fifths', [
    s('Arrange the twelve keys in a circle and a pattern appears. Moving clockwise, each key is five notes higher and has one more sharp.', { circle: true }),
    s('Moving counter-clockwise from C, each key is five notes lower and has one more flat: F, B flat, E flat, A flat.', { circle: true }),
    s('At the bottom the two sides meet. F sharp major (six sharps) and G flat major (six flats) are the same keys on the piano.'),
    s('Neighbours on the circle differ by just one note, which is why music moves between them so easily.', undefined, tr('T3', { kinds: 'both', maxAcc: 7 })),
  ], [u('T3', 'All major key signatures', { kinds: 'both', maxAcc: 7 }), u('T8', 'Major scales in any key', { types: ['major'], tonics: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'] })]),
  L('3.7', 'theory', 3, 'Natural minor and relative keys', [
    s('The natural minor scale has its own step pattern: whole, half, whole, whole, half, whole, whole. From A it uses only white keys.', { staff: 'A4 B4 C5 D5 E5 F5 G5 A5', play: true }),
    s('Compared with major, the third, sixth and seventh notes are a half step lower. That lowered third gives minor its darker colour.', { sound: 'C4 D4 E4 F4 G4/2 C4 D4 Eb4 F4 G4/2', label: 'Major, then minor' }),
    s('A minor and C major use exactly the same notes. They are relative keys and share a key signature.', { staff: 'A4/4', key: 'Am' }),
    s('To find the relative minor, go to the sixth note of the major scale, or three half steps below the tonic. G major and E minor share one sharp.', undefined, tr('T3', { mode: 'minor', maxAcc: 3 })),
  ], [u('T3', 'Minor key signatures', { mode: 'minor', maxAcc: 4 }), u('T8', 'Natural minor: A, E, D', { types: ['minor'], tonics: ['A', 'E', 'D'] })]),
  L('3.8', 'theory', 3, 'Harmonic and melodic minor', [
    s('Natural minor lacks a strong pull up to the tonic. Raising the seventh note a half step fixes that. The result is the harmonic minor scale.', { staff: 'A4 B4 C5 D5 E5 F5 G#5 A5', play: true }),
    s('That raised seventh is written as an accidental; it is never in the key signature.'),
    s('Harmonic minor leaves an awkward gap between notes six and seven. Melodic minor smooths it by raising the sixth as well, on the way up.', { staff: 'A4 B4 C5 D5 E5 F#5 G#5 A5', play: true }),
    s('Coming down, melodic minor traditionally returns to natural minor.', { staff: 'A5 G5 F5 E5 D5 C5 B4 A4', play: true }, tr('T8', { types: ['harmonic'], tonics: ['A'] })),
  ], [u('T8', 'Harmonic minor scales', { types: ['harmonic'], tonics: ['A', 'E', 'D'] }), u('T8', 'Melodic minor scales', { types: ['melodic'], tonics: ['A', 'E', 'D'] })]),
  L('3.9', 'theory', 3, 'Scale-degree names and solfege', [
    s('Each note of a scale has a number, its scale degree, counted from the tonic as 1. In C major, G is degree 5.', { staff: 'C4 D4 E4 F4 G4 A4 B4', play: true }),
    s('The degrees also have names. 1 is the tonic, 4 the subdominant, 5 the dominant. 7 is the leading tone because it pulls up to the tonic.'),
    s('The rest: 2 is the supertonic, 3 the mediant, 6 the submediant.'),
    s('Singers use solfege syllables for the same seven degrees: do re mi fa sol la ti. Whatever the key, the tonic is do.', { sound: 'C4 D4 E4 F4 G4 A4 B4 C5/2', label: 'do re mi fa sol la ti do' }, tr('T8', { types: ['major'], tonics: ['C', 'G', 'D', 'F', 'Bb'] })),
  ], [], { quiz: [{ ex: 'T8', preset: { types: ['major', 'minor'], tonics: ['C', 'G', 'D', 'F', 'A', 'E'] } }, { ex: 'T3', preset: { mode: 'both', maxAcc: 4 } }] }),

  // ---------------- Level 4: Intervals ----------------
  L('4.1', 'theory', 4, 'Interval numbers', [
    s('An interval is the distance between two notes. Its number comes from counting letter names, including both ends. C up to E spans C, D, E: a third.', { staff: '[C4 E4]/4', play: true }),
    s('On the staff you can see the number. Line to the next line, or space to the next space, is a third. Line to the neighbouring space is a second.', { staff: '[E4 F4]/4 [E4 G4]/4 [E4 A4]/4 [E4 B4]/4' }),
    s('Odd-numbered intervals (3rd, 5th, 7th) sit line to line or space to space. Even ones (2nd, 4th, 6th, octave) go from a line to a space.', { staff: '[F4 C5]/4 [F4 D5]/4 [F4 E5]/4 [F4 F5]/4' }),
    s('Name each interval by its number.', undefined, tr('T6', { ivs: IV_MP, numbers: true, form: 'both' })),
  ], [u('T6', 'Interval numbers', { ivs: IV_MP, numbers: true, form: 'both', clefs: BOTH })]),
  L('4.2', 'theory', 4, 'Major and perfect intervals', [
    s('A number alone is not precise. Intervals also have a quality. Measure from the tonic of a major scale and you get the reference set.', { staff: 'C4 D4 E4 F4 G4 A4 B4 C5', play: true }),
    s('From the tonic up to degrees 2, 3, 6 and 7 are major intervals: a major second, third, sixth and seventh.', { staff: '[C4 D4]/4 [C4 E4]/4 [C4 A4]/4 [C4 B4]/4', play: true }),
    s('From the tonic up to 4, 5 and 8 are called perfect: a perfect fourth, perfect fifth and perfect octave. Sounding the same note is a perfect unison.', { staff: '[C4 F4]/4 [C4 G4]/4 [C4 C5]/4', play: true }),
    s('So to name any interval, imagine the major scale of the lower note. If the upper note belongs to it, the interval is major or perfect.', undefined, tr('T6', { ivs: IV_MP })),
  ], [u('T6', 'Major and perfect intervals', { ivs: IV_MP, clefs: BOTH }), u('T7', 'Build major and perfect intervals', { ivs: IV_MP, dir: 'up' })]),
  L('4.3', 'theory', 4, 'Minor, diminished and augmented', [
    s('Shrink a major interval by a half step and it becomes minor. C to E is a major third; C to E flat is a minor third.', { staff: '[C4 E4]/4 [C4 Eb4]/4', play: true }),
    s('Shrink a perfect or a minor interval by a half step and it becomes diminished. Widen a perfect or major interval by a half step and it is augmented.', { staff: '[C4 G4]/4 [C4 Gb4]/4 [C4 G#4]/4', play: true }),
    s('The interval of six half steps splits the octave exactly in half. Written as an augmented fourth or a diminished fifth, it is nicknamed the tritone.', { staff: '[C4 F#4]/4 [C4 Gb4]/4', play: true }),
    s('The number always follows the letters; the quality follows the half steps. C to D sharp is a second, however much it sounds like a third.', undefined, tr('T6', { ivs: IV_ALL, acc: true })),
  ], [u('T6', 'All interval qualities', { ivs: IV_ALL, acc: true, clefs: BOTH }), u('T7', 'Build any interval', { ivs: IV_ALL, dir: 'up' })]),
  L('4.4', 'theory', 4, 'Inverting intervals', [
    s('Move the lower note of an interval up an octave and you invert it. C up to E, a third, becomes E up to C, a sixth.', { staff: '[C4 E4]/4 [E4 C5]/4', play: true }),
    s('An interval and its inversion always add up to nine: seconds become sevenths, thirds become sixths, fourths become fifths.'),
    s('Quality flips too: major becomes minor and augmented becomes diminished. Perfect stays perfect.', { staff: '[C4 G4]/4 [G4 C5]/4', play: true }),
    s('Inversion is the quick way to find an interval below a note: a major third down lands on the same letter as a minor sixth up.', undefined, tr('T7', { ivs: IV_MP, dir: 'down' })),
  ], [u('T7', 'Intervals below a note', { ivs: IV_ALL, dir: 'down' })]),
  L('4.5', 'theory', 4, 'Compound intervals', [
    s('Intervals wider than an octave are compound. A ninth is an octave plus a second; a tenth is an octave plus a third.', { staff: '[C4 D5]/4 [C4 E5]/4', play: true }),
    s('To name one, subtract seven from the number to find the simple interval inside it. The quality stays the same: a major tenth contains a major third.'),
    s('Ninths, elevenths and thirteenths turn up as the upper notes of jazz and pop chords.', undefined, tr('T6', { ivs: ['P8', 'm9', 'M9', 'm10', 'M10'] })),
  ], [u('T6', 'Octaves, ninths and tenths', { ivs: ['M7', 'P8', 'm9', 'M9', 'm10', 'M10'] })]),
  L('4.6', 'theory', 4, 'Consonance and dissonance', [
    s('Some intervals sound settled and smooth. These consonances are the unison, octave, perfect fifth, and the thirds and sixths.', { sound: '[C4 G4]/2 [C4 E4]/2 [C4 A4]/2', label: 'Consonant intervals' }),
    s('Others sound tense, as if they want to move on. These dissonances are the seconds, sevenths and the tritone.', { sound: '[C4 D4]/2 [C4 B4]/2 [C4 F#4]/2', label: 'Dissonant intervals' }),
    s('Dissonance is not bad. Music breathes by building tension and releasing it: a dissonance that resolves to a consonance is one of the most satisfying sounds there is.', { sound: '[C4 F#4]/2 [B3 G4]/2', label: 'Tension, then release' }),
    s('The perfect fourth sits in between: stable in a melody, restless when it is the lowest interval of a chord.', undefined, tr('T6', { ivs: IV_ALL, acc: true })),
  ], [], { quiz: [{ ex: 'T6', preset: { ivs: IV_ALL, acc: true, clefs: BOTH } }, { ex: 'T7', preset: { ivs: IV_ALL, dir: 'both' } }] }),
];
export { TRIADS, SEVENTHS, BOTH };
