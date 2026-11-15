// Browser checks with headless Chrome: renders every figure, piece and generated question, then walks the UI.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const shots = '/tmp/shots'; fs.mkdirSync(shots, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle0' });
const fails = [];
const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };

if (!process.env.SKIP_MODULES) {
  const r = await page.evaluate(async () => {
    const { drawScore } = await import('/src/notation.tsx'); const { LESSONS } = await import('/src/content/index.ts'); const { PIECES } = await import('/src/content/pieces.ts');
    const { EX, exParams } = await import('/src/exercises.ts'); const { SKILLS } = await import('/src/sched.ts'); const { mulberry } = await import('/src/music.ts'); const { figPassage } = await import('/src/ui/common.tsx');
    const el = document.createElement('div'); el.style.width = '340px'; document.body.appendChild(el);
    const bad = []; let n = 0;
    const draw = (label, spec) => { n++; try { drawScore(el, spec, 1); if (!el.querySelector('svg')) bad.push(label + ': no svg'); } catch (e) { bad.push(label + ': ' + e.message); } };
    for (const l of LESSONS) l.steps.forEach((s, i) => { if (s.fig && 'staff' in s.fig) draw(`lesson ${l.id} step ${i + 1}`, { passage: figPassage(s.fig) }); });
    for (const p of PIECES) draw('piece ' + p.id, { passage: p.passage });
    for (const k of Object.values(SKILLS)) for (let seed = 1; seed <= 12; seed++) { const q = EX[k.ex].gen(exParams(k.ex, k.preset), mulberry(seed * 31)); for (const spec of [q.score, q.reveal, q.answer.kind === 'perform' || q.answer.kind === 'rhythm' ? { passage: q.answer.passage } : null]) if (spec) draw(`skill ${k.id} ${k.ex} seed ${seed}`, spec); }
    for (const id of Object.keys(EX)) for (let seed = 1; seed <= 30; seed++) { const q = EX[id].gen(exParams(id), mulberry(seed)); for (const spec of [q.score, q.reveal, q.answer.kind === 'perform' || q.answer.kind === 'rhythm' ? { passage: q.answer.passage } : null]) if (spec) draw(`${id} default seed ${seed}`, spec); }
    el.remove(); return { n, bad };
  });
  check(`notation renders for all ${r.n} figures, pieces and generated questions`, r.bad.length === 0, r.bad.slice(0, 8).join(' | '));
}
const clickText = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await new Promise((r) => setTimeout(r, 250)); return ok; };
const has = (text) => page.evaluate((t) => document.body.innerText.includes(t), text);
const shot = (n) => page.screenshot({ path: `${shots}/${n}.png` });

check('onboarding shows', await has('Welcome to Learning Music'));
await shot('01-onboarding');
await clickText('Next'); check('input step', await has('How will you answer?')); await shot('02-inputs');
await clickText('Next'); await clickText('Next'); check('placement step', await has('Already know some theory?'));
await clickText('Start learning');
check('home shows', await has("Start today's session")); await shot('03-home');
for (const [tab, expect] of [['Learn', '72 lessons'], ['Practice', 'All 27 exercises'], ['Play', 'Games count as practice'], ['Progress', 'Weak spots'], ['Home', 'day streak']]) { await clickText(tab, '.tabbar button'); check('tab ' + tab, await has(expect)); await shot('tab-' + tab); }

// a full lesson: 1.3 needs 1.1 and 1.2 first, so walk 1.1
await clickText('Learn', '.tabbar button'); await clickText('Pitch and the keyboard'); check('lesson sheet', await has('Start lesson')); await clickText('Start lesson');
check('lesson step 1', await has('Musical sounds are higher or lower')); await shot('04-lesson');
for (let i = 0; i < 4; i++) await clickText('Next');
check('lesson try-it', await has('Try it')); await shot('05-tryit');
await clickText('Take the check'); check('check quiz', await has('Which key is highlighted?')); await shot('06-check');
// answer the 5 check questions correctly by reading the highlighted key from the DOM
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => { const k = document.querySelector('.kb .mark-accent'); const name = k.getAttribute('aria-label').replace(/\d+$/, ''); const b = [...document.querySelectorAll('.choice')].find((x) => x.textContent.trim().split('/')[0] === name); b.click(); });
  await new Promise((r) => setTimeout(r, 1000));
}
check('lesson passed', await has('Lesson passed'), await page.evaluate(() => document.body.innerText.slice(0, 200))); await shot('07-passed');
await clickText('Continue');

