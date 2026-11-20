// Synth mode against the dev server (it uses the dev-only question hook): pass a whole lesson, check the next one opens,
// check a looped phrase keeps sounding, that turning a knob starts your own sound, and that a share link opens its patch.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 });
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/fonts|ORB/.test(m.text())) errors.push(m.text()); });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].filter((x) => x.offsetParent !== null).find((x) => x.textContent.trim().startsWith(text)); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(350); return ok; };
const has = (t) => page.evaluate((t) => document.querySelector('.shell:not([hidden])').innerText.includes(t), t);
await page.evaluateOnNewDocument(() => { const orig = AudioNode.prototype.connect; window.__an = null; AudioNode.prototype.connect = function (d, ...a) { if (this instanceof AnalyserNode && !window.__an) window.__an = this; return orig.call(this, d, ...a); }; });
const level = () => page.evaluate(() => { const a = window.__an; if (!a) return 0; const b = new Float32Array(a.fftSize); a.getFloatTimeDomainData(b); return Math.sqrt(b.reduce((s, x) => s + x * x, 0) / b.length); });
const loudest = async (ms) => { let best = 0; for (let t = 0; t < ms; t += 120) { await sleep(120); best = Math.max(best, await level()); } return best; };
/** Answer the question on screen correctly, whatever kind it is. */
async function answer() {
  const kind = await page.evaluate(() => window.__q.answer.kind);
  if (kind === 'slots') {
    const n = await page.evaluate(() => window.__q.answer.slots.length);
    for (let i = 0; i < n; i++) await page.evaluate((i) => { const sl = window.__q.answer.slots[i], root = document.querySelector('.shell:not([hidden])'); const groups = [...root.querySelectorAll('[role=group]')].filter((g) => g.querySelector('.choice')); [...groups[i].querySelectorAll('.choice')].find((b) => b.firstChild.textContent === sl.value).click(); }, i);
    if (n > 1) await click('Check');
  } else throw new Error('unexpected kind ' + kind);
  await sleep(1300);
}
await page.goto(URL, { waitUntil: 'networkidle0' });
await click('Skip setup'); await click('Synth'); await click('Learn', '.tabbar button');
await click('S1.1', 'button.node'); await click('Start lesson');
await click('Play'); check('dev build: the worklet loads and the lesson figure sounds', (await loudest(1500)) > 0.01);
await click('Next'); await click('Next'); await sleep(300); await click('Take the check'); await sleep(500);
const planned = await page.evaluate(() => +(/Check · (\d+) questions/.exec(document.querySelector('.shell:not([hidden])').innerText)?.[1] ?? 0));
check('the check is planned: four questions for a lesson with four things to ask', planned === 4, 'planned ' + planned);
const asked = []; for (let i = 0; i < planned; i++) { asked.push(await page.evaluate(() => window.__q.prompt)); await answer(); }
check('no question in the check is asked twice', new Set(asked).size === asked.length, asked.join(' / '));
check('answering the check passes the lesson', await has('Lesson passed'), await page.evaluate(() => document.querySelector('.shell:not([hidden])').innerText.slice(0, 120)));
await click('Continue'); await sleep(400);
await click('S1.2', 'button.node'); check('the next lesson is open', await has('Start lesson')); await page.keyboard.press('Escape'); await sleep(300);
// a match: the loop must keep sounding, and a knob move must switch to your own sound
await click('Practice', '.tabbar button'); await click('S5', 'button.node'); await click('Start'); await sleep(500);
await click('Hear the target'); await sleep(2300);
check('a looped phrase still sounds on its second and third pass', (await loudest(2200)) > 0.01);
await click('Hear the target'); await sleep(900); check('pressing it again stops the sound', (await loudest(500)) < 0.005);
await page.focus('.shell:not([hidden]) [role=slider]'); await page.keyboard.press('ArrowDown');
check('turning a knob in silence starts your own sound', (await loudest(1500)) > 0.005 && await page.evaluate(() => [...document.querySelectorAll('.shell:not([hidden]) .tb-chip')].find((b) => b.textContent === 'Hear mine').getAttribute('aria-pressed') === 'true'));
// a share link
const p2 = await browser.newPage(); await p2.setViewport({ width: 390, height: 844 });
await p2.goto(URL + '#patch=' + Buffer.from(JSON.stringify({ o1w: 0, cut: 500 })).toString('base64'), { waitUntil: 'networkidle0' }); await sleep(800);
check('a share link opens the synth with its patch', await p2.evaluate(() => { const t = document.querySelector('.shell:not([hidden])')?.innerText ?? ''; return t.includes('The synth') && t.includes('500 Hz') && [...document.querySelectorAll('.shell:not([hidden]) .tb-chip')].some((b) => b.textContent === 'Sine' && b.getAttribute('aria-pressed') === 'true'); }));
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
