import { THEORY_A } from './theory1';
import { THEORY_B } from './theory2';
import { READING, EAR } from './tracks';
import type { Lesson } from './types';
export const LESSONS: Lesson[] = [...THEORY_A, ...THEORY_B, ...READING, ...EAR];
export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const TRACKS = ['theory', 'reading', 'ear'] as const;
export type Track = (typeof TRACKS)[number];
export const TRACK_NAME: Record<Track, string> = { theory: 'Theory', reading: 'Reading', ear: 'Ear' };
export const LEVEL_NAME: Record<Track, string[]> = {
  theory: ['', 'Sound and the staff', 'Rhythm', 'Scales and keys', 'Intervals', 'Chords', 'Harmony in a key', 'Progressions and voice leading', 'Beyond the key'],
  reading: ['', 'Landmarks', 'Steps and skips', 'Rhythm', 'Five-finger positions', 'Keys and looking ahead', 'Hands together', 'Chords', 'Lead sheets'],
  ear: ['', 'Matching pitch', 'The tonic', 'Scale degrees and rhythm', 'Intervals', 'Chord colour', 'Chord function', 'Cadences and progressions', 'Songs by ear'],
};
export type { Lesson };
