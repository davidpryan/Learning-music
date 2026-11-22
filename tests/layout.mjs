// Layout stability: the keyboard (or tap pad) must sit in exactly the same place before the start,
// through the count-in and while playing, in every at-tempo exercise and game, at phone and landscape sizes.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 });
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(URL, { waitUntil: 'networkidle0' });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(220); return ok; };
const back = async () => { await click('', '.topbar .iconbtn'); await sleep(450); };
const has = (t) => page.evaluate((t) => document.body.innerText.includes(t), t);
/** Position of the input the hands rest on, in viewport coordinates. */
const where = () => page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); const el = root.querySelector('.kb') ?? root.querySelector('.tappad'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), scroll: Math.round(window.scrollY) }; });
const same = (a, b) => a && b && a.top === b.top && a.left === b.left && a.w === b.w && a.h === b.h;
async function throughStart(name, { listen = false } = {}) {
  await sleep(350); const scan = await where();
  await sleep(1200); const scanLater = await where();       // the on-screen timer has ticked
  await click(listen ? 'Listen' : 'Start now'); await sleep(250); const starting = await where();
  let listening = starting;
  if (listen) { await sleep(900); listening = await where(); await page.waitForFunction(() => /^[1-4]$/.test(document.querySelector('.shell:not([hidden]) .count')?.textContent ?? ''), { timeout: 20000 }); }
  const countin = await where();
  await page.waitForFunction(() => document.querySelector('.shell:not([hidden]) .perf-status')?.textContent.includes('Stop'), { timeout: 20000 }); const playing = await where();
  await sleep(1500); const playingLater = await where();
  const vis = await page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'), box = root.querySelector('.perf-score'), cur = root.querySelector('.score-cursor'); if (!box || !cur) return null; const b = box.getBoundingClientRect(), r = cur.getBoundingClientRect(); return r.top >= b.top - 14 && r.top < b.bottom - 40 && (r.bottom <= b.bottom + 14 || r.height > b.height - 20); });
  if (vis !== null) check(`${name}: the cursor is visible in the score box`, vis);
  const all = [scan, scanLater, starting, listening, countin, playing, playingLater];
  check(`${name}: input stays put from scan through count-in to playing`, all.every((x) => same(x, scan)), JSON.stringify(all.map((x) => x && [x.top, x.h, x.scroll])));
  await click('Stop'); await sleep(200); check(`${name}: and after Stop`, same(await where(), scan));
}
await click('Skip setup');
for (const size of [{ width: 390, height: 844, label: 'phone' }, { width: 844, height: 390, label: 'landscape' }, { width: 360, height: 640, label: 'small phone' }]) {
  await page.setViewport(size); await sleep(200);
  await click('Practice', '.tabbar button');
  for (const [ex, opts, level] of [['One-hand phrase', {}, null], ['Two-hand phrase', {}, null], ['Rhythm reading', {}, null], ['Rhythm dictation', { listen: true }, null], ['Lead sheet', {}, null], ['Piece reading', {}, null]]) {
    await click(ex, '.node'); await click('Start', '.sheet .btn.primary'); await throughStart(`${size.label} · ${ex}`, opts); await back();
  }
  // a long phrase (8 bars, level 5) so the score is taller than the screen
  await click('One-hand phrase', '.node'); await page.evaluate(() => { const sel = document.querySelector('.sheet select'); sel.value = '5'; sel.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(150); await click('Start', '.sheet .btn.primary'); await throughStart(`${size.label} · long phrase`); await back();
  await click('Play', '.tabbar button');
  await click('Rhythm Tap', '.node'); await click('1', '.grid-stage button'); await throughStart(`${size.label} · Rhythm Tap`); await back(); await back();
  await click('Open Road', '.node'); await click('Stage 1'); await throughStart(`${size.label} · Open Road`); await back(); await back();
}
await page.setViewport({ width: 390, height: 844 }); await sleep(200);
// the automatic countdown (no tap) must not move anything either
await click('Practice', '.tabbar button'); await click('One-hand phrase', '.node'); await page.evaluate(() => { const sel = document.querySelector('.sheet select'); sel.value = '1'; sel.dispatchEvent(new Event('change', { bubbles: true })); }); await click('Start', '.sheet .btn.primary'); await sleep(400);
const a0 = await where(); const seen = [a0];
for (let i = 0; i < 44; i++) { await sleep(500); seen.push(await where()); if (await has('Not yet') || await has('Passed')) break; }
const during = seen.filter(Boolean);
check('automatic countdown, count-in and the whole passage: keyboard never moves', during.length > 30 && during.every((x) => same(x, a0)), JSON.stringify([...new Set(during.map((x) => x.top))]));
await back();
// ear questions: the sound button keeps its size before and after the sound plays; hints and answers appear below the keyboard
const pg = await browser.newPage(); await pg.setViewport({ width: 390, height: 844 }); await pg.goto(URL, { waitUntil: 'networkidle0' });
const ear = await pg.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const root = () => document.querySelector('.shell:not([hidden])'); const top = () => Math.round(root().querySelector('.kb').getBoundingClientRect().top);
  const go = async (name) => { [...document.querySelectorAll('.tabbar button')].find((b) => b.textContent.includes('Practice')).click(); await wait(250); [...root().querySelectorAll('.node')].find((b) => b.textContent.includes(name)).click(); await wait(250); [...document.querySelectorAll('.sheet .btn.primary')].find((b) => b.textContent.includes('Start')).click(); await wait(400); };
  const out = {};
  await go('Scale degree identification'); const before = top(), label1 = [...root().querySelectorAll('button')].find((b) => /Play the sound|Hear it again/.test(b.textContent)).textContent;
  [...root().querySelectorAll('button')].find((b) => /Play the sound|Hear it again/.test(b.textContent)).click(); await wait(300); out.sound = [before, top(), label1, [...root().querySelectorAll('button')].find((b) => /Play the sound|Hear it again/.test(b.textContent)).textContent];
  [...root().querySelectorAll('button')].find((b) => b.textContent.includes('Hint')).click(); await wait(200); out.hint = [before, top()];
  const input = await import('/src/input.ts'); input.emitNote(61, 'screen'); await wait(300); out.answered = [before, top()];
  root().querySelector('.topbar .iconbtn').click(); await wait(450);
  await go('Chord construction'); const b2 = top(); [...root().querySelectorAll('.wk')][0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(100); [...root().querySelectorAll('button')].find((b) => b.textContent.includes('Check chord')).click(); await wait(300); out.chord = [b2, top(), !!root().querySelector('.feedback')];
  return out;
});
check('pressing "Play the sound" does not move the keyboard', ear.sound[0] === ear.sound[1], JSON.stringify(ear.sound));
check('a hint does not move the keyboard', ear.hint[0] === ear.hint[1], JSON.stringify(ear.hint));
check('answering does not move the keyboard (feedback and the answer appear below it)', ear.answered[0] === ear.answered[1] && ear.chord[0] === ear.chord[1] && ear.chord[2], JSON.stringify([ear.answered, ear.chord]));
// flash cards: turning a card over must not move the buttons
const fc = await pg.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const root = () => document.querySelector('.shell:not([hidden])'); const btn = (t) => [...root().querySelectorAll('button')].find((b) => b.textContent.includes(t));
  root().querySelector('.topbar .iconbtn')?.click(); await wait(450);
  [...document.querySelectorAll('.tabbar button')].find((b) => b.textContent.includes('Practice')).click(); await wait(250); btn('Flash cards').click(); await wait(300);
  const out = [];
  for (const d of ['Note and rest lengths', 'Keys on the keyboard', 'Treble clef notes', 'Key signatures', 'Major scales', 'Intervals', 'Chord types', 'Major and minor triads']) {
    [...root().querySelectorAll('.node')].find((b) => b.textContent.includes(d)).click(); await wait(350);
    for (let i = 0; i < 3; i++) { const a = Math.round(btn('Show answer').getBoundingClientRect().top); btn('Show answer').click(); await wait(250); const b = Math.round(btn('Got it').getBoundingClientRect().top); out.push([d, a, b]); btn(i === 1 ? 'Again' : 'Got it').click(); await wait(250); }
    root().querySelector('.topbar .iconbtn').click(); await wait(300);
  }
  const st = await import('/src/store.ts'); return { out, saved: Object.keys(st.get().cards).length };
});
check('flash cards: buttons stay put when a card is turned over', fc.out.every((x) => x[1] === x[2]), JSON.stringify(fc.out.filter((x) => x[1] !== x[2])));
check('flash cards: answers are saved', fc.saved >= 16, String(fc.saved));
check('no console or page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
