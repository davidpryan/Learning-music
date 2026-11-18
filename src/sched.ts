// Skills, mastery, spaced repetition (FSRS), the daily session, XP, streaks and badges.
import { fsrs, createEmptyCard, Rating, generatorParameters } from 'ts-fsrs';
import { LESSONS, LESSON_BY_ID, Lesson, Track, TRACKS } from './content';
import { BADGES } from './content/badges';
import { EX } from './exercises';
import { CFG, TITLES } from './config';
import { State, SkillState, get, set, dayKey, addDays, weekKey } from './store';

export interface Skill { id: string; lessonId: string; track: Track; level: number; title: string; ex: string; preset: Record<string, any>; target: number }
export const SKILLS: Record<string, Skill> = {};
for (const l of LESSONS) l.unlocks.forEach((u, i) => { const id = `${l.id}:${i}`; SKILLS[id] = { id, lessonId: l.id, track: l.track, level: l.level, title: u.title, ex: u.ex, preset: u.preset, target: EX[u.ex].target }; });
export const skillsOf = (lessonId: string) => Object.values(SKILLS).filter((k) => k.lessonId === lessonId);

const F = fsrs(generatorParameters({ enable_fuzz: false }));
const revive = (c: any) => ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined });

// ---------- unlock rules ----------
const trackLessons = (t: Track) => LESSONS.filter((l) => l.track === t);
export function levelUnlocked(s: State, t: Track, level: number): boolean {
  const lower = trackLessons(t).filter((l) => l.level < level);
  if (!lower.length) return true;
  if (!lower.every((l) => s.lessons[l.id]?.passedAt)) return false;
  const prevLevel = Math.max(...lower.map((l) => l.level));
  const sk = Object.values(SKILLS).filter((k) => k.track === t && k.level === prevLevel);
  if (!sk.length) return true;
  const ok = sk.filter((k) => { const st = s.skills[k.id]?.status; return st === 'practiced' || st === 'mastered'; }).length;
  return ok / sk.length >= CFG.levelUnlockShare;
}
export type LessonStatus = 'locked' | 'available' | 'passed' | 'mastered';
export function lessonStatus(s: State, l: Lesson): LessonStatus {
  if (s.lessons[l.id]?.passedAt) { const sk = skillsOf(l.id); return sk.length && sk.every((k) => s.skills[k.id]?.status === 'mastered') ? 'mastered' : 'passed'; }
  const tl = trackLessons(l.track), i = tl.indexOf(l);
  const prevOk = i === 0 || !!s.lessons[tl[i - 1].id]?.passedAt;
  const needsOk = (l.needs ?? []).every((n) => s.lessons[n]?.passedAt);
  return prevOk && needsOk && levelUnlocked(s, l.track, l.level) ? 'available' : 'locked';
}
/** Why a lesson is locked, in plain words. */
export function lockReason(s: State, l: Lesson): string {
  const tl = trackLessons(l.track), i = tl.indexOf(l);
  if (i > 0 && !s.lessons[tl[i - 1].id]?.passedAt) return `Pass "${tl[i - 1].title}" first.`;
  const need = (l.needs ?? []).find((n) => !s.lessons[n]?.passedAt);
  if (need) return `Needs theory lesson ${need}, "${LESSON_BY_ID[need].title}".`;
  const g = gateFor(s, l.track);
  return g && g.lesson.id === l.id ? `Level ${l.level} opens when ${g.need} of the ${g.total} skills from the level before are at "Practiced" (10 answers at 80% or better). So far: ${g.ready}.` : `Practise the skills from the level before until 80% of them are at "Practiced".`;
}
/** When the next lesson in a track is held back only by the level rule: the skills still to practise, and how many are needed. */
export function gateFor(s: State, t: Track): { lesson: Lesson; todo: Skill[]; ready: number; need: number; total: number } | null {
  const tl = trackLessons(t), i = tl.findIndex((l) => !s.lessons[l.id]?.passedAt);
  if (i <= 0) return null;
  const l = tl[i];
  if (!s.lessons[tl[i - 1].id]?.passedAt || !(l.needs ?? []).every((n) => s.lessons[n]?.passedAt) || levelUnlocked(s, t, l.level)) return null;
  const prev = Math.max(...tl.filter((x) => x.level < l.level).map((x) => x.level));
  const sk = Object.values(SKILLS).filter((k) => k.track === t && k.level === prev);
  const done = (k: Skill) => { const st = s.skills[k.id]?.status; return st === 'practiced' || st === 'mastered'; };
  return { lesson: l, todo: sk.filter((k) => !done(k)), ready: sk.filter(done).length, need: Math.ceil(sk.length * CFG.levelUnlockShare), total: sk.length };
}
export const PERFORM_EX = ['R1', 'R2', 'R3', 'R4', 'R5', 'E6'];
/** A drill over several skills: quick-answer ones together, or at-tempo ones together. */
export function drillFor(skills: Skill[]): { items: { ex: string; preset: Record<string, any>; skillId: string }[]; count: number } {
  const quick = skills.filter((k) => !PERFORM_EX.includes(k.ex)), use = quick.length ? quick : skills;
  return { items: use.map((k) => ({ ex: k.ex, preset: k.preset, skillId: k.id })), count: quick.length ? Math.max(10, Math.min(20, use.length * 4)) : Math.min(6, Math.max(3, use.length * 2)) };
}
export function nextLesson(s: State, t?: Track): Lesson | null {
  const order = t ? [t] : [...TRACKS].sort((a, b) => trackLevel(s, a) - trackLevel(s, b));
  for (const tr of order) { const l = trackLessons(tr).find((x) => lessonStatus(s, x) === 'available'); if (l) return l; }
  return null;
}
export function trackLevel(s: State, t: Track): number {
  const passed = trackLessons(t).filter((l) => s.lessons[l.id]?.passedAt);
  return passed.length ? Math.max(...passed.map((l) => l.level)) : 0;
}
export function passLesson(id: string, score: number, quiet = false, credit: { skillId?: string; ok: boolean }[] = []) {
  set((s) => {
    const first = !s.lessons[id]?.passedAt;
    s.lessons[id] = { passedAt: s.lessons[id]?.passedAt ?? Date.now(), best: Math.max(score, s.lessons[id]?.best ?? 0) };
    for (const k of skillsOf(id)) if (!s.skills[k.id]) s.skills[k.id] = { status: 'learning', card: createEmptyCard(new Date()), recent: [], againRun: 0, items: {} };
    if (first) for (const c of credit) { const k = c.skillId ? s.skills[c.skillId] : undefined; if (k) k.recent.push({ c: c.ok, ms: SKILLS[c.skillId!].target || 3000, t: Date.now() }); }
    if (score >= 5 && !quiet) s.counters.perfectChecks = (s.counters.perfectChecks ?? 0) + 1;
    if (first && !quiet) addXp(s, 50);
    checkBadges(s);
  });
}
/** Placement: mark a set of lessons as passed without XP. */
export function placeOut(ids: string[]) { ids.forEach((id) => passLesson(id, 4, true)); }

