import { L, s, tr, u, Lesson } from './types';
import { TRIADS, SEVENTHS, BOTH } from './theory1';
const MAJ5 = ['C', 'G', 'D', 'F', 'Bb'], MIN3 = ['Am', 'Em', 'Dm'], MAJ9 = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'];

export const THEORY_B: Lesson[] = [
  // ---------------- Level 5: Chords ----------------
  L('5.1', 'theory', 5, 'Major and minor triads', [
    s('A chord is three or more notes sounded together. The basic chord is the triad: three notes stacked in thirds, on alternate lines or alternate spaces.', { staff: '[C4 E4 G4]/4', play: true }),
    s('The bottom note is the root and names the chord. The middle note is the third and the top note the fifth, measured from the root.', { kb: 'C4 E4 G4', play: true }),
    s('A major triad has a major third on the bottom and a minor third on top: root, up four half steps, up three more.', { staff: '[C4 E4 G4]/4 [F4 A4 C5]/4 [G4 B4 D5]/4', play: true }),
    s('A minor triad swaps them: minor third first, then major third. Lowering the middle note of a major triad by a half step makes it minor.', { staff: '[C4 E4 G4]/4 [C4 Eb4 G4]/4', play: true }, tr('T10', { quals: ['maj', 'min'], invs: [0] })),
  ], [u('T9', 'Major and minor triads', { quals: ['maj', 'min'], invs: [0] }), u('T10', 'Play major and minor triads', { quals: ['maj', 'min'], invs: [0] })]),
  L('5.2', 'theory', 5, 'Diminished and augmented triads', [
    s('Stack two minor thirds and you get a diminished triad. Its fifth is a half step smaller than perfect, and it sounds tense and unstable.', { staff: '[B3 D4 F4]/4', play: true }),
    s('Stack two major thirds and you get an augmented triad. Its fifth is a half step larger than perfect, and it sounds bright and unsettled.', { staff: '[C4 E4 G#4]/4', play: true }),
    s('All four triads side by side on C: major, minor, diminished, augmented. Only the third and fifth change.', { staff: '[C4 E4 G4]/4 [C4 Eb4 G4]/4 [C4 Eb4 Gb4]/4 [C4 E4 G#4]/4', play: true }, tr('T9', { quals: TRIADS, invs: [0] })),
  ], [u('T9', 'All four triad types', { quals: TRIADS, invs: [0], acc: true }), u('T10', 'Play all four triad types', { quals: TRIADS, invs: [0] })]),
  L('5.3', 'theory', 5, 'Inversions', [
    s('A chord keeps its name whatever order its notes are in. When the root is the lowest note, the chord is in root position.', { staff: '[C4 E4 G4]/4', play: true }),
    s('Move the root to the top so the third is lowest: that is first inversion. Move the third up as well, leaving the fifth lowest, and you have second inversion.', { staff: '[C4 E4 G4]/4 [E4 G4 C5]/4 [G4 C5 E5]/4', play: true }),
    s('To find the root of an inverted triad, look for the gap of a fourth. The upper note of that fourth is the root.', { staff: '[E4 G4 C5]/4' }),
    s('Inversions let chords connect smoothly, without the hands jumping around.', undefined, tr('T9', { quals: ['maj', 'min'], invs: [0, 1, 2] })),
  ], [u('T9', 'Triads in inversion', { quals: ['maj', 'min'], invs: [0, 1, 2] }), u('T10', 'Play inverted triads', { quals: ['maj', 'min'], invs: [0, 1, 2] })]),
  L('5.4', 'theory', 5, 'The five seventh chords', [
    s('Add one more third on top of a triad and you get a seventh chord: root, third, fifth and seventh.', { staff: '[C4 E4 G4 B4]/4', play: true }),
    s('A major triad with a major seventh is a major seventh chord. With a minor seventh instead it is a dominant seventh, the chord that most wants to resolve.', { staff: '[C4 E4 G4 B4]/4 [C4 E4 G4 Bb4]/4', play: true }),
    s('A minor triad with a minor seventh is a minor seventh chord.', { staff: '[C4 Eb4 G4 Bb4]/4', play: true }),
    s('A diminished triad with a minor seventh is half-diminished. With a diminished seventh it is fully diminished: four notes, each a minor third apart.', { staff: '[C4 Eb4 Gb4 Bb4]/4 [B3 D4 F4 Ab4]/4', play: true }, tr('T9', { quals: SEVENTHS, invs: [0] })),
  ], [u('T9', 'Seventh chords', { quals: SEVENTHS, invs: [0] }), u('T10', 'Play seventh chords', { quals: SEVENTHS, invs: [0] })]),
  L('5.5', 'theory', 5, 'Chord symbols', [
    s('Pop, jazz and folk music name chords with symbols above the staff. A letter alone means a major triad: C is C major.', { staff: '[C4 E4 G4]/4:C [F4 A4 C5]/4:F', play: true }),
    s('A small m means minor: Am. A degree sign or "dim" means diminished, and a plus sign or "aug" means augmented.', { staff: '[A3 C4 E4]/4:Am [B3 D4 F4]/4:B° [C4 E4 G#4]/4:C+', play: true }),
    s('Sevenths: C7 is the dominant seventh, Cmaj7 the major seventh, Cm7 the minor seventh. A slashed circle means half-diminished.', { staff: '[C4 E4 G4 Bb4]/4:C7 [C4 E4 G4 B4]/4:Cmaj7 [C4 Eb4 G4 Bb4]/4:Cm7', play: true }),
    s('A slash names the bass note. C/E means a C major chord with E at the bottom, which is first inversion.', { staff: '[E4 G4 C5]/4:C/E', play: true }, tr('T10', { quals: [...TRIADS, 'dom7', 'maj7', 'min7'], invs: [0], acc: true })),
  ], [u('T10', 'Play from chord symbols', { quals: [...TRIADS, 'dom7', 'maj7', 'min7'], invs: [0], acc: true })]),
  L('5.6', 'theory', 5, 'Figured bass basics', [
    s('Classical theory labels inversions with small numbers called figures. They give the intervals above the lowest note.', { staff: '[C4 E4 G4]/4 [E4 G4 C5]/4 [G4 C5 E5]/4' }),
    s('Root position has a fifth and a third above the bass, written 5/3 and usually left out. First inversion is 6/3, shortened to 6. Second inversion is 6/4.'),
    s('Seventh chords have four positions: 7 for root position, then 6/5, 4/3 and 4/2 for the first, second and third inversions.', { staff: '[G3 B3 D4 F4]/4 [B3 D4 F4 G4]/4 [D4 F4 G4 B4]/4 [F4 G4 B4 D5]/4', play: true }),
    s('You will see these figures attached to Roman numerals later, as in V6 or I6/4.', undefined, tr('T9', { quals: ['maj', 'min', 'dim'], invs: [0, 1, 2], clefs: BOTH })),
  ], [u('T9', 'Triad inversions in both clefs', { quals: ['maj', 'min', 'dim'], invs: [0, 1, 2], clefs: BOTH })]),
  L('5.7', 'theory', 5, 'Spacing and voicing', [
    s('The notes of a chord can be spread over any octaves. Packed as tightly as possible is close position.', { staff: '[C4 E4 G4]/4', play: true }),
    s('Spread over more than an octave is open position. It is the same chord with a wider, fuller sound.', { staff: '[E4 C5]/4', bass: '[C3 G3]/4', play: true }),
    s('With more than three voices, some notes are doubled. The root is the usual choice. The particular arrangement of a chord is called its voicing.', { staff: '[G4 C5 E5]/4', bass: '[C3 C4]/4', play: true }),
    s('However a chord is voiced, name it by collecting its letters and stacking them in thirds.', undefined, tr('T9', { quals: TRIADS, invs: [0, 1, 2], clefs: ['bass'] })),
  ], [u('T9', 'Chords in the bass clef', { quals: TRIADS, invs: [0, 1, 2], clefs: ['bass'], acc: true })]),

  // ---------------- Level 6: Harmony in a key ----------------
  L('6.1', 'theory', 6, 'Diatonic triads in major', [
    s('Build a triad on each note of a major scale, using only notes from that scale. These seven are the diatonic triads of the key.', { staff: '[C4 E4 G4]/2 [D4 F4 A4]/2 [E4 G4 B4]/2 [F4 A4 C5]/2 [G4 B4 D5]/2 [A4 C5 E5]/2 [B4 D5 F5]/2', play: true }),
    s('Their qualities follow a fixed pattern in every major key. The triads on degrees 1, 4 and 5 are major.', { staff: '[C4 E4 G4]/4 [F4 A4 C5]/4 [G4 B4 D5]/4', play: true }),
    s('The triads on 2, 3 and 6 are minor, and the triad on 7 is diminished.', { staff: '[D4 F4 A4]/4 [E4 G4 B4]/4 [A4 C5 E5]/4 [B4 D5 F5]/4', play: true }),
    s('Major, minor, minor, major, major, minor, diminished. Learn that sequence once and it works in all twelve keys.', undefined, tr('T11', { keys: ['C'], kinds: ['triads'] })),
  ], [u('T11', 'Chords of C, G and F major', { keys: ['C', 'G', 'F'], kinds: ['triads'] })]),
  L('6.2', 'theory', 6, 'Roman numerals', [
    s('Chords in a key are labelled with Roman numerals for the scale degree of their root. The chord on degree 5 is V.', { staff: '[C4 E4 G4]/4:I [F4 A4 C5]/4:IV [G4 B4 D5]/4:V', play: true }),
    s('Capital numerals mean major triads; lower-case mean minor. A degree sign marks diminished. So a major key reads I ii iii IV V vi vii°.', { staff: '[D4 F4 A4]/4:ii [E4 G4 B4]/4:iii [A4 C5 E5]/4:vi [B4 D5 F5]/4:vii°' }),
    s('Numerals describe what a chord does, not which notes it has. I IV V is C F G in C major and G C D in G major, and it sounds like the same progression.', { staff: '[G4 B4 D5]/4:I [C5 E5 G5]/4:IV [D5 F5 A5]/4:V', key: 'G', play: true }),
    s('That is why musicians can transpose a song by thinking in numerals.', undefined, tr('T11', { keys: MAJ5, kinds: ['triads'] })),
  ], [u('T11', 'Roman numerals in five keys', { keys: MAJ5, kinds: ['triads'] }), u('T12', 'Play I, IV and V progressions', { keys: ['C', 'G', 'F'], set: 'basic' })]),
  L('6.3', 'theory', 6, 'Diatonic chords in minor', [
    s('Natural minor gives its own pattern of triads: i ii° III iv v VI VII. The tonic and subdominant are now minor.', { staff: '[A3 C4 E4]/4:i [D4 F4 A4]/4:iv [E4 G4 B4]/4:v', key: 'Am', play: true }),
    s('A minor v chord has no leading tone and pulls only weakly to the tonic. So composers borrow the raised seventh from harmonic minor, which makes the dominant a major V.', { staff: '[E4 G#4 B4]/4:V [A3 C4 E4]/4:i', key: 'Am', play: true }),
    s('The raised seventh also turns the chord on degree 7 into a diminished triad, vii°, built on the leading tone.', { staff: '[G#4 B4 D5]/4:vii° [A4 C5 E5]/4:i', key: 'Am', play: true }),
    s('In practice the common minor-key chords are i, ii°, III, iv, V, VI and vii°.', undefined, tr('T11', { keys: ['Am'], kinds: ['triads'] })),
  ], [u('T11', 'Chords of minor keys', { keys: MIN3, kinds: ['triads'] }), u('T12', 'Play minor-key progressions', { keys: MIN3, set: 'minor' })]),
  L('6.4', 'theory', 6, 'Tonic, predominant and dominant', [
    s('Chords in a key do three jobs. Tonic chords feel like home. The main one is I; vi and sometimes iii can stand in for it.', { sound: '[C3 C4 E4 G4]/4', label: 'Tonic: at rest' }),
    s('Dominant chords create tension that wants to resolve home. V is the main one, and vii° does the same job.', { sound: '[G2 B3 D4 G4]/2 [C3 C4 E4 G4]/2', label: 'Dominant to tonic' }),
    s('Predominant chords lead away from home toward the dominant. IV and ii are the usual choices.', { sound: '[F2 A3 C4 F4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/4', label: 'Predominant, dominant, tonic' }),
    s('Most phrases travel tonic, predominant, dominant, tonic. Hearing that journey is the heart of understanding harmony.', undefined, tr('T12', { keys: ['C', 'G', 'F'], set: 'pop' })),
  ], [u('T12', 'Play four-chord progressions', { keys: ['C', 'G', 'F'], set: 'pop' })]),
  L('6.5', 'theory', 6, 'Cadences', [
    s('A cadence is the pair of chords that ends a phrase: musical punctuation. V to I is the authentic cadence, a full stop.', { sound: '[G2 B3 D4 G4]/2 [C3 C4 E4 G4]/4', label: 'Authentic: V to I' }),
    s('A phrase that stops on V ends with a half cadence. It sounds like a comma: more is coming.', { sound: '[C3 C4 E4 G4]/2 [F2 A3 C4 F4]/2 [G2 B3 D4 G4]/4', label: 'Half cadence: ends on V' }),
    s('IV to I is the plagal cadence, the gentle "Amen" ending.', { sound: '[F2 A3 C4 F4]/2 [C3 C4 E4 G4]/4', label: 'Plagal: IV to I' }),
    s('When V goes to vi instead of I, the ear is tricked. That is the deceptive cadence.', { sound: '[G2 B3 D4 G4]/2 [A2 A3 C4 E4]/4', label: 'Deceptive: V to vi' }, tr('T12', { keys: MAJ5, set: 'basic' })),
  ], [u('T12', 'Cadence patterns in five keys', { keys: MAJ5, set: 'basic' })]),
  L('6.6', 'theory', 6, 'Diatonic seventh chords', [
    s('Add a diatonic seventh to each triad of a major key and the qualities again follow a pattern. I and IV become major sevenths.', { staff: '[C4 E4 G4 B4]/4:Imaj7 [F4 A4 C5 E5]/4:IVmaj7', play: true }),
    s('ii, iii and vi become minor sevenths.', { staff: '[D4 F4 A4 C5]/4:ii7 [E4 G4 B4 D5]/4:iii7 [A3 C4 E4 G4]/4:vi7', play: true }),
    s('Only V becomes a dominant seventh. That is where the chord gets its name. Its third and seventh form a tritone that resolves inward to the tonic chord.', { staff: '[G3 B3 D4 F4]/4:V7 [C4 E4 G4]/4:I', play: true }),
    s('The chord on 7 becomes half-diminished.', { staff: '[B3 D4 F4 A4]/4:viiø7', play: true }, tr('T11', { keys: ['C', 'G', 'F'], kinds: ['sevenths'] })),
  ], [u('T11', 'Diatonic seventh chords', { keys: MAJ5, kinds: ['sevenths'] })]),
  L('6.7', 'theory', 6, 'Harmonizing a melody', [
    s('To choose chords for a melody, look at the important notes, usually those on strong beats. Each one should belong to the chord beneath it.', { staff: 'E4:C D4 C4/2 F4:F E4 D4/2', play: true }),
    s('Each scale degree belongs to three diatonic triads. Degree 1 is in I, IV and vi. Start with the primary chords I, IV and V: between them they contain every note of the scale.'),
    s('Change chords on strong beats, and at a steady rate, often once per bar. End a phrase with V to I, or pause on V.', { staff: 'G4:C E4 C4 E4 D4:G B3 D4/2 C4/4:C', bass: '[C3 G3]/4 [G2 D3]/4 [C3 G3]/4', play: true }),
    s('Then swap in ii for IV or vi for I to add colour. If the melody note fits, the substitute will work.', undefined, tr('T11', { keys: MAJ5, kinds: ['triads', 'sevenths'] })),
  ], [], { quiz: [{ ex: 'T11', preset: { keys: [...MAJ5, ...MIN3], kinds: ['triads', 'sevenths'] } }, { ex: 'T12', preset: { keys: MAJ5, set: 'pop' } }] }),

  // ---------------- Level 7: Progressions and voice leading ----------------
  L('7.1', 'theory', 7, 'Common progressions', [
    s('A few chord progressions account for a huge share of music. I IV V I is the backbone of folk, rock and classical alike.', { sound: '[C3 C4 E4 G4]/2 [F2 A3 C4 F4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/2', label: 'I – IV – V – I' }),
    s('I V vi IV is the four-chord loop behind countless pop songs. Starting the same loop on vi gives it a minor mood.', { sound: '[C3 C4 E4 G4]/2 [G2 B3 D4 G4]/2 [A2 A3 C4 E4]/2 [F2 A3 C4 F4]/2', label: 'I – V – vi – IV' }),
    s('ii V I is the essential jazz cadence: predominant, dominant, tonic, usually played with sevenths.', { sound: '[D3 C4 F4 A4]/2 [G2 B3 F4 A4]/2 [C3 B3 E4 G4]/4', label: 'ii7 – V7 – Imaj7' }),
    s('The twelve-bar blues uses just I, IV and V in a fixed pattern: four bars of I, two of IV, two of I, then V, IV, I, V.', undefined, tr('T12', { keys: MAJ9, set: 'pop' })),
  ], [u('T12', 'Common progressions in nine keys', { keys: MAJ9, set: 'pop' })]),
  L('7.2', 'theory', 7, 'Circle progressions', [
    s('The strongest root movement is down a fifth, as in V to I. Chain several together and you get a circle progression.', { sound: '[A2 A3 C4 E4]/2 [D3 A3 D4 F4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/2', label: 'vi – ii – V – I' }),
    s('Each chord acts like a dominant of the next, so the sequence feels inevitable. vi ii V I is the classic four-chord version.'),
    s('The full diatonic circle visits every chord in the key: I IV vii° iii vi ii V I.', { sound: '[C3 E4 G4]/1 [F3 F4 A4]/1 [B2 D4 F4]/1 [E3 E4 G4]/1 [A2 C4 E4]/1 [D3 D4 F4]/1 [G2 B3 D4]/1 [C3 C4 E4]/2', label: 'The full circle' }),
    s('When a progression sounds like it is rolling downhill, check the roots: they are probably falling by fifths.', undefined, tr('T12', { keys: MAJ5, set: 'pop' })),
  ], [], { quiz: [{ ex: 'T12', preset: { keys: MAJ9, set: 'pop' } }, { ex: 'T11', preset: { keys: MAJ9, kinds: ['triads'] } }] }),
  L('7.3', 'theory', 7, 'Non-chord tones', [
    s('Melodies often touch notes that are not in the current chord. These non-chord tones add motion and tension. A passing tone fills the step between two chord tones.', { staff: 'C4 D4 E4/2', bass: '[C3 E3 G3]/4', play: true }),
    s('A neighbour tone steps away from a chord tone and straight back.', { staff: 'E4 F4 E4/2', bass: '[C3 E3 G3]/4', play: true }),
    s('A suspension holds a note over from the previous chord, creating a dissonance that then resolves down by step.', { staff: 'C5/2~ C5 B4 C5/4', bass: '[F3 A3]/2 [G3 D4]/2 [C3 E3 G3]/4', play: true }),
    s('An anticipation arrives early, sounding a note of the next chord before the chord changes. When you analyse harmony, set these decorations aside first.'),
  ], [], { quiz: [{ ex: 'T11', preset: { keys: MAJ9, kinds: ['triads', 'sevenths'] } }] }),
  L('7.4', 'theory', 7, 'Voice-leading basics', [
    s('Voice leading is how each note of one chord moves to a note of the next. The goal is smoothness: every voice moves as little as possible.', { staff: '[E4 G4 C5]/2 [F4 A4 C5]/2', bass: 'C3/2 F3/2', play: true }),
    s('Keep any note the two chords share in the same voice. Move the others by step where you can.', { staff: '[E4 G4 C5]/2 [D4 G4 B4]/2 [E4 G4 C5]/4', bass: 'C3/2 G2/2 C3/4', play: true }),
    s('Two voices moving in parallel perfect fifths or octaves lose their independence, so classical writing avoids them. Moving in contrary motion to the bass helps.'),
    s('Tendency tones resolve by step: the leading tone rises to the tonic, and the seventh of a chord falls.', { staff: '[B3 F4]/2 [C4 E4]/2', bass: 'G2/2 C3/2', play: true }),
  ], [], { quiz: [{ ex: 'T10', preset: { quals: TRIADS, invs: [0, 1, 2], acc: true } }] }),
  L('7.5', 'theory', 7, 'Inversions in progressions', [
    s('Inversions make the bass line into a melody of its own. Compare I IV V I with every chord in root position...', { sound: '[C3 E4 G4 C5]/2 [F3 F4 A4 C5]/2 [G3 D4 G4 B4]/2 [C3 E4 G4 C5]/2', label: 'Root-position bass: leaps' }),
    s('...with a version using first inversions, where the bass moves mostly by step.', { sound: '[C3 E4 G4 C5]/2 [A2 F4 A4 C5]/2 [B2 D4 G4]/2 [C3 E4 G4 C5]/2', label: 'With inversions: a smooth bass' }),
    s('First-inversion chords, written I6 or V6, sound lighter than root position and are ideal in the middle of a phrase.'),
    s('The cadential 6/4 is a tonic chord in second inversion placed just before V at a cadence. It behaves as a decoration of the dominant.', { sound: '[G2 C4 E4 G4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/4', label: 'I6/4 – V – I' }, tr('T10', { quals: ['maj', 'min'], invs: [0, 1, 2], acc: true })),
  ], [u('T10', 'Inverted triads on any root', { quals: TRIADS, invs: [0, 1, 2], acc: true })]),
  L('7.6', 'theory', 7, 'Lead-sheet harmony', [
    s('A lead sheet gives a melody with chord symbols above it. The player decides how to voice each chord.', { staff: 'E4:C E4 F4 G4 G4:G F4 E4 D4', play: true }),
    s('Slash chords set the bass: G/B puts B in the bass under a G chord. They often create a stepwise bass line.', { sound: '[C3 C4 E4 G4]/2 [B2 B3 D4 G4]/2 [A2 A3 C4 E4]/2 [G2 B3 D4 G4]/2', label: 'C – G/B – Am – G' }),
    s('"sus4" replaces the third with the fourth, and "sus2" with the second. Both sound open and want to resolve back. "add9" adds the ninth to a plain triad.', { sound: '[G2 C4 D4 G4]/2 [G2 B3 D4 G4]/2', label: 'Gsus4 – G' }),
    s('A number after the letter adds extensions. 9, 11 and 13 include the seventh below them unless the symbol says "add".', undefined, tr('T10', { quals: SEVENTHS, invs: [0], acc: true })),
  ], [u('T10', 'Seventh chords on any root', { quals: SEVENTHS, invs: [0], acc: true })]),

  // ---------------- Level 8: Beyond the key ----------------
  L('8.1', 'theory', 8, 'Secondary dominants', [
    s('Any major or minor chord in a key can be given its own dominant. A chord that acts as V of something other than the tonic is a secondary dominant.', { sound: '[C3 C4 E4 G4]/2 [D3 C4 F#4 A4]/2 [G2 B3 D4 G4]/2 [C3 C4 E4 G4]/2', label: 'I – V7/V – V – I' }),
    s('In C major, the V chord is G. The dominant of G is D major, which needs an F sharp from outside the key. It is written V/V and read "five of five".', { staff: '[D4 F#4 A4 C5]/4:V7/V [G3 B3 D4 G4]/4:V' }),
    s('The clue is an accidental: a raised note acting as a temporary leading tone, a half step below the root of the next chord.'),
    s('The most common are V/V, V/vi, V/ii and V/IV. Each makes its target chord sound, for a moment, like a new tonic.', undefined, tr('T11', { keys: ['C', 'G', 'F'], kinds: ['triads', 'secondary'] })),
  ], [u('T11', 'Spot secondary dominants', { keys: ['C', 'G', 'D', 'F', 'Bb'], kinds: ['triads', 'secondary'] }), u('T12', 'Play chromatic progressions', { keys: ['C', 'G', 'F'], set: 'chromatic' })]),
  L('8.2', 'theory', 8, 'Borrowed chords', [
    s('A major key can borrow chords from the minor key on the same tonic. This is called mode mixture, and it darkens the colour without leaving the key.', { sound: '[C3 C4 E4 G4]/2 [F2 Ab3 C4 F4]/2 [C3 C4 E4 G4]/4', label: 'I – iv – I' }),
    s('The minor subdominant, iv, is the favourite: in C major, an F minor chord. Its A flat falls expressively to G.', { staff: '[F4 Ab4 C5]/4:iv [E4 G4 C5]/4:I', play: true }),
    s('Flat VI and flat VII are borrowed too: A flat and B flat chords in C major. Flat VI, flat VII, I is a favourite heroic ending.', { sound: '[Ab2 Ab3 C4 Eb4]/2 [Bb2 Bb3 D4 F4]/2 [C3 C4 E4 G4]/4', label: '♭VI – ♭VII – I' }),
    s('Borrowed chords are labelled with the numeral they would have in minor, with a flat sign if the root is lowered.', undefined, tr('T11', { keys: ['C', 'G', 'F'], kinds: ['triads', 'borrowed'] })),
  ], [u('T11', 'Spot borrowed chords', { keys: ['C', 'G', 'D', 'F', 'Bb'], kinds: ['triads', 'borrowed'] })]),
  L('8.3', 'theory', 8, 'Modulation', [
    s('Modulation is a change of key that lasts: a new tonic is established, usually confirmed by a cadence in the new key.', { sound: '[C3 C4 E4 G4]/2 [A2 A3 C4 E4]/2 [D3 A3 D4 F#4]/2 [G2 B3 D4 G4]/4', label: 'C major moving to G major' }),
    s('The smoothest way uses a pivot chord, one that belongs to both keys. A minor is vi in C major and ii in G major, so it can be the hinge between them.'),
    s('Keys that are neighbours on the circle of fifths share most of their chords, so they are the easiest to reach. Relative major and minor are closer still.', { circle: true }),
    s('A brief secondary dominant is a tonicization; when the new key signature feels like home for whole phrases, it is a modulation.', undefined, tr('T11', { keys: ['C', 'G', 'D', 'F', 'Bb'], kinds: ['triads', 'secondary', 'borrowed'] })),
  ], [], { quiz: [{ ex: 'T11', preset: { keys: ['C', 'G', 'D', 'F', 'Bb'], kinds: ['triads', 'secondary', 'borrowed'] } }] }),
  L('8.4', 'theory', 8, 'Modes', [
    s('Play the white keys from D to D instead of C to C and you get a new scale with its own flavour. Each starting note gives a different mode.', { staff: 'D4 E4 F4 G4 A4 B4 C5 D5', play: true }),
    s('The seven modes in order: Ionian (the major scale), Dorian, Phrygian, Lydian, Mixolydian, Aeolian (natural minor) and Locrian.'),
    s('It is easier to hear them as altered major or minor scales. Mixolydian is major with a lowered seventh. Lydian is major with a raised fourth.', { staff: 'G4 A4 B4 C5 D5 E5 F5 G5', play: true }),
    s('Dorian is minor with a raised sixth. Phrygian is minor with a lowered second.', { staff: 'E4 F4 G4 A4 B4 C5 D5 E5', play: true }, tr('T8', { types: ['dorian', 'mixolydian'], tonics: ['D', 'G', 'C'] })),
  ], [u('T8', 'Dorian and Mixolydian', { types: ['dorian', 'mixolydian'], tonics: ['C', 'D', 'G', 'A'] }), u('T8', 'All seven modes', { types: ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'], tonics: ['C', 'D', 'E', 'F', 'G', 'A'] })]),
  L('8.5', 'theory', 8, 'Pentatonic and blues scales', [
    s('A pentatonic scale has five notes. The major pentatonic is the major scale without degrees 4 and 7, so it contains no half steps. The black keys form one.', { staff: 'C4 D4 E4 G4 A4 C5', play: true }),
    s('The minor pentatonic uses the same notes starting from the relative minor: degrees 1, flat 3, 4, 5 and flat 7.', { staff: 'A3 C4 D4 E4 G4 A4', play: true }),
    s('Because nothing clashes, pentatonic melodies sound good over almost any chord in the key. That is why they are everywhere, from folk songs to guitar solos.'),
    s('Add one note to the minor pentatonic, the flattened fifth, and you have the blues scale. That extra "blue note" gives the style its bite.', { staff: 'A3 C4 D4 Eb4 E4 G4 A4', play: true }, tr('T8', { types: ['majpent', 'minpent'], tonics: ['C', 'G', 'A'] })),
  ], [u('T8', 'Pentatonic and blues scales', { types: ['majpent', 'minpent', 'blues'], tonics: ['C', 'G', 'D', 'A', 'E'] })]),
  L('8.6', 'theory', 8, 'Phrase and form', [
    s('A phrase is a musical sentence, often four bars long, ending with a cadence. Phrases commonly come in pairs: a question ending on V, then an answer ending on I. The pair is a period.', { staff: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4/1.5 D4/0.5 D4/2', play: true }),
    s('Larger sections get letters. Binary form is two sections, A B. Ternary form returns to the opening: A B A.'),
    s('Songs often use verse and chorus, sometimes with a contrasting bridge. The 32-bar A A B A form is the standard shape of many jazz tunes.'),
    s('Form is built from repetition and contrast. When you learn a piece, spotting what repeats means there is far less to read.', undefined, tr('T11', { keys: ['C', 'G', 'D', 'F', 'Bb', 'Am', 'Em', 'Dm'], kinds: ['triads', 'sevenths'] })),
  ], [], { quiz: [{ ex: 'T11', preset: { keys: ['C', 'G', 'D', 'F', 'Bb'], kinds: ['triads', 'sevenths', 'secondary'] } }, { ex: 'T8', preset: { types: ['major', 'minor', 'dorian', 'mixolydian', 'majpent'], tonics: ['C', 'G', 'D', 'A'] } }] }),
];
