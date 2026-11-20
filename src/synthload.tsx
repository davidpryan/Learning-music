// The door to synth mode from the main bundle. Nothing here imports synth code directly, so music mode never downloads it.
import { lazy, Suspense, ComponentType } from 'react';

type Pack = typeof import('./synthpack');
let pack: Promise<Pack> | null = null, loaded = false;
/** Download synth mode (once). After this, its lessons, skills and exercises exist alongside the music ones. */
export const loadSynth = (): Promise<Pack> => (pack ??= import('./synthpack').then((m) => { loaded = true; return m; }));
export const synthLoaded = () => loaded;
/** A patch carried in the page address by a share link, noted as the app starts, before the address is tidied. */
export const sharedPatch = (() => { try { return location.hash.startsWith('#patch=') ? location.hash.slice(7) : ''; } catch { return ''; } })();

function later<K extends keyof Pack>(name: K): Pack[K] {
  const C = lazy(() => loadSynth().then((m) => ({ default: m[name] as ComponentType<any> })));
  return ((props: any) => <Suspense fallback={<div className="small muted" role="status">Loading…</div>}><C {...props} /></Suspense>) as any;
}
export const MatchArea = later('MatchArea'), VizView = later('VizView'), PatternArea = later('PatternArea'), PanelArea = later('PanelArea'), PanelFig = later('PanelFig'), PatchFig = later('PatchFig'), SoundsFig = later('SoundsFig');
export const Sandbox = later('Sandbox'), SynthPlay = later('SynthPlay'), SynthGame = later('SynthGame'), SynthPlacement = later('SynthPlacement');
export const SYNTH_GAME_NAME: Record<string, string> = { 's-name': 'Name That Sound', 's-rush': 'Knob Rush', 's-golf': 'Patch Golf' };