// ---------- recording attempts ----------
export interface AttemptIn { skillId?: string; ex: string; ctx: string; correct: boolean; ms: number; input: string; hinted?: boolean; pp?: number; rp?: number; item?: string; combo?: number }
function statusOf(k: SkillState, target: number): SkillState['status'] {
  const n = k.recent.length, acc = (m: number) => k.recent.slice(-m).filter((r) => r.c).length / Math.min(m, n || 1);
  if (n >= CFG.masteredN && acc(CFG.masteredN) >= CFG.masteredAcc) {
    const ms = k.recent.slice(-CFG.masteredN).map((r) => r.ms).sort((a, b) => a - b), med = ms[Math.floor(ms.length / 2)];
    if (!target || med <= target) return 'mastered';
  }
  return n >= CFG.practicedN && acc(CFG.practicedN) >= CFG.practicedAcc ? 'practiced' : 'learning';
}
function addXp(s: State, xp: number) {
  s.profile.xp += xp; const d = dayKey(); s.days[d] = s.days[d] ?? { min: 0, xp: 0, goal: false }; s.days[d].xp += xp;
}
export function record(a: AttemptIn): number {
  let gained = 0;
  set((s) => {
    const sk = a.skillId ? SKILLS[a.skillId] : undefined, target = sk?.target ?? EX[a.ex]?.target ?? 0;
    const phrase = a.pp !== undefined;
    let rating = Rating.Again;
    if (phrase) { const p = Math.min(a.pp!, a.rp ?? 1); rating = p >= CFG.phraseEasy ? Rating.Easy : p >= CFG.phrasePass ? Rating.Good : Rating.Again; }
    else if (a.correct) rating = a.hinted || (target && a.ms > 2 * target) ? Rating.Hard : target && a.ms < 0.5 * target ? Rating.Easy : Rating.Good;
    if (sk && s.skills[sk.id]) {
      const k = s.skills[sk.id];
      try { k.card = F.next(revive(k.card), new Date(), rating).card; } catch { k.card = createEmptyCard(new Date()); }
      k.recent.push({ c: a.correct, ms: a.ms, t: Date.now() }); if (k.recent.length > 20) k.recent.shift();
      k.againRun = a.correct ? 0 : k.againRun + 1;
      const was = k.status; let now = statusOf(k, target);
      if (was === 'mastered' && k.againRun >= 2) now = 'practiced';
      else if (was === 'mastered' && now !== 'mastered' && k.againRun < 2) now = 'mastered';
      k.status = now;
      if (a.item) { const it = (k.items[a.item] = k.items[a.item] ?? []); it.push(a.correct ? 1 : 0); if (it.length > 5) it.shift(); }
    }
    const diff = sk ? (sk.level <= 3 ? 1 : sk.level <= 6 ? 2 : 3) : 1;
    gained = a.correct ? Math.round(CFG.xpPerItem * diff * (a.combo ?? 1)) : 0;
    if (gained) addXp(s, gained);
    s.attempts.push({ t: Date.now(), skill: a.skillId ?? '', ex: a.ex, ctx: a.ctx, c: a.correct, ms: Math.round(a.ms), input: a.input, pp: a.pp, rp: a.rp });
    if (a.input === 'mic') s.counters.micAnswers = (s.counters.micAnswers ?? 0) + 1;
    if (a.input === 'midi') s.counters.midiAnswers = (s.counters.midiAnswers ?? 0) + 1;
    if (phrase && a.correct) { const key = a.ex === 'R4' ? 'pieces' : 'phrases'; s.counters[key] = (s.counters[key] ?? 0) + 1; }
    checkBadges(s);
  });
  return gained;
}
/** True if this item key has been missed lately within its skill (drawn twice as often). */
export function isWeakItem(skillId: string | undefined, item: string): boolean {
  const it = skillId ? get().skills[skillId]?.items[item] : undefined;
  return !!it && it.length >= 2 && it.reduce((a, b) => a + b, 0) / it.length < 0.8;
}
export const bump = (key: string, n = 1) => set((s) => { s.counters[key] = (s.counters[key] ?? 0) + n; checkBadges(s); });
export function saveBest(key: string, v: number): boolean { let up = false; set((s) => { if (v > (s.bests[key] ?? 0)) { s.bests[key] = v; up = true; } checkBadges(s); }); return up; }
export function saveStars(key: string, v: number) { set((s) => { if (v > (s.stars[key] ?? 0)) s.stars[key] = v; checkBadges(s); }); }
export function gameXp(xp: number) { set((s) => { addXp(s, xp); checkBadges(s); }); }
export let newBadges: string[] = [];
export const takeNewBadges = () => { const b = newBadges; newBadges = []; return b; };
function checkBadges(s: State) { for (const b of BADGES) if (!s.profile.badges.includes(b.id) && b.test(s)) { s.profile.badges.push(b.id); newBadges.push(b.name); } }

