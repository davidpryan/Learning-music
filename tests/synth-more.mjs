// More of synth mode against the dev server: the placement quiz, the three games, the pattern and Translate exercises,
// and a check that music mode does not download the synth bundle.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 });
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/fonts|ORB/.test(m.text())) errors.push(m.text()); });
const reqs = []; page.on('request', (r) => reqs.push(r.url()));
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].filter((x) => x.offsetParent !== null).find((x) => x.textContent.trim().startsWith(text)); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(350); return ok; };
const has = (t) => page.evaluate((t) => document.querySelector('.shell:not([hidden])').innerText.includes(t), t);
const text = () => page.evaluate(() => document.querySelector('.shell:not([hidden])').innerText.slice(0, 160).replace(/\n/g, ' | '));
const back = async () => { await page.evaluate(() => history.back()); await sleep(500); };
async function answerSlots() {
  const n = await page.evaluate(() => window.__q.answer.slots.length);
  for (let i = 0; i < n; i++) await page.evaluate((i) => { const sl = window.__q.answer.slots[i], root = document.querySelector('.shell:not([hidden])'); const groups = [...root.querySelectorAll('[role=group]')].filter((g) => g.querySelector('.choice')); [...groups[i].querySelectorAll('.choice')].find((b) => b.firstChild.textContent === sl.value).click(); }, i);
  if (n > 1) await click('Check');
}
await page.goto(URL, { waitUntil: 'networkidle0' });
await click('Skip setup'); await sleep(300);
check('music mode has not downloaded any synth code', !reqs.some((u) => /synthpack|src\/synth\/|content\/synth/.test(u)), reqs.filter((u) => /synth/.test(u)).slice(0, 2).join(' '));
await click('Synth'); await sleep(900);
check('choosing Synth downloads it and switches mode', reqs.some((u) => /synthpack/.test(u)) && await has('Learn to use a synthesizer'));
// placement
await click('Already know the basics'); await click('Start the quiz'); await sleep(400);
for (let i = 0; i < 12; i++) { await answerSlots(); await sleep(1100); }
await sleep(600);
check('twelve right answers place the learner at unit 5', await has('You start at unit 5'), await text());
await click('Done') || await click('Continue') || await click('Back'); await sleep(300);
await click('Learn', '.tabbar button'); await page.evaluate(() => [...document.querySelectorAll('.shell:not([hidden]) button.node')].find((b) => b.textContent.includes('S5.1')).click()); await sleep(350);
check('unit 5 is open straight away', await has('Start lesson'), await text()); await page.keyboard.press('Escape'); await sleep(300);
// games
await click('Play', '.tabbar button');
check('the Play tab lists three synth games, all open', await has('Name That Sound') && await has('Knob Rush') && await has('Patch Golf') && await page.evaluate(() => [...document.querySelectorAll('.shell:not([hidden]) button.node')].every((b) => !b.disabled)));
await click('Name That Sound', 'button.node'); await click('Start'); await sleep(500);
await answerSlots(); await sleep(900); await answerSlots(); await sleep(900);
check('Name That Sound scores right answers with a combo', await has('Score 30') && await has('Combo ×3'), await text()); await back();
await click('Knob Rush', 'button.node'); await click('Start'); await sleep(500);
check('Knob Rush shows a target and a knob', await page.evaluate(() => !!document.querySelector('.shell:not([hidden]) .tb-trace .aim') && !!document.querySelector('.shell:not([hidden]) [role=slider]')));
// sweep the knob across its range: it must cross the target and score
await page.focus('.shell:not([hidden]) [role=slider]'); let scored = false;
for (const key of ['ArrowDown', 'ArrowUp']) { for (let i = 0; i < 55 && !scored; i++) { await page.keyboard.press(key); scored = await has('Matched 1'); } }
check('sweeping the knob through the target scores a match', scored, await text()); await back();
await click('Patch Golf', 'button.node'); await click('Tee off'); await sleep(400); await click('Check: stroke 1'); await sleep(300);
check('a missed stroke in Patch Golf names the control to move', await has('furthest off') && await has('Stroke 2 of 6'), await text()); await back();
// the pattern exercise
await click('Practice', '.tabbar button'); await click('S15', 'button.node'); await click('Start'); await sleep(500);
await page.evaluate(() => { const a = window.__q.answer, rows = [...a.pitches].reverse(), cells = [...document.querySelectorAll('.shell:not([hidden]) .tb-cell')]; a.target.forEach((v, c) => { if (v != null) cells[rows.indexOf(v) * a.target.length + c].click(); }); }); await sleep(300);
await click('Check my pattern');
check('entering the heard pattern is marked correct', await has('Correct'), await text()); await back();
// Translate on another synth's panel
await click('S14', 'button.node'); await click('Start'); await sleep(500);
const moved = await page.evaluate(() => { const a = window.__q.answer, root = document.querySelector('.shell:not([hidden])'), lab = a.labels[a.target]; if (a.skin === 'menu') { const b = root.querySelector(`button[aria-label="${lab} ${a.up ? 'up' : 'down'}"]`); b.setAttribute('data-go', '1'); return 'menu'; } const el = root.querySelector(`[role=slider][aria-label="${lab}"]`); el.focus(); return a.skin + (a.up ? ' up' : ' down'); });
if (moved === 'menu') for (let i = 0; i < 5; i++) { await page.click('[data-go]'); await sleep(60); }
else for (let i = 0; i < 12; i++) await page.keyboard.press(moved.endsWith('up') ? 'ArrowUp' : 'ArrowDown');
await sleep(300); await click('Check');
check('turning the right control on a foreign panel is marked correct', await has('Correct'), moved + ' · ' + await text()); await back();
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
