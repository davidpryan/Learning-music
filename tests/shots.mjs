// Screenshot tour at phone size, for visual review of every screen and game state.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const dir = '/tmp/shots3'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5 });
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(250); return ok; };
let n = 0; const shot = async (name, full = false) => { await page.screenshot({ path: `${dir}/${String(++n).padStart(2, '0')}-${name}.png`, fullPage: full }); };
const back = async () => { await click('', '.topbar .iconbtn'); await sleep(450); };
const answer = (correct = true) => page.evaluate(async (correct) => {
  const q = window.__q, a = q.answer, input = await import('/src/input.ts'); const sl = (ms) => new Promise((r) => setTimeout(r, ms)); const root = document.querySelector('.shell:not([hidden])');
  if (a.kind === 'slots' || (a.kind === 'steps' && root.querySelector('.choice'))) { for (const s of a.kind === 'slots' ? a.slots : a.alt) { const grp = [...root.querySelectorAll('[role=group]')].find((g) => g.getAttribute('aria-label') === s.label); const want = correct ? s.value : s.choices.find((c) => c !== s.value); [...grp.querySelectorAll('.choice')].find((b) => b.textContent.trim().startsWith(want)).click(); await sl(25); } [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Check')?.click(); return; }
  if (a.kind === 'steps') for (const st of a.steps) { for (const m of st) { input.emitNote(correct ? m : m + 1, 'screen'); await sl(15); } if (st.length > 1) { [...root.querySelectorAll('button')].find((b) => b.textContent.includes('Check chord'))?.click(); await sl(25); } if (!correct) break; }
}, correct);
await click('Skip setup');
// give the profile some history so screens are populated
await page.evaluate(async () => { const { passLesson, record, addMinutes, saveStars, saveBest } = await import('/src/sched.ts'); const { LESSONS } = await import('/src/content/index.ts'); const { SKILLS } = await import('/src/sched.ts'); const { set } = await import('/src/store.ts');
  LESSONS.filter((l) => (l.track === 'theory' && l.level <= 6) || ['R.1', 'R.2', 'R.3', 'R.4', 'E.1', 'E.2', 'E.3', 'E.4', 'E.5', 'E.6', 'E.7', 'E.8'].includes(l.id)).forEach((l) => passLesson(l.id, 5));
  Object.values(SKILLS).slice(0, 40).forEach((k, i) => { for (let j = 0; j < 12; j++) record({ skillId: k.id, ex: k.ex, ctx: 'practice', correct: (i + j) % 7 !== 0, ms: 2000, input: 'screen' }); });
  addMinutes(11); saveStars('rhythm:1', 3); saveStars('rhythm:2', 2); saveStars('detective:1', 3); saveBest('runner', 34); set((s) => { s.keyQuest = ['C', 'G', 'Am']; s.dailyLog = [{ d: '2026-11-14', game: 'echo', score: 5 }]; }); });
await sleep(400); await shot('home', true);
await click('Learn', '.tabbar button'); await shot('learn', true); await click('Major and minor triads', '.node'); await shot('learn-sheet');
await click('Review lesson'); await shot('lesson-step1'); await click('Next'); await shot('lesson-step2'); await click('Next'); await click('Next'); await shot('lesson-tryit', true); await click('Take the check'); await sleep(300); await shot('lesson-check', true); await answer(false); await sleep(400); await shot('lesson-check-wrong', true); await back();
await click('The circle of fifths', '.node'); await click('Review lesson'); await shot('lesson-circle', true); await back();
await click('Cadences', '.node'); await click('Review lesson'); await shot('lesson-sound'); await back();
await click('The grand staff and middle C', '.node'); await click('Review lesson'); await shot('lesson-grand'); await back();
await click('Practice', '.tabbar button'); await shot('practice', true); await click('Chord identification', '.node'); await shot('practice-sheet', true); await click('', '.sheet .iconbtn');
for (const [name, key] of [['Key signature identification', 'keysig'], ['Measure completion', 'measure'], ['Interval identification', 'interval'], ['Roman numeral analysis', 'roman'], ['Two-hand phrase', 'twohand'], ['Piece reading', 'piece'], ['Lead sheet', 'lead'], ['Sight-singing', 'sing'], ['Scale degree identification', 'degree'], ['Melodic dictation', 'melody'], ['Chord quality', 'quality'], ['Progression dictation', 'prog']]) { await click(name, '.node'); await click('Start', '.sheet .btn.primary'); await sleep(450); await shot('ex-' + key, true); await back(); }
await click('Play', '.tabbar button'); await shot('play', true);
await click('Chord Builder Rush', '.node'); await shot('rush-tiers'); await click('Bronze'); await shot('rush-ready'); await click('Start'); await sleep(300); await answer(true); await sleep(250); await shot('rush-correct'); await sleep(700); await answer(false); await sleep(400); await shot('rush-wrong'); await back(); await back();
await click('Key Quest', '.node'); await shot('quest'); await back();
await click('Theory Boss', '.node'); await shot('boss-list'); await click('Level 1 boss'); await sleep(300); await answer(false); await sleep(400); await shot('boss-play'); await back(); await back();
await click('Staff Runner', '.node'); await shot('runner-tiers'); await click('Gold'); await sleep(3000); await shot('runner-play'); await back(); await back();
await click('Rhythm Tap', '.node'); await shot('rhythm-stages', true); await click('1', '.grid-stage button'); await sleep(300); await shot('rhythm-scan'); await click('Start now'); await sleep(5200); await page.evaluate(async () => { const i = await import('/src/input.ts'); i.emitTap('screen'); }); await sleep(150); await shot('rhythm-play'); await sleep(18000); await shot('rhythm-result'); await click('Stages'); await back();
await click('Open Road', '.node'); await shot('road-tiers'); await click('Stage 5'); await sleep(400); await shot('road-twohand', true); await back(); await back();
await click('Echo', '.node'); await shot('echo-start'); await click('Start'); await sleep(300); await shot('echo-play'); await back();
await click('Degree Dash', '.node'); await shot('dash-tiers'); await back();
await click('Progression Detective', '.node'); await shot('detective-list'); await click('2', '.grid-stage button'); await click('Listen'); await shot('detective-case', true); await back(); await back();
await click('Progress', '.tabbar button'); await shot('progress', true);
await click('Home', '.tabbar button'); await click("Start today's session"); await sleep(300); await shot('session', true); await back();
await click('', '[aria-label="Settings"]'); await shot('settings', true); await back();
await click('', '[aria-label="Tools"]'); for (const v of ['finder', 'interval', 'paper', 'met']) { await page.select('main select', v); await sleep(300); await shot('tool-' + v, true); } await back();
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1.5 }); await click('Practice', '.tabbar button'); await click('One-hand phrase', '.node'); await click('Start', '.sheet .btn.primary'); await sleep(400); await shot('landscape-reading', true); await back();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 }); await click('Home', '.tabbar button'); await sleep(300); await shot('desktop-home'); await click('Play', '.tabbar button'); await shot('desktop-play'); await click('Practice', '.tabbar button'); await click('Chord construction', '.node'); await click('Start', '.sheet .btn.primary'); await sleep(300); await shot('desktop-exercise');
console.log('errors:', errors.length, errors.slice(0, 5).join(' | ')); console.log(fs.readdirSync(dir).join(' '));
await browser.close();