// ---------- reading tempo ----------
export function tempoFor(key: string, base: number): number { return get().tempo[key]?.bpm ?? Math.min(base, Math.max(CFG.tempoStart, base - 12)); }
export function reportTempo(key: string, base: number, pass: boolean) {
  set((s) => {
    const t = (s.tempo[key] = s.tempo[key] ?? { bpm: tempoFor(key, base), pass: 0, fail: 0 });
    if (pass) { t.pass++; t.fail = 0; if (t.pass >= CFG.tempoUpAfter) { t.bpm = Math.min(160, t.bpm + CFG.tempoUp); t.pass = 0; } }
    else { t.fail++; t.pass = 0; if (t.fail >= CFG.tempoDownAfter) { t.bpm = Math.max(40, t.bpm - CFG.tempoDown); t.fail = 0; } }
  });
}

// ---------- time, goal, streak ----------
export function addMinutes(min: number) {
  set((s) => {
    const d = dayKey(), day = (s.days[d] = s.days[d] ?? { min: 0, xp: 0, goal: false });
    day.min += min;
    if (!day.goal && day.min >= s.profile.dailyGoalMin) {
      day.goal = true; const p = s.profile, y = addDays(d, -1), y2 = addDays(d, -2);
      if (p.lastGoalDate === y) p.streak += 1;
      else if (p.lastGoalDate === y2 && p.freezeWeek !== weekKey(d)) { p.streak += 1; p.freezeWeek = weekKey(d); }
      else if (p.lastGoalDate !== d) p.streak = 1;
      p.lastGoalDate = d; checkBadges(s);
    }
  });
}
/** Streak as it stands today (a broken streak shows 0 without rewriting history). */
export function liveStreak(s: State): number {
  const p = s.profile, d = dayKey();
  if (p.lastGoalDate === d || p.lastGoalDate === addDays(d, -1)) return p.streak;
  if (p.lastGoalDate === addDays(d, -2) && p.freezeWeek !== weekKey(d)) return p.streak;
  return 0;
}
export const playerLevel = (xp: number) => Math.floor(xp / CFG.xpPerLevel) + 1;
export const playerTitle = (xp: number) => TITLES[Math.min(TITLES.length - 1, Math.floor((playerLevel(xp) - 1) / 3))];

