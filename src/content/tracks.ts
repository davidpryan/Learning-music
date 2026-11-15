import { L, s, tr, u, Lesson } from './types';
const BOTH = ['treble', 'bass'];
const MAJ5 = ['C', 'G', 'D', 'F', 'Bb'];

export const READING: Lesson[] = [
  L('R.1', 'reading', 1, 'Landmark notes', [
    s('Fluent readers do not work out every note from scratch. They know a few landmark notes instantly and read the rest from those. Your first landmarks are middle C and the G above it.', { staff: 'C4/4 G4/4', play: true }),
    s('Treble G is easy to spot: the clef curls around its line. In the bass clef, the landmark is F, the line between the two dots.', { staff: 'r/4 G4/4', bass: 'F3/4 r/4' }),
    s('Middle C is the mirror point. It sits one ledger line below the treble staff and one ledger line above the bass staff.', { staff: 'C4/4', bass: 'C4/4' }),
    s('Drill these four until they are instant. Everything else will be read as "a step above G" or "a skip below C".', undefined, tr('T1', { clefs: BOTH, range: 'landmarks' })),
    s('Now your first reading at tempo. You get a few seconds to look, a count-in, and then you play in time with the click. Do not stop for mistakes.', undefined, tr('R2', { level: 1 })),
  ], [u('T1', 'Landmark notes', { clefs: BOTH, range: 'landmarks' }), u('R2', 'Level 1 phrases: C to G, right hand', { level: 1 })], { needs: ['1.3'] }),
  L('R.2', 'reading', 2, 'Steps, skips and repeats', [
    s('From one note to the next there are only three things that can happen: the same note again, a step, or a skip.', { staff: 'E4 E4 F4 G4 E4 G4/2', play: true }),
    s('A step moves from a line to the very next space, or a space to the next line. On the keyboard it is the next white key.', { staff: 'C4 D4 E4 F4 G4/2', play: true }),
    s('A skip jumps from a line to the next line, or space to the next space, missing out one key.', { staff: 'C4 E4 G4 E4 C4/2', play: true }),
    s('So you can play a melody by its shape alone: name the first note, then just follow up, down, step, skip.', undefined, tr('R2', { level: 2, hand: 'rh' })),
    s('Singing what you read connects the page to your ear. Try singing a short stepwise phrase. A keyboard works too if you have no microphone.', undefined, tr('R6', { level: 1 })),
  ], [u('R2', 'Level 2 phrases: one octave', { level: 2, hand: 'rh' }), u('R6', 'Sing stepwise phrases', { level: 1 })]),
  L('R.3', 'reading', 2, 'Reading by interval, not by name', [
    s('Naming every note is too slow for real music. Instead, read the distance from each note to the next. Your hand already knows how far a third is.', { staff: 'C4 E4 D4 F4 E4 G4/2', play: true }),
    s('Learn the look of each interval. Seconds touch. Thirds sit on neighbouring lines or neighbouring spaces. Fifths skip a line: line, miss a line, line.', { staff: '[C4 D4]/4 [C4 E4]/4 [C4 G4]/4' }),
    s('The bass clef works identically. Shapes are the same in every clef; only the starting note changes.', { staff: 'C3 E3 G3 E3 C3/2', clef: 'bass', play: true }),
    s('Read the next phrase in the bass clef with your left hand. Find the first note from the landmark F, then follow the shapes.', undefined, tr('R2', { level: 2, hand: 'lh' })),
  ], [u('R2', 'Level 2 phrases: bass clef', { level: 2, hand: 'lh' }), u('T6', 'Intervals at a glance', { ivs: ['M2', 'M3', 'P4', 'P5'], numbers: true, form: 'both', clefs: BOTH })]),
  L('R.4', 'reading', 3, 'Counting out loud', [
    s('Rhythm goes wrong more often than pitch, and it matters more. A wrong note in time sounds fine; a right note late sounds like a stumble.', { staff: 'B4 B4 B4/2 B4/2 B4 B4', perc: true, play: true }),
    s('Count the beats aloud as you play: "1 2 3 4". Hold long notes for their full count, and keep counting through rests.', { staff: 'B4/2 B4 r/1 B4 B4 B4/2', perc: true, play: true }),
    s('For eighth notes, count "1 and 2 and". The beat numbers stay exactly where they were; the "ands" fall between.', { staff: 'B4 B4/0.5 B4/0.5 B4 B4 B4/0.5 B4/0.5 B4/0.5 B4/0.5 B4/2', perc: true, play: true }),
    s('Tap the rhythm before you play any piece. Try one now: tap the screen, press any key, or clap.', undefined, tr('R1', { level: 1, bars: 2 })),
  ], [u('R1', 'Tap quarters and halves', { level: 1, bars: 4 }), u('R1', 'Tap rhythms with eighths', { level: 3, bars: 4 }), u('R1', 'Tap in 3/4', { level: 3, bars: 4, time: '3/4' })], { needs: ['2.4'] }),
  L('R.5', 'reading', 4, 'Keep going: never stop to fix', [
    s('Sight reading is a different skill from practising. When practising you stop and fix. When sight reading you keep the beat going, whatever happens.', { staff: 'C4 D4 E4 F4 G4 F4 E4 D4 C4/4', play: true }),
    s('If you play a wrong note, leave it behind. If you get lost, skip to the next strong beat and rejoin. The pulse is the one thing you never give up.'),
    s('This is why the app plays a metronome and does not let you pause. Choose a tempo slow enough that you can keep going.'),
    s('Hands in a five-finger position: thumb on the tonic, one finger per key. With the hand anchored, your eyes can stay on the page.', { kb: 'C4 D4 E4 F4 G4', play: true }, tr('R2', { level: 4 })),
  ], [u('R2', 'Level 4 phrases: five-finger positions', { level: 4 }), u('R4', 'First real pieces', { piece: 'random', level: 4 })]),
  L('R.6', 'reading', 5, 'Looking ahead', [
    s('Good readers look ahead of where they are playing, the way you read a sentence ahead of your voice when reading aloud.', { staff: 'C4 E4 G4 E4 F4 D4 B3 D4 C4/4', play: true }),
    s('Aim to see one beat ahead at first, then a whole bar. While your fingers play this beat, your eyes take in the next.'),
    s('Read in groups, not single notes: "a scale going up", "the same bar again", "a C chord broken up". A group is one thing to remember instead of four.', { staff: 'C4 D4 E4 F4 G4/2 G4/2 C4 E4 G4 E4 C4/4', play: true }),
    s('Key signatures now matter. Before you start, say out loud which notes are sharp or flat, and find them on the keyboard.', { staff: 'D4 E4 F4 G4 A4/2 F4/2', key: 'D', play: true }, tr('R2', { level: 5 })),
  ], [u('R2', 'Level 5 phrases: keys and dotted rhythms', { level: 5 }), u('R3', 'Level 5: hands taking turns', { level: 5 }), u('R1', 'Tap dotted rhythms and 6/8', { level: 5, bars: 4 })], { needs: ['3.4'] }),
  L('R.7', 'reading', 6, 'Scanning before you play', [
    s('You always have a few seconds before you start. Use them the same way every time. First: key signature and time signature.', { staff: 'G4 A4 B4 G4 D5/2 B4/2', key: 'G', time: [4, 4] }),
    s('Second: the first note for each hand, and where your hands need to sit.'),
    s('Third: scan for patterns. Repeated bars, scales, the highest and lowest notes.', { staff: 'G4 B4 D5 B4 G4 B4 D5 B4 A4 C5 E5 C5 G4/4', key: 'G', play: true }),
    s('Fourth: find the hardest spot, usually a fast rhythm or an accidental, and hear it in your head. Then set your tempo by that spot, not by the easy bars.', undefined, tr('R3', { level: 6 })),
  ], [u('R3', 'Level 6: melody over held notes', { level: 6 }), u('R4', 'Level 6 pieces', { piece: 'random', level: 6 }), u('R1', 'Tap sixteenths and syncopation', { level: 6, bars: 4 })]),
  L('R.8', 'reading', 7, 'Chords as shapes', [
    s('A chord on the staff is a shape, and each shape has one feel under the hand. A root-position triad is a snowman: three notes stacked on lines or on spaces.', { staff: '[C4 E4 G4]/4 [F4 A4 C5]/4', play: true }),
    s('An inverted triad has a gap. If the gap is at the top, it is first inversion; if the gap is at the bottom, second inversion.', { staff: '[E4 G4 C5]/4 [G4 C5 E5]/4', play: true }),
    s('Read a chord from the bottom note up, then by shape. You only need to name one note.', { staff: '[C3 E3 G3]/2 [B2 D3 G3]/2 [C3 E3 G3]/4', clef: 'bass', play: true }),
    s('Accompaniments repeat. Once you see that the left hand is a broken C chord for a whole bar, stop reading it and look at the melody.', { staff: 'E5/2 D5/2 C5/4', bass: 'C3 G3 E3 G3 C3 G3 E3 G3', play: true }, tr('R3', { level: 7 })),
  ], [u('R3', 'Level 7: melody with chords', { level: 7 }), u('R4', 'Level 7 pieces', { piece: 'random', level: 7 })], { needs: ['5.3'] }),
  L('R.9', 'reading', 8, 'Reading a lead sheet', [
    s('A lead sheet is the shorthand of popular music: one staff with the melody, and chord symbols above it. You supply the accompaniment.', { staff: 'E4:C G4 G4/2 F4:F A4 A4/2 G4:G B4 D5 B4 C5/4:C', play: true }),
    s('The simplest way to play one: melody in the right hand, and in the left hand the root of each chord, held until the next symbol.', { staff: 'E4:C G4 G4/2 F4:F A4 A4/2', bass: 'C3/4 F3/4', play: true }),
    s('Next step: play the full triad in the left hand. A symbol stays in force until a new one appears.', { staff: 'E4:C G4 G4/2 F4:F A4 A4/2', bass: '[C3 E3 G3]/4 [F3 A3 C4]/4', play: true }),
    s('Reading for fun often means exactly this: a songbook, a melody and a few chords. Try the melody first, then the chords.', undefined, tr('R5', { part: 'melody', bars: 8 })),
  ], [u('R5', 'Lead sheet: melody', { part: 'melody', bars: 8 }), u('R5', 'Lead sheet: chords', { part: 'chords', bars: 8 })], { needs: ['5.5'] }),
];

