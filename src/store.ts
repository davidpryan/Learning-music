// App state: one object, kept in IndexedDB (falling back to localStorage, then memory). No account, no server.
import { useSyncExternalStore } from 'react';
import type { Timbre } from './audio';
import { setVolumes } from './audio';
import { setNameSystem } from './music';
import { CFG } from './config';

export type InputMode = 'screen' | 'mic' | 'midi' | 'choice';
export interface Settings {
  input: InputMode; timbre: Timbre; volume: number; metVolume: number; notationScale: number;
  nameSystem: 'letters' | 'solfege'; keyLabels: 'auto' | 'on' | 'off'; reducedMotion: boolean; theme: 'light' | 'dark'; voiceMode: boolean; showCursor: boolean; bigKeys: boolean; sfx: boolean;
}
export interface SkillState { status: 'learning' | 'practiced' | 'mastered'; card: any; recent: { c: boolean; ms: number; t: number }[]; againRun: number; items: Record<string, number[]> }
export interface Attempt { t: number; skill: string; ex: string; ctx: string; c: boolean; ms: number; input: string; pp?: number; rp?: number }
export interface State {
  v: number;
  profile: {
    xp: number; dailyGoalMin: 5 | 10 | 20; streak: number; lastGoalDate: string; freezeWeek: string; badges: string[];
    mode: 'music' | 'synth'; latency: Record<string, number>; voiceRange: [number, number] | null; micGate: number; onboarded: boolean; settings: Settings;
  };
  skills: Record<string, SkillState>;
  lessons: Record<string, { passedAt?: number; best: number }>;
  attempts: Attempt[];
  bests: Record<string, number>; stars: Record<string, number>; highs: Record<string, number>;
  days: Record<string, { min: number; xp: number; goal: boolean }>;
  presets: Record<string, { name: string; params: any }[]>;
  keyQuest: string[]; tempo: Record<string, { bpm: number; pass: number; fail: number }>;
  counters: Record<string, number>; synthPatches: { name: string; patch: Record<string, number> }[]; userPieces: { id: string; title: string; xml: string }[]; dailyLog: { d: string; game: string; score: number }[];
}
export const SCHEMA = 1;
export const defaults = (): State => ({
  v: SCHEMA,
  profile: {
    xp: 0, mode: 'music', dailyGoalMin: 10, streak: 0, lastGoalDate: '', freezeWeek: '', badges: [], latency: { screen: 0, mic: 60, midi: 0 }, voiceRange: null, micGate: 0.012, onboarded: false,
    settings: { input: 'screen', timbre: 'piano', volume: 0.8, metVolume: 0.7, notationScale: 1, nameSystem: 'letters', keyLabels: 'auto', reducedMotion: false, theme: 'light', voiceMode: true, showCursor: true, bigKeys: false, sfx: true },
  },
  skills: {}, lessons: {}, attempts: [], bests: {}, stars: {}, highs: {}, days: {}, presets: {}, keyQuest: [], tempo: {}, counters: {}, synthPatches: [], userPieces: [], dailyLog: [],
});

let state: State = defaults();
const subs = new Set<() => void>();
export const get = () => state;
export const useS = () => useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, get);
export function set(fn: (s: State) => void) {
  fn(state); state = { ...state };
  if (state.attempts.length > CFG.attemptsKept) state.attempts = state.attempts.slice(-CFG.attemptsKept);
  applySettings(); subs.forEach((f) => f()); scheduleSave();
}
function applySettings() {
  const st = state.profile.settings;
  setVolumes(st.volume, st.metVolume, st.sfx); setNameSystem(st.nameSystem);
  if (typeof document !== 'undefined') { document.documentElement.dataset.theme = st.theme; document.documentElement.dataset.motion = st.reducedMotion ? 'reduced' : 'full'; document.documentElement.dataset.mode = state.profile.mode; }
}

// ---- persistence ----
const KEY = 'learning-music-state';
let db: IDBDatabase | null = null, saveTimer: any = null, memoryOnly = false;
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      const rq = indexedDB.open('learning-music', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch { res(null); }
  });
}
function idbGet(): Promise<string | null> {
  return new Promise((res) => { try { const rq = db!.transaction('kv').objectStore('kv').get(KEY); rq.onsuccess = () => res(rq.result ?? null); rq.onerror = () => res(null); } catch { res(null); } });
}
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null; const json = JSON.stringify(state);
    try { if (db) db.transaction('kv', 'readwrite').objectStore('kv').put(json, KEY); else localStorage.setItem(KEY, json); } catch { memoryOnly = true; }
  }, 400);
}
export const storageNote = () => (memoryOnly ? 'Progress cannot be saved in this browser view; export it from Settings before closing.' : '');
export function migrate(raw: any): State {
  const d = defaults();
  if (!raw || typeof raw !== 'object' || typeof raw.v !== 'number') throw new Error('Not a Learning Music export.');
  if (raw.v > SCHEMA) throw new Error('This export is from a newer version of the app.');
  return { ...d, ...raw, v: SCHEMA, profile: { ...d.profile, ...raw.profile, settings: { ...d.profile.settings, ...(raw.profile?.settings ?? {}) }, latency: { ...d.profile.latency, ...(raw.profile?.latency ?? {}) } } };
}
export async function load(): Promise<void> {
  let json: string | null = null;
  db = await openDb();
  if (db) json = await idbGet();
  if (!json) { try { json = localStorage.getItem(KEY); } catch { memoryOnly = !db; } }
  if (json) { try { state = migrate(JSON.parse(json)); } catch (e) { console.warn('saved state unreadable', e); } }
  applySettings(); subs.forEach((f) => f());
}
export const exportJson = () => JSON.stringify(state, null, 1);
export function importJson(json: string) { const s = migrate(JSON.parse(json)); state = s; applySettings(); subs.forEach((f) => f()); scheduleSave(); }
export function resetAll() { state = defaults(); applySettings(); subs.forEach((f) => f()); scheduleSave(); }

// ---- dates ----
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (k: string, n: number) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
export const weekKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); const dt = new Date(y, m - 1, d); const monday = new Date(y, m - 1, d - ((dt.getDay() + 6) % 7)); return dayKey(monday); };
