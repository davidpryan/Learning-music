import { createContext, useContext } from 'react';
import type { RunItem } from './ui/Runner';
export type Route =
  | { n: 'home' | 'learn' | 'practice' | 'play' | 'progress' | 'tools' | 'settings' | 'session' | 'sandbox' | 'splace' }
  | { n: 'lesson'; id: string }
  | { n: 'run'; title: string; sub?: string; items: RunItem[]; count: number; ctx: string; highKey?: string }
  | { n: 'timed'; title: string; ex: string; preset: Record<string, any>; highKey: string; skillId?: string }
  | { n: 'game'; id: string; daily?: boolean };
export const Nav = createContext<{ go: (r: Route) => void; back: () => void; toast: (t: string) => void }>({ go: () => {}, back: () => {}, toast: () => {} });
export const useNav = () => useContext(Nav);
