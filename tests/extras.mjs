// Write-on-staff answers, backup reminder, and flash-card review schedule, end to end in the browser.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 }); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle0' });
const click = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(280); return ok; };
const back = async () => { await click('', '.topbar .iconbtn'); await sleep(450); };
const text = () => page.evaluate(() => document.querySelector('.shell:not([hidden])').innerText);
await click('Skip setup');
// ---- write on staff ----
await click('Practice', '.tabbar button'); await click('Scale construction', '.node'); await click('Start', '.sheet .btn.primary');
check('keyboard-answer questions offer "Write on staff"', await click('Write on staff'));
const place = async (m) => { // drag to the line or space for MIDI note m (sharps for black keys) and let go
  const r = await page.evaluate(() => { const e = document.querySelector('.shell:not([hidden]) .staff-in').getBoundingClientRect(); return { x: e.left, y: e.top }; });
  const L = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6], S = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0], d = L[m % 12] + 7 * (Math.floor(m / 12) - 1);
  if (S[m % 12]) await click('♯'); const y = r.y + (48 + (38 - d) * 5) * 1.5;
  await page.mouse.move(r.x + 220, y - 40); await page.mouse.down(); await page.mouse.move(r.x + 220, y, { steps: 4 }); const tip = await page.evaluate(() => document.querySelector('.staff-tip')?.textContent); await page.mouse.up(); await sleep(180); return tip;
};
let steps = await page.evaluate(() => window.__q.answer.steps.map((s) => s[0]));
const tip = await place(steps[0]); for (const m of steps.slice(1)) await place(m);
check('while dragging, the note name is shown', /^[A-G][♯♭]?\d$/.test(tip ?? ''), String(tip));
check('a scale written correctly on the staff is marked correct', (await text()).includes('Correct'), (await text()).slice(0, 200));
await click('Next'); await sleep(300);
steps = await page.evaluate(() => window.__q.answer.steps.map((s) => s[0]));
await place(steps[0]); await place(steps[1] + 5);
const t2 = await text();
check('a wrong note written on the staff is marked wrong, with the right note shown', /Not quite|Incorrect|answer/i.test(t2) && (await page.evaluate(() => document.querySelectorAll('.shell:not([hidden]) .staff-in ellipse[fill="var(--ok)"]').length)) >= 1, t2.slice(0, 160));
const stays = await page.evaluate(async () => (await import('/src/store.ts')).get().profile.settings.staffEntry);
check('the choice of staff entry is remembered', stays === true);
await page.evaluate(async () => (await import('/src/store.ts')).set((s) => { s.profile.settings.staffEntry = false; }));
await back();
// a chord: place three notes, check
await click('Chord construction', '.node'); await click('Start', '.sheet .btn.primary'); await click('Write on staff');
const chord = await page.evaluate(() => window.__q.answer.steps[0]); for (const m of chord) await place(60 + ((m - 60) % 12 + 12) % 12);
await click('Check chord'); check('a chord written on the staff is marked correct', (await text()).includes('Correct'), (await text()).slice(0, 160));
await page.evaluate(async () => (await import('/src/store.ts')).set((s) => { s.profile.settings.staffEntry = false; })); await back();
// ---- backup reminder ----
await click('Home', '.tabbar button');
check('no backup reminder for a brand-new learner', !(await text()).includes('Back up your progress'));
await page.evaluate(async () => (await import('/src/store.ts')).set((s) => { s.profile.xp = 600; })); await sleep(250);
check('with progress and no backup, Home asks for one', (await text()).includes('Back up your progress') && (await text()).includes('never backed up'));
await click('Later'); check('"Later" puts the reminder away', !(await text()).includes('Back up your progress'));
await page.evaluate(async () => (await import('/src/store.ts')).set((s) => { delete s.counters.backupSnooze; })); await sleep(250);
const cdp = await page.createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'deny' });
await click('Back up now'); await sleep(400);
const lb = await page.evaluate(async () => (await import('/src/store.ts')).get().counters.lastBackup);
check('"Back up now" saves a copy and the reminder goes away', lb > Date.now() - 5000 && !(await text()).includes('Back up your progress'));
// ---- flash cards on a schedule ----
await click('Practice', '.tabbar button'); await click('Flash cards'); await click('Keys on the keyboard', '.node');
for (let i = 0; i < 3; i++) { await click('Show answer'); await click('Got it'); }
const due1 = await page.evaluate(async () => { const st = (await import('/src/store.ts')).get(); return Object.values(st.cardDue).map((t) => Math.round((t - Date.now()) / 86400000)); });
check('a known card is scheduled a day out', due1.length === 3 && due1.every((d) => d === 1), JSON.stringify(due1));
await page.evaluate(async () => (await import('/src/store.ts')).set((s) => { for (const k of Object.keys(s.cardDue)) s.cardDue[k] = Date.now() - 1000; })); await sleep(200);
await back(); await sleep(200);
check('due cards are counted on the deck list', (await text()).includes('Review 3 cards due today'), (await text()).slice(0, 200));
await back(); await click('Home', '.tabbar button'); await sleep(300); check('Home shows the cards to review', (await text()).includes('3 cards to review'), (await text()).slice(-300));
await click('3 cards to review', '.card.tap'); await click('Review 3 cards due today');
for (let i = 0; i < 3; i++) { await click('Show answer'); await click('Got it'); }
const due2 = await page.evaluate(async () => { const st = (await import('/src/store.ts')).get(); return [Object.values(st.cards), Object.values(st.cardDue).map((t) => Math.round((t - Date.now()) / 86400000))]; });
check('reviewing them moves each to a longer gap', due2[0].every((b) => b === 2) && due2[1].every((d) => d === 3) && (await text()).includes('Deck done'), JSON.stringify(due2));
check('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
