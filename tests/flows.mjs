// Functional flows in headless Chrome: answers questions for real through the input bus and checks grading, unlocks, games and data handling.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 });
const errors = []; page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle0' });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (text, sel = 'button') => { const ok = await page.evaluate((text, sel) => { const root = document.querySelector('.sheet-bg') ?? document.querySelector('.shell:not([hidden])') ?? document; const b = [...(sel.startsWith('.tabbar') ? document : root).querySelectorAll(sel)].find((x) => x.textContent.trim().includes(text) && !x.disabled); if (b) { b.click(); return true; } return false; }, text, sel); await sleep(200); return ok; };
const has = (text) => page.evaluate((t) => document.body.innerText.includes(t), text);
const back = () => clickText('', '.topbar .iconbtn');
const text = () => page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 260));
/** Answer the question on screen. Returns ms to wait for the result. */
async function answer(correct = true) {
  return page.evaluate(async (correct) => {
    const q = window.__q, a = q.answer, input = await import('/src/input.ts'); const sl = (ms) => new Promise((r) => setTimeout(r, ms)); const root = document.querySelector('.shell:not([hidden])');
    const btn = (re) => [...root.querySelectorAll('button')].find((b) => re.test(b.textContent) && !b.disabled);
    if (a.kind === 'slots' || (a.kind === 'steps' && root.querySelector('.choices'))) {
      const slots = a.kind === 'slots' ? a.slots : a.alt;
      for (const s of slots) { const grp = [...root.querySelectorAll('.choices')].find((g) => g.getAttribute('aria-label') === s.label); const want = correct ? s.value : s.choices.find((c) => c !== s.value); [...grp.querySelectorAll('.choice')].find((b) => b.textContent.trim() === want).click(); await sl(25); }
      btn(/^Check$/)?.click(); return 100;
    }
    if (a.kind === 'steps') {
      for (const st of a.steps) { for (const m of st) { input.emitNote(correct ? m : m + 1, 'screen'); await sl(15); } if (st.length > 1) { btn(/Check chord/)?.click(); await sl(25); } if (!correct) break; }
      return 100;
    }
    const { onsets, totalBeats } = await import('/src/passage.ts');
    const p = a.kind === 'perform' ? a.expect ?? a.passage : a.passage, tempo = +[...root.querySelectorAll('.chip.accent')].find((c) => /bpm/.test(c.textContent)).textContent.replace(/\D/g, '');
    const unit = p.time[1] === 8 ? 1.5 : 1, qMs = 60000 / tempo / unit, barMs = ((p.time[0] * 4) / p.time[1]) * qMs, total = totalBeats(a.passage.staves[0].notes) * qMs;
    const listen = a.kind === 'rhythm' && !a.visual, t0 = performance.now(); btn(/Start now|Listen/).click();
    const start = (listen ? 250 + barMs + total + 350 : 0) + 250 + barMs;
    for (const o of onsets(p)) setTimeout(() => { if (a.kind === 'rhythm') input.emitTap('screen'); else o.midis.forEach((m) => input.emitNote(correct ? m : m + 1, 'screen')); }, start + o.t * qMs - (performance.now() - t0));
    return start + total + 1100;
  }, correct);
}
async function answerN(n, correct = true, gap = 950) { for (let i = 0; i < n; i++) { const w = await answer(correct); await sleep(w + gap); } }
async function doLesson(title) {
  await clickText('Learn', '.tabbar button'); await clickText(title, '.node'); if (!(await clickText('Start lesson'))) return false;
  for (let i = 0; i < 12; i++) { if (await has('Take the check') || await has('Finish lesson')) break; await clickText('Next'); }
  if (await clickText('Finish lesson')) { const ok = await has('Lesson passed'); await clickText('Continue'); return ok; }
  await clickText('Take the check'); await sleep(300);
  for (let i = 0; i < 5; i++) { const w = await answer(true); await sleep(w + 950); if (await has('Passed') && !(await has('Lesson passed'))) { await clickText('Next'); await clickText('Finish'); } }
  const ok = await has('Lesson passed'); if (!ok) console.log('   ', await text()); await clickText('Continue'); return ok;
}

