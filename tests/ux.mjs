// Usability checks: guidance through locks, Back button, placement quiz, alternative answer modes, tools, themes.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const URL = process.env.APP_URL || 'http://localhost:5173/'; const shots = '/tmp/shots2'; fs.mkdirSync(shots, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle0' });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(220); return ok; };
const has = (t) => page.evaluate((t) => document.body.innerText.includes(t), t); // innerText skips hidden screens
const text = () => page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 300));
const shot = (n) => page.screenshot({ path: `${shots}/${n}.png` });
async function answer(correct = true) {
  return page.evaluate(async (correct) => {
    const q = window.__q, a = q.answer, input = await import('/src/input.ts'); const sl = (ms) => new Promise((r) => setTimeout(r, ms));
    const btn = (re) => [...document.querySelectorAll('button')].find((b) => re.test(b.textContent) && !b.disabled);
    if (a.kind === 'slots' || (a.kind === 'steps' && document.querySelector('[role=group][aria-label^="Note"], [role=group][aria-label="Degree"], [role=group][aria-label="Numeral"], [role=group][aria-label^="Chord "]'))) {
      const slots = a.kind === 'slots' ? a.slots : a.alt;
      for (const s of slots) { const grp = [...document.querySelectorAll('[role=group]')].find((g) => g.getAttribute('aria-label') === s.label); const want = correct ? s.value : s.choices.find((c) => c !== s.value); [...grp.querySelectorAll('.choice')].find((b) => b.textContent.trim().replace(/[✓✗]/g, '').trim().startsWith(want) && (b.textContent.trim() === want || b.querySelector('.score'))).click(); await sl(25); }
      btn(/^Check$/)?.click(); return 100;
    }
    for (const st of a.steps) { for (const m of st) { input.emitNote(correct ? m : m + 1, 'screen'); await sl(15); } if (st.length > 1) { btn(/Check chord/)?.click(); await sl(25); } if (!correct) break; }
    return 100;
  }, correct);
}
// ---- onboarding with the placement quiz ----
await clickText('Next'); await clickText('Next'); await clickText('Next'); await shot('01-placement');
await clickText('Take the placement quiz'); await sleep(300);
for (let i = 0; i < 12; i++) { await answer(i < 6); await sleep(i < 6 ? 800 : 1450); }   // first three levels right, the rest wrong
check('placement quiz places out of theory levels 1 to 3', await has('levels 1 to 3 are marked as passed'), await text());
await clickText('Start learning');
const placed = await page.evaluate(async () => { const { get } = await import('/src/store.ts'); return { n: Object.keys(get().lessons).length, xp: get().profile.xp }; });
check('placed lessons are passed without XP', placed.n === 23 && placed.xp < 400, JSON.stringify(placed));
await shot('02-home-placed');
// ---- fresh profile for the rest ----
await page.evaluate(async () => { const st = await import('/src/store.ts'); st.resetAll(); st.set((s) => { s.profile.onboarded = true; }); }); await sleep(200);
check('a new learner sees how the app works', await has('How this works')); await shot('03-home-fresh');
// pass all of theory level 1 quickly through the store, then look at the lock guidance
await page.evaluate(async () => { const { passLesson } = await import('/src/sched.ts'); ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6'].forEach((id) => passLesson(id, 5)); }); await sleep(200);
check('home explains the lock and offers the way through', await has('Theory level 2 is locked') && await has('Practise to unlock it'), await text()); await shot('04-home-gate');
await clickText('Learn', '.tabbar button'); await clickText('Beat, tempo and the measure', '.node');
check('a locked lesson says exactly what is needed and offers a drill', await has('So far: 0') && await has('Practise toward the unlock'), await text()); await shot('05-lock-sheet');
await clickText('Practise toward the unlock'); await sleep(300); check('the unlock drill starts', await has('1 / '), await text());
// phone/browser Back steps back inside the app
await page.goBack(); await sleep(400); check('the Back button returns to the previous screen instead of leaving', await has('72 lessons'), await text());
await clickText('Practice', '.tabbar button'); await clickText('Note identification', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(200);
await clickText('', '.topbar .iconbtn'); await sleep(450); check('the in-app back arrow still works', await has('All 27 exercises'), await text());
// practise every level-1 theory skill to "practiced" through real answers, then the level opens
await clickText('Home', '.tabbar button'); 
for (let round = 0; round < 12; round++) {
  if (!(await clickText('Practise to unlock it', '.card.tap'))) break; await sleep(300);
  const total = await page.evaluate(() => +document.querySelector('.chip').textContent.split('/')[1]);
  for (let i = 0; i < total; i++) { await answer(true); await sleep(880); }
  await clickText('Done'); await sleep(200);
}
const opened = await page.evaluate(async () => { const { lessonStatus } = await import('/src/sched.ts'); const { get } = await import('/src/store.ts'); const { LESSON_BY_ID } = await import('/src/content/index.ts'); return lessonStatus(get(), LESSON_BY_ID['2.1']); });
check('practising opens the next level', !(await has('Theory level 2 is locked')) && opened === 'available', opened + ' · ' + await text()); await shot('06-home-unlocked');
// a wrong answer sounds and shows the right one
await clickText('Practice', '.tabbar button'); await clickText('Note identification', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(200); await answer(false); await sleep(300);
check('after a miss the right key is marked on the keyboard', await page.evaluate(() => !!document.querySelector('.kb .mark-ok') && !!document.querySelector('.kb .mark-bad'))); await shot('07-miss'); await clickText('', '.topbar .iconbtn'); await sleep(450);
// rhythm dictation by picking the notation
await clickText('Rhythm dictation', '.node'); await page.evaluate(() => { const sel = [...document.querySelectorAll('.sheet select')].pop(); sel.value = 'pick'; sel.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(150);
await clickText('Start', '.sheet .btn.primary'); await sleep(400); await shot('08-rhythm-pick');
check('rhythm dictation can be answered by picking the written rhythm', await has('Which rhythm did you hear?') && (await page.evaluate(() => document.querySelectorAll('.choice .score svg').length)) === 3);
await answer(true); await sleep(300); check('the picked rhythm is graded', await has('Correct')); await clickText('', '.topbar .iconbtn'); await sleep(450);
// timed challenge from the practice sheet
await clickText('Interval identification', '.node'); await clickText('60 seconds'); await clickText('Start'); await sleep(300); await answer(true); await sleep(800);
check('the 60-second challenge runs from any exercise', await has('Score 10'), await text()); await clickText('', '.topbar .iconbtn'); await sleep(450);
// reading: tempo can be changed before starting
await clickText('One-hand phrase', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300);
const t1 = await page.evaluate(() => document.querySelector('.chip.accent').textContent); await clickText('−'); const t2 = await page.evaluate(() => document.querySelector('.chip.accent').textContent);
check('tempo can be lowered before a reading passage', parseInt(t2) === parseInt(t1) - 4, `${t1} -> ${t2}`); await shot('09-reading-tempo'); await clickText('', '.topbar .iconbtn'); await sleep(450);
// lesson -> practise what you unlocked -> Back lands on the lesson result, not the start
await page.evaluate(async () => { const { passLesson } = await import('/src/sched.ts'); ['2.1', '2.2'].forEach((id) => passLesson(id, 5)); }); await sleep(200);
await clickText('Learn', '.tabbar button'); await clickText('Rests', '.node'); await clickText('Start lesson'); for (let i = 0; i < 6; i++) { if (await has('Take the check')) break; await clickText('Next'); }
await clickText('Take the check'); await sleep(300); for (let i = 0; i < 5; i++) { await answer(true); await sleep(900); }
const credited = await page.evaluate(async () => { const { get } = await import('/src/store.ts'); return get().skills['2.3:0']?.recent.length; });
check('check answers count toward the new skill', (await has('Lesson passed')) && credited === 5, String(credited));
await clickText('Practise these now'); await sleep(300); check('can practise new skills straight from the lesson', await has('Practise what you unlocked'));
await clickText('', '.shell:not([hidden]) .topbar .iconbtn'); await sleep(500); check('going back returns to the lesson result', await has('Lesson passed') && await has('Continue'), await text()); await clickText('Continue'); await sleep(450);
// tools
await clickText('Home', '.tabbar button'); await clickText('', '[aria-label="Tools"]');
for (const [v, expect] of [['finder', 'Scale or chord'], ['interval', 'First note'], ['paper', 'Notes'], ['met', 'beats per minute'], ['tuner', 'microphone']]) { await page.select('main select', v); await sleep(250); check('tool: ' + v, await has(expect) && !(await has('Notation could not be drawn'))); await shot('tool-' + v); }
await clickText('', '.topbar .iconbtn'); await sleep(450);
// settings: dark theme and wide keys
await clickText('', '[aria-label="Settings"]'); await page.evaluate(() => { [...document.querySelectorAll('.checks label')].find((l) => l.textContent.includes('Dark theme')).querySelector('input').click(); }); await sleep(200);
check('dark theme applies', await page.evaluate(() => document.documentElement.dataset.theme === 'dark' && getComputedStyle(document.body).backgroundColor === 'rgb(17, 19, 24)')); await shot('10-settings-dark');
await clickText('', '.topbar .iconbtn'); await sleep(450); await clickText('Practice', '.tabbar button'); await clickText('Chord identification', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300); await shot('11-dark-exercise');
await clickText('', '.topbar .iconbtn'); await sleep(450); await clickText('Progress', '.tabbar button'); await sleep(200); await shot('12-progress-dark');
await clickText('Play', '.tabbar button'); await shot('13-play-dark');
check('no console or page errors', errors.length === 0, errors.slice(0, 6).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
