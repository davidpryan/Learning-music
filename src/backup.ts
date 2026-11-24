// Backups. Progress lives only in this browser, so the app nudges you to save a copy now and then.
// "Back up" opens the system share sheet where there is one (on an iPhone: Save to Files, iCloud Drive, Mail…)
// and falls back to an ordinary download.
import { exportJson, set, State } from './store';

const DAY = 86400000;
export const BACKUP_EVERY_DAYS = 14;
export const lastBackup = (s: State) => s.counters.lastBackup ?? 0;
/** Worth reminding: there is real progress, no backup for two weeks (or ever), and the reminder has not just been put off. */
export function backupDue(s: State, now = Date.now()): boolean {
  const some = s.profile.xp >= 150 || Object.values(s.lessons).filter((l) => l.passedAt).length >= 3;
  if (!some || (s.counters.backupSnooze ?? 0) > now) return false;
  return now - lastBackup(s) > BACKUP_EVERY_DAYS * DAY;
}
export function snoozeBackup(days = 3) { set((s) => { s.counters.backupSnooze = Date.now() + days * DAY; }); }
export function backupAge(s: State, now = Date.now()): string {
  const t = lastBackup(s); if (!t) return 'never backed up';
  const d = Math.floor((now - t) / DAY); return d <= 0 ? 'backed up today' : d === 1 ? 'backed up yesterday' : `last backed up ${d} days ago`;
}
export async function backupNow(): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  const json = exportJson(), name = `learning-music-${new Date().toISOString().slice(0, 10)}.json`;
  const done = (how: 'shared' | 'downloaded') => { set((s) => { s.counters.lastBackup = Date.now(); delete s.counters.backupSnooze; }); return how; };
  try {
    const file = new File([json], name, { type: 'application/json' }), nav = navigator as any;
    // only phones and tablets: on a desktop a plain download is what people expect
    if (nav.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
      try { await nav.share({ files: [file], title: 'Learning Music backup' }); return done('shared'); }
      catch (e: any) { if (e?.name === 'AbortError') return 'cancelled'; /* otherwise fall through to a download */ }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    return done('downloaded');
  } catch { return 'failed'; }
}
/** Ask the browser not to clear this site's data when the device runs low on space. Harmless where unsupported. */
export function keepStorage() { try { (navigator as any).storage?.persist?.().catch?.(() => {}); } catch { /* not available */ } }