// ---------- reviews and the daily session ----------
export function dueSkills(s: State, now = Date.now()): Skill[] {
  return Object.keys(s.skills).filter((id) => SKILLS[id] && new Date(s.skills[id].card.due).getTime() <= now)
    .sort((a, b) => new Date(s.skills[a].card.due).getTime() - new Date(s.skills[b].card.due).getTime()).map((id) => SKILLS[id]);
}
// ---------- which games fit what has been learned ----------
/** Exercises each game draws on, one list per mode. A mode is ready when every exercise in it has been taught by a passed lesson. */
export const GAME_NEEDS: Record<string, string[][]> = {
  rush: [['T10'], ['T7'], ['T3'], ['T11']], quest: [['T3', 'T8', 'T10']], runner: [['T1']], rhythm: [['R1']], road: [['R2']],
  echo: [['E7']], dash: [['E3'], ['E4'], ['E5'], ['E8']], detective: [['E9']], boss: [],
};
const GAME_TRACK: Record<string, Track> = { rush: 'theory', quest: 'theory', boss: 'theory', runner: 'reading', rhythm: 'reading', road: 'reading', echo: 'ear', dash: 'ear', detective: 'ear' };
export function learnedEx(s: State): Set<string> { return new Set(Object.values(SKILLS).filter((k) => s.lessons[k.lessonId]?.passedAt).map((k) => k.ex)); }
/** Per mode: has the user learned what it asks? Theory Boss has no modes; it opens with the first passed theory lesson. */
export function gameModes(s: State, id: string): boolean[] {
  if (id === 'boss') return [LESSONS.some((l) => l.track === 'theory' && s.lessons[l.id]?.passedAt)];
  const have = learnedEx(s); return (GAME_NEEDS[id] ?? []).map((m) => m.every((e) => have.has(e)));
}
export const gameReady = (s: State, id: string) => gameModes(s, id).some(Boolean);
/** The lesson that opens a game: the earliest one after which some mode is fully covered. */
export function gameOpensWith(id: string): Lesson | null {
  if (id === 'boss') return LESSONS.find((l) => l.track === 'theory') ?? null;
  const first = (e: string) => LESSONS.findIndex((l) => l.unlocks.some((u) => u.ex === e));
  const idx = (GAME_NEEDS[id] ?? []).map((m) => Math.max(...m.map(first))).filter((i) => i >= 0);
  return idx.length ? LESSONS[Math.min(...idx)] : null;
}
/** A game to suggest for a skill, or null when no game covers what has been learned. */
export function gameForSkill(s: State, k: Skill): string | null {
  const ready = Object.keys(GAME_NEEDS).filter((g) => g !== 'boss' && gameReady(s, g));
  const modesOk = (g: string) => GAME_NEEDS[g].filter((_, i) => gameModes(s, g)[i]);
  return ready.find((g) => modesOk(g).some((m) => m.includes(k.ex))) ?? ready.find((g) => GAME_TRACK[g] === k.track) ?? null;
}

