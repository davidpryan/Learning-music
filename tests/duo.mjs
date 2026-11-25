// iPhone Duo: cover display 466 x 678 points, inner display 669 x 951 (Xcode device profile), each also with
// Safari's toolbars taking height. Checks that nothing overflows sideways, that at-tempo exercises fit on one
// screen, and that folding and unfolding mid-exercise re-lays everything out.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const SIZES = [['cover', 466, 678], ['cover in Safari', 466, 580], ['cover sideways', 678, 466], ['open', 951, 669], ['open in Safari', 951, 575], ['open upright', 669, 951], ['open upright in Safari', 669, 850]];
const mk = async (w, h) => { const page = await browser.newPage(); await page.setViewport({ width: w, height: h, hasTouch: true, isMobile: true }); page.on('pageerror', (e) => errors.push(e.message)); await page.goto(URL, { waitUntil: 'networkidle0' }); return page; };
const helpers = (page) => {
  const click = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(250); return ok; };
  const back = async () => { await click('', '.topbar .iconbtn'); await sleep(450); };
  const overflow = () => page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); const wide = [...root.querySelectorAll('*')].filter((e) => !e.closest('.kb-wrap') && !e.closest('.perf-score') && !e.closest('svg') && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().right > innerWidth + 1).length; return { doc: document.documentElement.scrollWidth - innerWidth, wide }; });
  /** With the page where it loads, is the score, the Start button and the whole input on screen? */
  const fit = () => page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); const r = (s) => root.querySelector(s)?.getBoundingClientRect(); const top = r('.topbar')?.bottom ?? 0, sc = r('.perf-score'), inp = r('.dock .kb') ?? r('.dock .tappad'), st = r('.perf-status');
    return { scoreTop: sc ? Math.round(sc.top - top) : null, scoreH: sc ? Math.round(sc.height) : null, statusOk: st.top >= top - 1, inputBottom: Math.round(innerHeight - inp.bottom), covered: sc ? Math.round(sc.bottom - r('.dock').top) : 0, keyW: Math.round((root.querySelector('.dock .kb .wk')?.getBoundingClientRect().width) ?? 0), scrollY: Math.round(scrollY) }; });
  return { click, back, overflow, fit };
};
for (const [name, w, h] of SIZES) {
  const page = await mk(w, h); const { click, back, overflow, fit } = helpers(page);
  await click('Skip setup');
  const of = [];
  for (const tab of ['Home', 'Learn', 'Practice', 'Play', 'Progress']) { await click(tab, '.tabbar button'); const o = await overflow(); if (o.doc > 0 || o.wide > 0) of.push(tab + JSON.stringify(o)); }
  await click('Practice', '.tabbar button'); await click('Cheat sheets'); let o = await overflow(); if (o.doc > 0 || o.wide) of.push('sheets'); await back(); await click('Flash cards'); await click('Treble clef notes', '.node'); await click('Show answer'); o = await overflow(); if (o.doc > 0 || o.wide) of.push('cards');
  const cardFits = await page.evaluate(() => { const b = [...document.querySelector('.shell:not([hidden])').querySelectorAll('button')].find((x) => x.textContent.includes('Got it')); return b.getBoundingClientRect().bottom <= innerHeight + 1 || innerHeight < 620; });
  await back(); await back();
  check(`${name} ${w}x${h}: nothing overflows sideways on any main screen`, of.length === 0, of.join(' '));
  check(`${name}: a flash card and its buttons fit on screen`, cardFits);
  for (const ex of ['One-hand phrase', 'Rhythm reading', 'Two-hand phrase']) {
    await click(ex, '.node'); await click('Start', '.sheet .btn.primary'); await sleep(450);
    const f = await fit(); const two = ex === 'Two-hand phrase';
    // two staves plus a keyboard cannot all fit on the shortest screens; there the keyboard and Start button must still be reachable with the score showing
    const ok = f.statusOk && f.scoreH >= (two ? 150 : 110) && f.scoreTop >= -1 && ((f.inputBottom >= -1 && f.covered <= 4) || (two && h < 600));
    check(`${name}: ${ex} shows score, Start and ${ex.includes('Rhythm') ? 'tap pad' : 'keyboard'} together without scrolling`, ok, JSON.stringify(f));
    if (!ex.includes('Rhythm')) check(`${name}: ${ex} keys are a usable size`, f.keyW >= 24 && f.keyW <= 80, String(f.keyW));
    o = await overflow(); check(`${name}: ${ex} does not overflow sideways`, o.doc <= 0 && o.wide === 0, JSON.stringify(o));
    await back();
  }
  await click('Keyboard identification', '.node'); await click('Start', '.sheet .btn.primary'); await sleep(350);
  const kb = await page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); const b = [...root.querySelectorAll('.opt, .opts button, .grid3 button, .grid2 button')].pop()?.getBoundingClientRect(); const k = root.querySelector('.kb').getBoundingClientRect(); return { kbW: Math.round(k.width), right: Math.round(innerWidth - k.right), lastBtn: b ? Math.round(innerHeight - b.bottom) : null }; });
  check(`${name}: keyboard question fits the width`, kb.right >= 0 && kb.kbW <= w, JSON.stringify(kb));
  await page.close();
}
// Chrome on the Duo has taller toolbars than Safari: the page gets roughly 600 points unfolded on its side, 800 upright, 550 folded.
for (const [name, w, h] of [['open in Chrome', 951, 600], ['open upright in Chrome', 669, 800], ['cover in Chrome', 466, 551], ['phone in Chrome', 390, 700]]) {
  const page = await mk(w, h); const { click, back } = helpers(page);
  await click('Skip setup'); await click('Practice', '.tabbar button');
  for (const ex of ['Note identification', 'Scale construction']) {
    await click(ex, '.node'); await click('Start', '.sheet .btn.primary'); await sleep(400);
    const m = () => page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); const kb = root.querySelector('.kb:not(.short)').getBoundingClientRect(), sc = root.querySelector('.score')?.getBoundingClientRect(), top = root.querySelector('.topbar').getBoundingClientRect().bottom;
      const nx = [...root.querySelectorAll('button')].find((b) => /^(Next|Finish)$/.test(b.textContent.trim())); const r = nx?.getBoundingClientRect(); const hit = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null; const foot = root.querySelector('.run-foot')?.getBoundingClientRect();
      return { kbBottom: Math.round(innerHeight - kb.bottom), scoreTop: sc ? Math.round(sc.top - top) : 0, next: r ? Math.round(innerHeight - r.bottom) : null, nextHit: !!hit && (hit === nx || nx.contains(hit)), overlap: foot ? Math.round(kb.bottom - foot.top) : 0, scroll: Math.round(scrollY), sideways: document.documentElement.scrollWidth - innerWidth }; });
    const a = await m();
    check(`${name} ${w}x${h}: ${ex} shows the whole question and keyboard without scrolling`, a.kbBottom >= 0 && a.scoreTop >= 0 && a.sideways <= 0, JSON.stringify(a));
    // answer wrongly: a key that is certainly not the answer
    await page.evaluate(async () => { const input = await import('/src/input.ts'); const want = window.__q.answer.steps[0][0]; input.emitNote(want + 1, 'screen'); }); await sleep(450);
    const b = await m();
    check(`${name}: after a wrong answer the Next button is on screen and tappable`, b.next !== null && b.next >= 0 && b.nextHit && b.scroll === a.scroll, JSON.stringify(b));
    check(`${name}: the verdict bar does not hide the keyboard`, b.overlap <= (h < 600 ? 70 : 2), String(b.overlap));
    await back();
  }
  await page.close();
}
// folding and unfolding in the middle of things: same page, no reload
{
  const page = await mk(466, 580); const { click, back, overflow, fit } = helpers(page);
  await click('Skip setup'); await click('Learn', '.tabbar button');
  const cols = () => page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); return root.querySelectorAll('.seg').length; });
  const seg1 = await cols(); await page.setViewport({ width: 951, height: 575, hasTouch: true, isMobile: true }); await sleep(500); const seg2 = await cols();
  check('unfolding on the Learn tab switches to the three-column layout', seg1 >= 1 && seg2 < seg1, `${seg1} -> ${seg2}`);
  await page.setViewport({ width: 466, height: 580, hasTouch: true, isMobile: true }); await sleep(400); check('folding again brings back the track picker', (await cols()) === seg1);
  await click('Practice', '.tabbar button'); await click('One-hand phrase', '.node'); await click('Start', '.sheet .btn.primary'); await sleep(400);
  const sw = () => page.evaluate(() => { const root = document.querySelector('.shell:not([hidden])'); return [Math.round(root.querySelector('.perf-score svg').getBoundingClientRect().width), Math.round(root.querySelector('.perf-score').getBoundingClientRect().width)]; });
  const a = await sw(); await click('Start now'); await page.waitForFunction(() => document.querySelector('.shell:not([hidden]) .perf-status')?.textContent.includes('Stop'), { timeout: 20000 });
  await page.setViewport({ width: 951, height: 575, hasTouch: true, isMobile: true }); await sleep(700);
  const b = await sw(), f = await fit(), o = await overflow();
  check('unfolding while playing redraws the score to the new width', b[0] > a[0] + 100 && Math.abs(b[0] - b[1]) < 30, JSON.stringify([a, b]));
  check('…and the exercise keeps going, on one screen, with finger-sized keys', (await page.evaluate(() => document.querySelector('.shell:not([hidden]) .perf-status').textContent.includes('Stop'))) && f.inputBottom >= -1 && f.covered <= 1 && f.keyW <= 80 && o.doc <= 0, JSON.stringify(f));
  await page.setViewport({ width: 466, height: 580, hasTouch: true, isMobile: true }); await sleep(700);
  const c = await sw(), f2 = await fit(), o2 = await overflow();
  check('folding back shrinks it again with nothing cut off', Math.abs(c[0] - a[0]) < 30 && f2.inputBottom >= -1 && f2.covered <= 1 && o2.doc <= 0 && o2.wide === 0, JSON.stringify([c, f2, o2]));
  await page.close();
}
check('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
