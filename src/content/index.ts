import { THEORY_A } from './theory1';
import { THEORY_B } from './theory2';
import { READING, EAR } from './tracks';
import { SYNTH_A } from './synth1';
import { SYNTH_B } from './synth2';
import type { Lesson } from './types';
export const SYNTH: Lesson[] = [...SYNTH_A, ...SYNTH_B];
export const LESSONS: Lesson[] = [...THEORY_A, ...THEORY_B, ...READING, ...EAR, ...SYNTH];
export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
/** The music tracks. Synth mode has one track of its own. */
export const TRACKS = ['theory', 'reading', 'ear'] as const;
export const ALL_TRACKS = ['theory', 'reading', 'ear', 'synth'] as const;
export type Track = (typeof ALL_TRACKS)[number];
export type Mode = 'music' | 'synth';
export const modeTracks = (m: Mode): readonly Track[] => (m === 'synth' ? ['synth'] : TRACKS);
export const TRACK_NAME: Record<Track, string> = { theory: 'Theory', reading: 'Reading', ear: 'Ear', synth: 'Synth' };
export const LEVEL_NAME: Record<Track, string[]> = {
  theory: ['', 'Sound and the staff', 'Rhythm', 'Scales and keys', 'Intervals', 'Chords', 'Harmony in a key', 'Progressions and voice leading', 'Beyond the key'],
  reading: ['', 'Landmarks', 'Steps and skips', 'Rhythm', 'Five-finger positions', 'Keys and looking ahead', 'Hands together', 'Chords', 'Lead sheets'],
  ear: ['', 'Matching pitch', 'The tonic', 'Scale degrees and rhythm', 'Intervals', 'Chord colour', 'Chord function', 'Cadences and progressions', 'Songs by ear'],
  synth: ['', 'Sound itself', 'Oscillators', 'Filters', 'Amp envelope', 'Shaping over time', 'LFOs', 'Voices and playing', 'Effects', 'Recipes', 'New ways to make tone', 'Other engines', 'Any synth, any sound'],
};
export type { Lesson };
