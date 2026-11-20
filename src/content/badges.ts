import type { State } from '../store';
import { LESSONS } from './index';
export interface Badge { id: string; name: string; desc: string; test: (s: State) => boolean }
const passed = (s: State, f?: (id: string) => boolean) => LESSONS.filter((l) => s.lessons[l.id]?.passedAt && (!f || f(l.id))).length;
const trackDone = (s: State, t: string) => LESSONS.filter((l) => l.track === t).every((l) => s.lessons[l.id]?.passedAt);
const mastered = (s: State) => Object.values(s.skills).filter((k) => k.status === 'mastered').length;
const starSum = (s: State, prefix: string) => Object.entries(s.stars).filter(([k]) => k.startsWith(prefix)).reduce((a, [, v]) => a + v, 0);
const c = (s: State, k: string) => s.counters[k] ?? 0, b = (s: State, k: string) => s.bests[k] ?? 0;
export const BADGES: Badge[] = [
  { id: 'first-lesson', name: 'First steps', desc: 'Pass your first lesson', test: (s) => passed(s) >= 1 },
  { id: 'lessons-10', name: 'Getting going', desc: 'Pass 10 lessons', test: (s) => passed(s) >= 10 },
  { id: 'lessons-25', name: 'A third of the way', desc: 'Pass 25 lessons', test: (s) => passed(s) >= 25 },
  { id: 'lessons-50', name: 'Deep in', desc: 'Pass 50 lessons', test: (s) => passed(s) >= 50 },
  { id: 'lessons-all', name: 'The whole curriculum', desc: 'Pass all 72 lessons', test: (s) => passed(s) >= LESSONS.length },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: 'boss-' + n, name: `Theory level ${n} cleared`, desc: `Beat the level ${n} Theory Boss`, test: (s: State) => (s.stars['boss:' + n] ?? 0) > 0 })),
  { id: 'synth-first', name: 'First patch', desc: 'Pass your first synth lesson', test: (s) => passed(s, (id) => id.startsWith('S')) >= 1 },
  { id: 'synth-core', name: 'Subtractive', desc: 'Pass synth units 1 to 9', test: (s) => { const ls = LESSONS.filter((l) => l.track === 'synth' && l.level <= 9); return ls.length > 0 && ls.every((l) => s.lessons[l.id]?.passedAt); } },
  { id: 'synth-all', name: 'Sound designer', desc: 'Pass every synth lesson', test: (s) => LESSONS.some((l) => l.track === 'synth') && trackDone(s, 'synth') },
  { id: 'reading-all', name: 'Reader', desc: 'Pass every reading lesson', test: (s) => trackDone(s, 'reading') },
  { id: 'ear-all', name: 'Listener', desc: 'Pass every ear lesson', test: (s) => trackDone(s, 'ear') },
  { id: 'keys-major', name: 'Twelve major keys', desc: 'Claim 12 major keys in Key Quest', test: (s) => s.keyQuest.filter((k) => !k.endsWith('m')).length >= 12 },
  { id: 'keys-minor', name: 'Twelve minor keys', desc: 'Claim 12 minor keys in Key Quest', test: (s) => s.keyQuest.filter((k) => k.endsWith('m')).length >= 12 },
  { id: 'phrases-10', name: 'Ten phrases', desc: 'Read 10 phrases at tempo', test: (s) => c(s, 'phrases') >= 10 },
  { id: 'phrases-100', name: 'A hundred phrases', desc: 'Read 100 phrases at tempo', test: (s) => c(s, 'phrases') >= 100 },
  { id: 'pieces-10', name: 'Ten pieces', desc: 'Play through 10 real pieces', test: (s) => c(s, 'pieces') >= 10 },
  { id: 'pieces-40', name: 'Repertoire', desc: 'Play through 40 real pieces', test: (s) => c(s, 'pieces') >= 40 },
  { id: 'echo-5', name: 'Good memory', desc: 'Echo a 5-note melody', test: (s) => b(s, 'echo') >= 5 },
  { id: 'echo-10', name: 'Elephant ears', desc: 'Echo a 10-note melody', test: (s) => b(s, 'echo') >= 10 },
  { id: 'road-5', name: 'On the road', desc: 'A run of 5 on Open Road', test: (s) => b(s, 'road') >= 5 },
  { id: 'road-15', name: 'Long haul', desc: 'A run of 15 on Open Road', test: (s) => b(s, 'road') >= 15 },
  { id: 'runner-50', name: 'Runner', desc: 'Reach 50 notes in Staff Runner', test: (s) => b(s, 'runner') >= 50 },
  { id: 'runner-150', name: 'Marathon', desc: 'Reach 150 notes in Staff Runner', test: (s) => b(s, 'runner') >= 150 },
  { id: 'rush-15', name: 'Quick hands', desc: 'Build 15 chords in one Chord Builder Rush', test: (s) => b(s, 'rushCount') >= 15 },
  { id: 'dash-20', name: 'Sharp ears', desc: 'Answer 20 in one Degree Dash', test: (s) => b(s, 'dashCount') >= 20 },
  { id: 'cases-10', name: 'Junior detective', desc: 'Solve 10 Progression Detective cases', test: (s) => c(s, 'cases') >= 10 },
  { id: 'cases-30', name: 'Detective', desc: 'Solve 30 cases', test: (s) => c(s, 'cases') >= 30 },
  { id: 'cases-60', name: 'Chief inspector', desc: 'Solve all 60 cases', test: (s) => Object.keys(s.stars).filter((k) => k.startsWith('detective:')).length >= 60 },
  { id: 'rhythm-30', name: 'In time', desc: 'Earn 30 stars in Rhythm Tap', test: (s) => starSum(s, 'rhythm:') >= 30 },
  { id: 'rhythm-120', name: 'Metronome', desc: 'Earn all 120 stars in Rhythm Tap', test: (s) => starSum(s, 'rhythm:') >= 120 },
  { id: 'streak-3', name: 'Three days', desc: 'A 3-day streak', test: (s) => s.profile.streak >= 3 },
  { id: 'streak-7', name: 'A full week', desc: 'A 7-day streak', test: (s) => s.profile.streak >= 7 },
  { id: 'streak-30', name: 'A month of music', desc: 'A 30-day streak', test: (s) => s.profile.streak >= 30 },
  { id: 'xp-1000', name: '1,000 XP', desc: 'Earn 1,000 XP', test: (s) => s.profile.xp >= 1000 },
  { id: 'xp-5000', name: '5,000 XP', desc: 'Earn 5,000 XP', test: (s) => s.profile.xp >= 5000 },
  { id: 'xp-20000', name: '20,000 XP', desc: 'Earn 20,000 XP', test: (s) => s.profile.xp >= 20000 },
  { id: 'mastered-10', name: 'Ten mastered', desc: 'Master 10 skills', test: (s) => mastered(s) >= 10 },
  { id: 'mastered-50', name: 'Fifty mastered', desc: 'Master 50 skills', test: (s) => mastered(s) >= 50 },
  { id: 'mastered-100', name: 'A hundred mastered', desc: 'Master 100 skills', test: (s) => mastered(s) >= 100 },
  { id: 'perfect-check', name: 'Clean sheet', desc: 'Score 5 of 5 on a lesson check', test: (s) => c(s, 'perfectChecks') >= 1 },
  { id: 'daily-1', name: 'Challenger', desc: 'Complete a daily challenge', test: (s) => c(s, 'daily') >= 1 },
  { id: 'daily-7', name: 'Regular', desc: 'Complete 7 daily challenges', test: (s) => c(s, 'daily') >= 7 },
  { id: 'mic', name: 'Found your voice', desc: 'Answer 10 questions with the microphone', test: (s) => c(s, 'micAnswers') >= 10 },
  { id: 'midi', name: 'Plugged in', desc: 'Answer 10 questions with a MIDI keyboard', test: (s) => c(s, 'midiAnswers') >= 10 },
];
