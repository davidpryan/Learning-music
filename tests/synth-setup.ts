// Tests load the synth lessons the way the app does when synth mode is first opened, without the screens.
import { SYNTH_A } from '../src/content/synth1';
import { SYNTH_B } from '../src/content/synth2';
import { addLessons } from '../src/content';
import { registerLessons } from '../src/sched';
const lessons = [...SYNTH_A, ...SYNTH_B];
addLessons(lessons); registerLessons(lessons);
