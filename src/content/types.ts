export type Fig =
  | { staff: string; clef?: 'treble' | 'bass'; key?: string; time?: [number, number]; bass?: string; perc?: boolean; play?: boolean; tempo?: number }
  | { kb: string; play?: boolean }
  | { circle: true }
  | { sound: string; label: string; tempo?: number }
  | { click: number; label: string }
  | { patch: Record<string, number>; label: string; view?: 'wave' | 'spectrum' | 'env'; seq?: string; vs?: Record<string, number>; vsLabel?: string }
  | { panel: string[]; patch: Record<string, number>; label?: string; view?: 'wave' | 'spectrum' | 'env'; seq?: string; limit?: Record<string, number> }
  | { sounds: [string, Record<string, number>][]; view?: 'wave' | 'spectrum' | 'env'; seq?: string };
export interface Step { t: string; fig?: Fig; try?: { ex: string; preset: Record<string, any> } }
export interface Unlock { ex: string; title: string; preset: Record<string, any> }
export interface Lesson { id: string; track: 'theory' | 'reading' | 'ear' | 'synth'; level: number; title: string; needs?: string[]; adds?: string[]; fill?: { ex: string; preset: Record<string, any> }; steps: Step[]; unlocks: Unlock[]; quiz?: { ex: string; preset: Record<string, any> }[] }
export const s = (t: string, fig?: Fig, tr?: { ex: string; preset: Record<string, any> }): Step => ({ t, fig, try: tr });
export const tr = (ex: string, preset: Record<string, any> = {}) => ({ ex, preset });
export const u = (ex: string, title: string, preset: Record<string, any> = {}): Unlock => ({ ex, title, preset });
export const L = (id: string, track: Lesson['track'], level: number, title: string, steps: Step[], unlocks: Unlock[], extra: Partial<Lesson> = {}): Lesson => ({ id, track, level, title, steps, unlocks, ...extra });