await clickText('Skip setup'); check('home after skipping setup', await has("Start today's session"));
// ---- theory level 1, all six lessons, answered for real ----
for (const t of ['Pitch and the keyboard', 'The musical alphabet and octaves', 'The staff and treble clef', 'Bass clef', 'The grand staff and middle C', 'Ledger lines']) check('pass lesson: ' + t, await doLesson(t));
await clickText('Learn', '.tabbar button'); await clickText('Beat, tempo and the measure', '.node');
check('level 2 stays locked until level 1 skills are practised', await has('Locked') && await has('80%'), await text()); await clickText('', '.sheet .iconbtn');
// ---- a skill drill: 10 right answers makes the skill "practiced" ----
await clickText('The staff and treble clef', '.node'); await clickText('Practise'); await sleep(300); await answerN(10);
check('drill finishes with 10 of 10', await has('10 of 10 correct'), await text()); await clickText('Done');
const st1 = await page.evaluate(async () => { const { get } = await import('/src/store.ts'); const s = get(); return { status: s.skills['1.3:0']?.status, xp: s.profile.xp, n: s.skills['1.3:0']?.recent.length }; });
check('skill becomes practiced after 10 correct answers', st1.status === 'practiced' && st1.n >= 10, JSON.stringify(st1));
// wrong answers are graded wrong and shown
await clickText('Practice', '.tabbar button'); await clickText('Interval identification', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(200); await answer(false); await sleep(200);
check('a wrong answer shows "Not quite" with the right answer', await has('Not quite')); await back();
// chords and multi-step answers
await clickText('Chord construction', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(200); await answer(true); await sleep(200); check('a chord built on the keyboard is graded correct', await has('Correct')); await back();
await clickText('Scale construction', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(200); await answer(true); await sleep(200); check('an 8-note scale is graded correct', await has('Correct')); await back();
await clickText('Progression building', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(200); await answer(true); await sleep(300); check('a chord progression is graded correct', await has('Correct')); await back();
// ---- reading at tempo, performed in time ----
await clickText('One-hand phrase', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300);
let w = await answer(true); await sleep(w);
const pr = await page.evaluate(() => [...document.querySelectorAll('.bigstat')].map((x) => x.textContent));
check('a phrase played in time passes with pitch and rhythm scored', await has('Passed') && pr[0] === '100%' && parseInt(pr[1]) >= 80, pr.join(' / ')); await back();
await clickText('Two-hand phrase', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300); w = await answer(true); await sleep(w);
const pr2 = await page.evaluate(() => [...document.querySelectorAll('.bigstat')].map((x) => x.textContent));
check('a two-hand phrase is graded', await has('Passed') && pr2[0] === '100%', pr2.join(' / ')); await back();
await clickText('One-hand phrase', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300); w = await answer(false); await sleep(w);
check('wrong notes in time fail on pitch but score rhythm', await has('Not yet') && (await page.evaluate(() => [...document.querySelectorAll('.bigstat')].map((x) => x.textContent)))[0] === '0%'); await back();
await clickText('Rhythm reading', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300); w = await answer(true); await sleep(w);
check('a rhythm tapped in time passes', await has('Passed'), (await page.evaluate(() => [...document.querySelectorAll('.bigstat')].map((x) => x.textContent))).join(' / ')); await back();
await clickText('Rhythm dictation', '.node'); await clickText('Start', '.sheet .btn.primary'); await sleep(300); w = await answer(true); await sleep(w);
check('a rhythm echoed by ear passes', await has('Passed'), await text()); await back();
await clickText('Lead sheet', '.node'); await page.select('.sheet select', 'chords'); await clickText('Start', '.sheet .btn.primary'); await sleep(300); w = await answer(true); await sleep(w);
check('lead-sheet chords are graded', await has('Passed'), await text()); await back();
// ---- games ----
await clickText('Play', '.tabbar button'); await clickText('Chord Builder Rush', '.node'); await clickText('Bronze'); await clickText('Start'); await sleep(300);
for (let i = 0; i < 4; i++) { await answer(true); await sleep(900); }
const rush = await page.evaluate(() => document.querySelector('.chip.accent')?.textContent + ' ' + [...document.querySelectorAll('.chip')].map((c) => c.textContent).join(','));
check('Chord Builder Rush scores with a rising combo', /Score (1[0-9]{2}|[2-9][0-9])/.test(rush) && /×[3-5]/.test(rush), rush); await back(); await back();
await clickText('Key Quest', '.node'); await page.evaluate(() => { const g = [...document.querySelectorAll('.circle g')].find((x) => x.getAttribute('aria-label').startsWith('G major')); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await sleep(200);
await clickText('Start G major'); await sleep(300); for (let i = 0; i < 5; i++) { await answer(true); await sleep(1000); }
check('Key Quest claims a key after 5 of 5', await has('Key claimed'), await text()); await clickText('Done'); await back();
await clickText('Theory Boss', '.node'); await clickText('Level 1 boss'); await sleep(300); for (let i = 0; i < 15; i++) { await answer(true); await sleep(1000); }
check('Theory Boss is beaten with 3 lives left', await has('Boss defeated') && await has('3 lives left'), await text()); await clickText('Done'); await back();
await clickText('Staff Runner', '.node'); await clickText('Bronze'); await sleep(1800);
const run = await page.evaluate(async () => { const input = await import('/src/input.ts'); const lab = document.querySelector('.runner-field').getAttribute('aria-label'); const m = /([A-G])(\d)/.exec(lab); input.emitNote(12 * (+m[2] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]], 'screen'); await new Promise((r) => setTimeout(r, 250)); return document.querySelector('.topbar .chip').textContent; });
check('Staff Runner scores a hit', /· 1$/.test(run), run); await back(); await back();
await clickText('Rhythm Tap', '.node'); await clickText('1', '.grid-stage button'); await sleep(300); w = await answer(true); await sleep(w + 1700);
check('Rhythm Tap awards stars for a clean stage', await has('Stage clear'), await text()); await clickText('Stages'); await back();
await clickText('Open Road', '.node'); await clickText('Stage 1'); await sleep(300); w = await answer(true); await sleep(w + 1900);
check('Open Road extends the run after a pass', await has('Run of 1'), await text()); await back(); await back();
await clickText('Echo', '.node'); await clickText('Start'); await sleep(300); await answer(true); await sleep(1100); await answer(true); await sleep(1100);
check('Echo grows the melody each round', await has('Echo these 4 notes'), await text()); await back();
await clickText('Degree Dash', '.node'); await clickText('Bronze'); await page.evaluate(() => [...document.querySelectorAll('.seg button')].find((b) => b.textContent.includes('Choices')).click()); await clickText('Start'); await sleep(300);
for (let i = 0; i < 3; i++) { await answer(true); await sleep(900); }
check('Degree Dash scores with choice buttons', /Score [1-9]/.test(await page.evaluate(() => [...document.querySelectorAll('.chip.accent')].map((c) => c.textContent).join(' '))), await text()); await back(); await back();
await page.evaluate(async () => { const { set } = await import('/src/store.ts'); set((s) => { s.profile.settings.input = 'screen'; }); });
await clickText('Progression Detective', '.node'); await clickText('1', '.grid-stage button'); await clickText('Listen'); await sleep(200);
await page.evaluate(() => { const q = window.__q; });
const det = await page.evaluate(async () => { const { EX, exParams } = await import('/src/exercises.ts'); const { mulberry } = await import('/src/music.ts'); const q = EX.E9.gen(exParams('E9', { keys: ['C'], pool: ['I', 'IV', 'V'], len: 4, style: 'band', tempo: 102 }), mulberry(104729)); for (const s of q.answer.alt) { const grp = [...root.querySelectorAll('.choices')].find((g) => g.getAttribute('aria-label') === s.label); [...grp.querySelectorAll('.choice')].find((b) => b.textContent.trim() === s.value).click(); await new Promise((r) => setTimeout(r, 40)); } await new Promise((r) => setTimeout(r, 100)); [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Check').click(); await new Promise((r) => setTimeout(r, 200)); return document.body.innerText.includes('Case solved') && document.querySelectorAll('.stars span:not(.off)').length; });
check('Progression Detective solves a case for 3 stars', det === 3, String(det)); await clickText('Cases'); await back();
// ---- session, microphone, data ----
await clickText('Home', '.tabbar button'); await clickText("Start today's session"); check('the daily session opens on a review or the next lesson', await has('Step 1 of') || await has('lesson'), await text()); await back();
const mic = await page.evaluate(async () => { const input = await import('/src/input.ts'); const { ac } = await import('/src/audio.ts'); const c = ac(), osc = c.createOscillator(), dest = c.createMediaStreamDestination(); osc.frequency.value = 440; osc.connect(dest); osc.start(); navigator.mediaDevices.getUserMedia = async () => dest.stream; const heard = []; input.onNote((e) => { if (e.source === 'mic') heard.push(e.midi); }); const ok = await input.startMic(); const seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 3500) { if (input.micState.note != null) seen.add(input.micState.note); await new Promise((r) => setTimeout(r, 40)); } input.stopMic(); osc.stop(); return { ok, notes: [...seen], heard }; });
check('microphone pipeline hears a 440 Hz tone as A4 and emits one note', mic.ok && mic.notes.join() === '69' && mic.heard.join() === '69', JSON.stringify(mic));
const data = await page.evaluate(async () => { const st = await import('/src/store.ts'); const before = st.get().profile.xp, lessons = Object.keys(st.get().lessons).length, json = st.exportJson(); st.resetAll(); const mid = st.get().profile.xp; st.importJson(json); let bad = false; try { st.importJson('{"hello":1}'); } catch { bad = true; } return { before, mid, after: st.get().profile.xp, lessons, lessonsAfter: Object.keys(st.get().lessons).length, bad }; });
check('export, reset and import round-trip; a bad file is refused', data.before > 0 && data.mid === 0 && data.after === data.before && data.lessons === data.lessonsAfter && data.bad, JSON.stringify(data));
const xml = await page.evaluate(async () => { const { parseMusicXml } = await import('/src/musicxml.ts'); const note = (s, o, d, extra = '') => `<note>${extra}<pitch><step>${s}</step><octave>${o}</octave></pitch><duration>${d}</duration></note>`; const p = parseMusicXml(`<?xml version="1.0"?><score-partwise><part id="P1"><measure number="1"><attributes><divisions>2</divisions><key><fifths>1</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time></attributes>${note('G', 4, 2)}${note('B', 4, 2, '<chord/>')}${note('A', 4, 1)}${note('B', 4, 1)}<note><rest/><duration>2</duration></note></measure></part></score-partwise>`); return { key: p.key, time: p.time.join('/'), n: p.staves[0].notes.length, chord: p.staves[0].notes[0].p.length, d: p.staves[0].notes.map((x) => x.d).join(',') }; });
check('MusicXML import reads key, time, chords, rests and durations', xml.key === 'G' && xml.time === '3/4' && xml.n === 4 && xml.chord === 2 && xml.d === '1,0.5,0.5,1', JSON.stringify(xml));
await page.reload({ waitUntil: 'networkidle0' });
const persisted = await page.evaluate(async () => { const st = await import('/src/store.ts'); await new Promise((r) => setTimeout(r, 300)); return { lessons: Object.keys(st.get().lessons).length, quest: st.get().keyQuest, boss: st.get().stars['boss:1'] }; });
check('lessons, key claims and stars persist across a reload', persisted.lessons >= 6 && persisted.quest.includes('G') && persisted.boss === 3, JSON.stringify(persisted));
check('no console or page errors', errors.length === 0, errors.slice(0, 6).join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