export type SessionItem = { kind: 'review'; skill: Skill; n: number } | { kind: 'lesson'; lesson: Lesson } | { kind: 'reading'; skill: Skill } | { kind: 'ear'; skill: Skill; n: number } | { kind: 'game'; game: string; why: string };
const isPerform = (k: Skill) => ['R1', 'R2', 'R3', 'R4', 'R5', 'E6'].includes(k.ex);
export function buildSession(s: State): SessionItem[] {
  const out: SessionItem[] = [], due = dueSkills(s);
  // 1. due reviews, oldest first, capped, interleaved across tracks
  const byTrack: Record<string, Skill[]> = { theory: [], reading: [], ear: [] };
  due.filter((k) => !isPerform(k)).slice(0, CFG.sessionReviewCap).forEach((k) => byTrack[k.track].push(k));
  for (let i = 0; i < CFG.sessionReviewCap; i++) for (const t of TRACKS) { const k = byTrack[t][i]; if (k) out.push({ kind: 'review', skill: k, n: 2 }); }
  // 2. one new lesson from the track furthest behind
  if (due.length <= CFG.sessionNoNewAbove) {
    const l = nextLesson(s);
    if (l) out.push({ kind: 'lesson', lesson: l });
    // every open lesson is done but a level is still locked: practise toward the unlock instead
    else for (const t of TRACKS) { const g = gateFor(s, t); if (g) { g.todo.filter((k) => !isPerform(k)).slice(0, 3).forEach((k) => out.push({ kind: 'review', skill: k, n: 5 })); break; } }
  }
  // 3. three reading passages at the current reading level
  const reading = Object.values(SKILLS).filter((k) => k.track === 'reading' && s.skills[k.id] && isPerform(k)).sort((a, b) => b.level - a.level);
  const rhythm = reading.find((k) => k.ex === 'R1'), one = reading.find((k) => k.ex === 'R2'), hard = reading.find((k) => k.ex !== 'R1');
  [rhythm, one, hard].forEach((k) => { if (k) out.push({ kind: 'reading', skill: k }); });
  // 4. one ear set on the newest ear skill
  const ear = Object.values(SKILLS).filter((k) => k.track === 'ear' && s.skills[k.id] && !isPerform(k));
  if (ear.length) out.push({ kind: 'ear', skill: ear[ear.length - 1], n: CFG.earSetSize });
  // 5. a suggested game for the weakest skill of the week
  const weak = weakSpots(s)[0];
  const game = weak && gameForSkill(s, weak.skill);
  if (weak && game) out.push({ kind: 'game', game, why: `Your weakest skill this week: ${weak.skill.title}` });
  return out;
}
export function weakSpots(s: State): { skill: Skill; acc: number }[] {
  return Object.keys(s.skills).filter((id) => SKILLS[id] && s.skills[id].recent.length >= 4)
    .map((id) => ({ skill: SKILLS[id], acc: s.skills[id].recent.slice(-10).filter((r) => r.c).length / Math.min(10, s.skills[id].recent.length) }))
    .filter((x) => x.acc < 0.85).sort((a, b) => a.acc - b.acc).slice(0, 6);
}
export function trackStats(s: State, t: Track) {
  const sk = Object.values(SKILLS).filter((k) => k.track === t), ls = trackLessons(t);
  const st = (x: string) => sk.filter((k) => s.skills[k.id]?.status === x).length;
  return { lessons: ls.length, passed: ls.filter((l) => s.lessons[l.id]?.passedAt).length, skills: sk.length, learning: st('learning'), practiced: st('practiced'), mastered: st('mastered'), level: trackLevel(s, t) };
}
