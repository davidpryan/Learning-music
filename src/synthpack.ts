// Everything synth mode needs, as one separately loaded bundle: the engine, the exercises, the lessons and the screens.
// Importing it registers exercises S1 to S15 and adds the 103 synth lessons and their skills.
import { SYNTH_A } from './content/synth1';
import { SYNTH_B } from './content/synth2';
import { addLessons } from './content';
import { registerLessons } from './sched';

const lessons = [...SYNTH_A, ...SYNTH_B];
addLessons(lessons); registerLessons(lessons);

export { MatchArea, VizView, PatternArea, PanelArea, PanelFig, PatchFig, SoundsFig } from './synth/ui';
export { Sandbox } from './screens/Sandbox';
export { SynthPlay, SynthGame, SynthPlacement } from './synth/screens';
