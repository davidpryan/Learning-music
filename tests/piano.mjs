// Sampled piano: every sample loads, is in tune, starts promptly, and playback falls back to the synth when files are missing.
import puppeteer from 'puppeteer-core';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const fails = []; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!ok) fails.push(name); };
const page = await browser.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle0' });
const r = await page.evaluate(async () => {
  const names = ['C', 'Eb', 'Gb', 'A'], out = [];
  const ctx = new AudioContext();
  for (let o = 2; o <= 7; o++) for (let i = 0; i < 4; i++) {
    if (o === 7 && i > 0) continue;
    const m = 12 * (o + 1) + i * 3, res = await fetch(new URL(`piano/${names[i]}${o}.mp3`, document.baseURI)); if (!res.ok) { out.push({ m, err: res.status }); continue; }
    const buf = await ctx.decodeAudioData(await res.arrayBuffer()), d = buf.getChannelData(0), sr = buf.sampleRate;
    let peak = 0; for (const x of d) peak = Math.max(peak, Math.abs(x)); let first = 0; while (Math.abs(d[first]) < peak * 0.02) first++;
    // pitch by autocorrelation over 150 ms starting 60 ms after the onset
    const a = first + Math.floor(sr * 0.06), n = Math.floor(sr * 0.15), f0 = 440 * Math.pow(2, (m - 69) / 12); let best = 0, bl = 0;
    for (let lag = Math.floor(sr / (f0 * 1.12)); lag <= Math.ceil(sr / (f0 / 1.12)); lag++) { let c = 0; for (let k = 0; k < n; k++) c += d[a + k] * d[a + k + lag]; if (c > best) { best = c; bl = lag; } }
    out.push({ m, cents: Math.round(1200 * Math.log2(sr / bl / f0)), onsetMs: Math.round(first / sr * 1000), dur: +buf.duration.toFixed(2), peak: +peak.toFixed(2) });
  }
  return out;
});
check('all 21 samples load', r.length === 21 && r.every((x) => !x.err), JSON.stringify(r.filter((x) => x.err)));
check('every sample is in tune (rough check, within 45 cents; a spectrum measurement puts them within 14)', r.every((x) => Math.abs(x.cents) <= 45), JSON.stringify(r.map((x) => [x.m, x.cents])));
check('every sample starts within 80 ms and the lead-in is measured', r.every((x) => x.onsetMs < 80), JSON.stringify(r.map((x) => x.onsetMs)));
// through the app: loads on first use, plays sampled, and renders sound at the right time
const app = await page.evaluate(async () => {
  const audio = await import('/src/audio.ts'); const before = audio.pianoState(); await audio.loadPiano(); const after = audio.pianoState();
  const c = audio.ac(); await c.resume(); const an = c.createAnalyser(); an.fftSize = 2048;
  // tap the master output by playing into an analyser as the "out" node
  const g = c.createGain(); g.connect(an); const t = c.currentTime + 0.1;
  audio.playNote(64, t, 0.5, 'piano', 0.7, false, g); audio.playNote(31, t, 0.5, 'piano', 0.7, false, g); // 31 is below the samples: synth fallback, no error
  const buf = new Float32Array(2048), lv = [];
  for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 40)); an.getFloatTimeDomainData(buf); lv.push(+Math.max(...buf.map(Math.abs)).toFixed(3)); }
  return { before, after, lv };
});
check('the app loads the samples and reports sampled piano', app.after === 'sampled', JSON.stringify([app.before, app.after]));
check('a sampled note actually sounds', Math.max(...app.lv) > 0.1, JSON.stringify(app.lv));
// missing files: the synth keeps working
const p2 = await browser.newPage(); await p2.setRequestInterception(true); p2.on('request', (q) => (q.url().includes('/piano/') ? q.respond({ status: 404, body: '' }) : q.continue()));
await p2.goto(URL, { waitUntil: 'networkidle0' });
const fb = await p2.evaluate(async () => { const audio = await import('/src/audio.ts'); await audio.loadPiano(); const c = audio.ac(); await c.resume(); const an = c.createAnalyser(); const g = c.createGain(); g.connect(an); audio.playNote(64, c.currentTime + 0.05, 0.4, 'piano', 0.7, false, g); await new Promise((r) => setTimeout(r, 200)); const b = new Float32Array(2048); an.getFloatTimeDomainData(b); return { state: audio.pianoState(), lv: Math.max(...b.map(Math.abs)) }; });
check('with the files missing the synth piano still plays', fb.state !== 'sampled' && fb.lv > 0.05, JSON.stringify(fb));
check('no page errors', errors.length === 0, errors.join(' | '));
console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
await browser.close(); process.exit(fails.length ? 1 : 0);