export const EAR: Lesson[] = [
  L('E.1', 'ear', 1, 'Singing back a pitch', [
    s('Ear training starts with one skill: hearing a note and reproducing it. Listen to this note, then hum it. Humming counts.', { sound: 'G4/3', label: 'One note' }),
    s('If you cannot find it, slide your voice slowly up or down like a siren until it locks in. When you match, the two sounds blend and the wobble between them disappears.'),
    s('First, just compare. Is the second note higher or lower than the first?', undefined, tr('E1', { max: 12, same: false })),
    s('Now match it. Sing with the microphone, or find the note on the keyboard. Any octave counts, so a low voice can answer below.', undefined, tr('E2', { white: true })),
  ], [u('E1', 'Higher or lower: wide gaps', { max: 12, same: false }), u('E1', 'Higher, lower or same: small gaps', { max: 3, same: true }), u('E2', 'Match a pitch', { white: true })]),
  L('E.2', 'ear', 2, 'Finding the tonic', [
    s('In almost all music one note feels like home. That note is the tonic. Listen to this scale stop one note short, and notice how badly you want the last note.', { sound: 'C4 D4 E4 F4 G4 A4 B4/3', label: 'An unfinished scale' }),
    s('That pull is the basis of functional ear training. You will not learn isolated distances; you will learn how each note feels against home.', { sound: 'C4 D4 E4 F4 G4 A4 B4 C5/3', label: 'Home at last' }),
    s('Every question starts with four chords, a cadence, that plant the key in your ear. Hum the tonic after it.', { sound: '[C3 C4 E4 G4]/1 [F3 C4 F4 A4]/1 [G3 B3 D4 G4]/1 [C3 C4 E4 G4]/2', label: 'A cadence in C' }),
    s('Start with the three most stable notes: degree 1 feels like home, 3 is sweet and restful, 5 is strong and open.', { sound: 'C4/2 E4/2 G4/2', label: 'Degrees 1, 3 and 5' }, tr('E3', { keys: ['C'], degs: [0, 2, 4] })),
  ], [u('E3', 'Degrees 1, 3 and 5', { keys: ['C'], degs: [0, 2, 4] }), u('E3', 'Degrees 1, 3, 5 in other keys', { keys: MAJ5, degs: [0, 2, 4] })], { needs: ['3.3'] }),
  L('E.3', 'ear', 3, 'Scale degrees and where they want to go', [
    s('The other four degrees are restless, and each leans toward a stable neighbour. Degree 2 wants to fall to 1.', { sound: 'D4/2 C4/2', label: '2 falls to 1' }),
    s('Degree 4 leans down to 3. Degree 6 leans down to 5.', { sound: 'F4/2 E4/2 A4/2 G4/2', label: '4 to 3, then 6 to 5' }),
    s('Degree 7, the leading tone, pulls up to the tonic harder than anything else.', { sound: 'B4/2 C5/2', label: '7 rises to 1' }),
    s('When you hear a note, imagine where it wants to resolve. That feeling, more than the pitch itself, tells you which degree it is.', undefined, tr('E3', { keys: ['C'], degs: [0, 1, 2, 3, 4, 5, 6] })),
    s('Rhythm is trained by ear as well. Listen to a short rhythm over the beat, then tap it back.', undefined, tr('E6', { level: 1, bars: 1 })),
  ], [u('E3', 'All seven degrees', { keys: ['C', 'G', 'F'], degs: [0, 1, 2, 3, 4, 5, 6] }), u('E3', 'Degrees in minor keys', { keys: ['Am', 'Em', 'Dm'], degs: [0, 1, 2, 3, 4, 5, 6] }), u('E6', 'Echo a one-bar rhythm', { level: 1, bars: 1 }), u('E6', 'Echo rhythms with eighths', { level: 3, bars: 2 })]),
  L('E.4', 'ear', 4, 'Intervals as pairs of degrees', [
    s('An interval is easiest to hear as two scale degrees you already know. 1 up to 5 is a perfect fifth. 1 up to 3 is a major third.', { sound: 'C4 G4/2 C4 E4/2', label: 'A fifth, then a major third' }),
    s('Small intervals: a major second is 1 to 2, like the start of a scale. A minor second is 7 to 1, the tightest squeeze there is.', { sound: 'C4 D4/2 B3 C4/2', label: 'Major second, minor second' }),
    s('A perfect fourth is 5 up to 1, the sound of many fanfares and anthems. An octave is 1 to 1: the same note, higher.', { sound: 'G3 C4/2 C4 C5/2', label: 'A fourth, then an octave' }),
    s('Played together, consonant intervals sound smooth and dissonant ones grind. Use that as a second clue.', undefined, tr('E4', { ivs: ['M2', 'M3', 'P4', 'P5', 'P8'], mode: 'asc' })),
    s('String a few degrees together and you have a melody. Listen, sing it back in your head, then play it.', undefined, tr('E7', { keys: ['C'], len: 3, leap: 2 })),
  ], [u('E4', 'Rising major and perfect intervals', { ivs: ['M2', 'M3', 'P4', 'P5', 'P8'], mode: 'asc' }), u('E4', 'All intervals, rising', { ivs: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'], mode: 'asc' }), u('E4', 'All intervals, any direction', { ivs: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'], mode: 'mix' }), u('E7', 'Three-note melodies', { keys: ['C', 'G', 'F'], len: 3, leap: 2 })], { needs: ['4.2'] }),
  L('E.5', 'ear', 5, 'Major and minor chord colour', [
    s('Chords have colour. A major triad sounds bright and open; a minor triad sounds darker and more inward. Only one note differs.', { sound: '[C4 E4 G4]/3 [C4 Eb4 G4]/3', label: 'Major, then minor' }),
    s('To check, listen for the middle note and sing it. In a major chord it sits a major third above the root; in minor it is a half step lower.'),
    s('Diminished triads sound tight and anxious. Augmented triads sound strange and floating, as if they have no floor.', { sound: '[C4 Eb4 Gb4]/3 [C4 E4 G#4]/3', label: 'Diminished, then augmented' }),
    s('Seventh chords add a fourth note and a richer colour. The dominant seventh is the restless one that demands to resolve.', { sound: '[C4 E4 G4 Bb4]/3 [F3 A3 C4 F4]/3', label: 'Dominant seventh, resolving' }, tr('E5', { quals: ['maj', 'min'] })),
  ], [u('E5', 'Major or minor', { quals: ['maj', 'min'] }), u('E5', 'All four triads', { quals: ['maj', 'min', 'dim', 'aug'] }), u('E5', 'Seventh chords', { quals: ['maj7', 'dom7', 'min7', 'hdim7', 'dim7'] }), u('E5', 'Triads and their inversions', { quals: ['maj', 'min'], invs: [0, 1, 2], askInv: true }), u('E7', 'Five-note melodies', { keys: ['C', 'G', 'F', 'D'], len: 5, leap: 3 })], { needs: ['5.1'] }),
  L('E.6', 'ear', 6, 'Listening to the bass', [
    s('To hear which chord is playing, listen to the lowest note. In most music the bass plays the root, and the root names the chord.', { sound: '[C3 C4 E4 G4]/2 [F2 C4 F4 A4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/2', label: 'Follow the bass: C, F, G, C' }),
    s('You already know scale degrees. The bass note is a scale degree: if the bass is on degree 4, the chord is IV.'),
    s('Start with the three primary chords. I sounds like home. V sounds like it must go home. IV sounds like a step away that could go anywhere.', { sound: '[C3 C4 E4 G4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/2', label: 'I – V – I' }),
    s('Hum the bass note after each chord. Then name its degree.', undefined, tr('E8', { keys: ['C'], pool: ['I', 'IV', 'V'] })),
  ], [u('E8', 'I, IV or V', { keys: ['C', 'G', 'F'], pool: ['I', 'IV', 'V'] }), u('E8', 'Adding ii and vi', { keys: ['C', 'G', 'F'], pool: ['I', 'ii', 'IV', 'V', 'vi'] }), u('E7', 'Six-note melodies', { keys: MAJ5, len: 6, leap: 4 })], { needs: ['6.2'] }),
  L('E.7', 'ear', 7, 'Hearing cadences', [
    s('Phrases end with cadences, and each has its own feel. V to I is a full stop.', { sound: '[G2 B3 D4 G4]/2 [C3 C4 E4 G4]/4', label: 'Authentic cadence' }),
    s('Ending on V leaves the question open. You can feel that the music must continue.', { sound: '[C3 C4 E4 G4]/2 [F2 A3 C4 F4]/2 [G2 B3 D4 G4]/4', label: 'Half cadence' }),
    s('V to vi sets up home and then swerves. If you expected a full stop and got a surprise, it was a deceptive cadence.', { sound: '[G2 B3 D4 G4]/2 [A2 A3 C4 E4]/4', label: 'Deceptive cadence' }),
    s('Now follow whole progressions. Track the bass, name each degree, and use the ending to check your answer.', undefined, tr('E9', { keys: ['C'], pool: ['I', 'IV', 'V'], len: 3 })),
  ], [u('E9', 'Three chords: I, IV, V', { keys: ['C', 'G', 'F'], pool: ['I', 'IV', 'V'], len: 3 }), u('E9', 'Four chords with vi', { keys: ['C', 'G', 'F'], pool: ['I', 'IV', 'V', 'vi'], len: 4 }), u('E8', 'Any diatonic chord', { keys: MAJ5, pool: ['I', 'ii', 'iii', 'IV', 'V', 'vi'] })], { needs: ['6.5'] }),
  L('E.8', 'ear', 8, 'Working out a song, step by step', [
    s('Playing a song by ear uses everything so far. Step one: find the tonic. Hum the note the song wants to end on, and find it on the keyboard.'),
    s('Step two: work out the melody as scale degrees, a phrase at a time. Sing a phrase, then find it. Most melodies move by step and repeat themselves.', { sound: 'E4 E4 F4 G4 G4 F4 E4 D4 C4/2', label: 'Degrees 3 3 4 5 5 4 3 2 1' }),
    s('Step three: follow the bass to find the chords. Expect I, IV, V and vi; between them they cover most songs.', { sound: '[C3 C4 E4 G4]/2 [G2 B3 D4 G4]/2 [A2 A3 C4 E4]/2 [F2 A3 C4 F4]/2', label: 'I – V – vi – IV' }),
    s('Step four: check. Play melody and chords together. If something clashes, that note or chord is the one to revisit.', undefined, tr('E9', { keys: ['C', 'G'], pool: ['I', 'IV', 'V', 'vi'], len: 4, style: 'band' })),
  ], [u('E9', 'Four-chord songs, band sound', { keys: MAJ5, pool: ['I', 'ii', 'IV', 'V', 'vi'], len: 4, style: 'band' }), u('E9', 'Longer progressions', { keys: MAJ5, pool: ['I', 'ii', 'iii', 'IV', 'V', 'vi'], len: 6, style: 'band' }), u('E9', 'Secondary and borrowed chords', { keys: ['C', 'G', 'F'], pool: ['I', 'IV', 'V', 'vi', 'V7/V', 'V7/vi', '♭VII', '♭VI', 'iv'], len: 4 }), u('E7', 'Eight-note melodies', { keys: MAJ5, len: 8, leap: 4 }), u('E3', 'Chromatic notes', { keys: ['C', 'G', 'F'], degs: [0, 1, 2, 3, 4, 5, 6], chrom: true })]),
];