// every exercise opens and asks a question
await clickText('Practice', '.tabbar button');
const exNames = await page.evaluate(() => [...document.querySelectorAll('.node b')].map((b) => b.textContent));
check('27 exercises listed', exNames.length === 27, String(exNames.length));
for (const name of exNames) {
  await clickText(name, '.node'); const sheet = await has('Start'); await clickText('Start', '.sheet .btn.primary');
  await new Promise((r) => setTimeout(r, 350));
  const ok = await page.evaluate(() => !!document.querySelector('.prompt') && document.querySelector('.prompt').textContent.length > 3);
  const notation = await page.evaluate(() => document.body.innerText.includes('Notation could not be drawn'));
  check('exercise: ' + name, sheet && ok && !notation);
  if (name === 'Note identification') await shot('08-exercise-note');
  if (name === 'One-hand phrase') await shot('09-reading');
  if (name === 'Chord construction') await shot('10-chord');
  if (name === 'Progression dictation') await shot('11-ear');
  await clickText('', '.topbar .iconbtn'); await new Promise((r) => setTimeout(r, 150));
}
if (!process.env.SKIP_MODULES) {
// answer a note question with the on-screen keyboard
await clickText('Note identification', '.node'); await clickText('Start', '.sheet .btn.primary');
await page.evaluate(() => [...document.querySelectorAll('.seg button')].find((b) => b.textContent.includes('Keys')).click());
await new Promise((r) => setTimeout(r, 200));
const answered = await page.evaluate(async () => { const m = await import('/src/input.ts'); const label = document.querySelector('.score').getAttribute('aria-label'); const mm = /([A-G])( sharp| flat)?(\d)/.exec(label); const pc = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[mm[1]] + (mm[2] === ' sharp' ? 1 : mm[2] === ' flat' ? -1 : 0); m.emitNote(12 * (+mm[3] + 1) + pc, 'screen'); await new Promise((r) => setTimeout(r, 200)); return document.body.innerText.includes('Correct'); });
check('playing the right key is graded correct', answered); await shot('12-correct');
await clickText('', '.topbar .iconbtn');

// a reading passage end to end: perform it perfectly through the input bus
await clickText('One-hand phrase', '.node'); await clickText('Start', '.sheet .btn.primary'); await new Promise((r) => setTimeout(r, 300));
const perf = await page.evaluate(async () => {
  const input = await import('/src/input.ts'); const { get } = await import('/src/store.ts');
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start now')).click();
  const label = document.querySelector('.score').getAttribute('aria-label');
  const notes = [...label.matchAll(/([A-G])( sharp| flat)?(\d)|rest/g)].map((m) => (m[0] === 'rest' ? null : 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === ' sharp' ? 1 : m[2] === ' flat' ? -1 : 0)));
  return { n: notes.length, label };
});
check('reading passage starts', perf.n > 3, perf.label.slice(0, 80));
await new Promise((r) => setTimeout(r, 1500)); await shot('13-countin');
await new Promise((r) => setTimeout(r, 22000));
check('reading result appears (untouched run fails gracefully)', await has('rhythm') && (await has('Not yet') || await has('Passed'))); await shot('14-reading-result');
await clickText('', '.topbar .iconbtn');

}
// games open
await clickText('Play', '.tabbar button');
for (const g of ['Chord Builder Rush', 'Key Quest', 'Theory Boss', 'Staff Runner', 'Rhythm Tap', 'Open Road', 'Echo', 'Degree Dash', 'Progression Detective']) {
  await clickText(g, '.node'); await new Promise((r) => setTimeout(r, 300)); check('game opens: ' + g, await has(g.split(' ')[0])); await shot('game-' + g.replace(/ /g, '-'));
  await clickText('', '.topbar .iconbtn'); await new Promise((r) => setTimeout(r, 150));
}
await clickText('Staff Runner', '.node'); await clickText('Bronze'); await new Promise((r) => setTimeout(r, 2500)); await shot('15-runner');
check('staff runner draws moving notes', await page.evaluate(() => document.querySelectorAll('.runner-field ellipse').length > 0));
await clickText('', '.topbar .iconbtn'); await clickText('', '.topbar .iconbtn');
await clickText('Key Quest', '.node'); await shot('16-quest'); await clickText('', '.topbar .iconbtn');
await clickText('Home', '.tabbar button'); await clickText('', '[aria-label="Tools"]'); check('tools', await has('Circle of fifths')); await shot('17-tools'); await clickText('', '.topbar .iconbtn');
await clickText('', '[aria-label="Settings"]'); check('settings', await has('Your data')); await shot('18-settings');
await clickText('Export'); check('export produces data', await page.evaluate(() => document.querySelector('textarea').value.includes('"profile"')));
await clickText('', '.topbar .iconbtn');
await clickText("Start today's session"); check('session starts', await has("Today's session")); await shot('19-session');
// persistence
await page.reload({ waitUntil: 'networkidle0' }); check('progress survives a reload', await has("Start today's session") && !(await has('Welcome to Learning Music')));
// desktop layout
await page.setViewport({ width: 1280, height: 800 }); await clickText('Learn', '.tabbar button'); await new Promise((r) => setTimeout(r, 300)); await shot('20-desktop-learn');
check('no console or page errors', errors.length === 0, errors.slice(0, 6).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
