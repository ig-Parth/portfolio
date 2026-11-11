import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT_CDP = 19235;
const PROFILE = path.join(os.tmpdir(), 'nexus01-verify-' + Date.now());
fs.mkdirSync(PROFILE, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  let file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;
const chrome = spawn(CHROME, ['--headless=new', '--no-first-run', `--remote-debugging-port=${PORT_CDP}`, `--user-data-dir=${PROFILE}`, '--window-size=1440,900', url], { stdio: 'ignore' });

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`)).json();
      const page = list.find(x => x.type === 'page' && x.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('Chrome CDP timeout');
}
const ws = new WebSocket(await getWs());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let mid = 0; const pending = new Map(); const errs = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails));
};
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++mid; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const evalJs = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result?.value; };

try {
  await cdp('Page.enable'); await cdp('Runtime.enable');
  for (let i = 0; i < 40; i++) {
    try { if (await evalJs('document.readyState === "complete" && !!window.__NEXUS_READY')) break; } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  const ssrProjects = await evalJs('document.querySelectorAll("#ev-dossier .ev-panel").length');
  const ssrSkills = await evalJs('document.querySelectorAll("#skill-info .skill-panel").length');
  const hasResumeSkip = await evalJs('!!document.getElementById("welcome-resume") && !!document.getElementById("print-resume-btn")');
  await evalJs('document.getElementById("gate-no").click()');
  await new Promise(r => setTimeout(r, 450));
  const broken = await evalJs('[...document.querySelectorAll("img")].filter(i => !i.complete || i.naturalWidth === 0).length');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 250));
  const overflow360 = await evalJs('document.documentElement.scrollWidth - window.innerWidth');
  console.log(JSON.stringify({ ssrProjects, ssrSkills, hasResumeSkip, broken, overflow360, exceptions: errs.length }));
  if (ssrProjects !== 5 || ssrSkills !== 8 || !hasResumeSkip || broken !== 0 || overflow360 !== 0 || errs.length !== 0) process.exit(1);
} finally {
  ws.close(); chrome.kill(); server.close();
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
}
