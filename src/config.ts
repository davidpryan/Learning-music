// Every tunable number lives here (see the plan's "Grading, mastery and scheduling rules").
export const CFG = {
  micCents: 50, micStableMs: 80, chordWindowMs: 80,
  timingFrac: 0.15, timingMinMs: 60, timingMaxMs: 150,
  perfectMs: 40, goodMs: 100,
  phrasePass: 0.8, phraseEasy: 0.95,
  targetMs: { identify: 3000, construct: 6000, ear: 10000 },
  practicedN: 10, practicedAcc: 0.8, masteredN: 20, masteredAcc: 0.9,
  levelUnlockShare: 0.8,
  sessionReviewCap: 20, sessionNoNewAbove: 30, earSetSize: 10,
  tempoStart: 60, tempoUp: 4, tempoDown: 8, tempoUpAfter: 3, tempoDownAfter: 2,
  xpPerItem: 10, xpPerLevel: 500,
  scanSeconds: 15, attemptsKept: 3000,
};
export const TITLES = ['Novice', 'Apprentice', 'Student', 'Player', 'Musician', 'Performer', 'Artist', 'Virtuoso', 'Master', 'Maestro'];
