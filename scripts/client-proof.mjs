import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Proof layer for the released candle artifact (deploy-candle/): renders it at
// desktop and phone sizes, asserts the release contract, saves screenshots.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'deploy-candle');
const base = process.env.PREVIEW_URL || '';
const port = 4179;

let server;
if (!base) {
  server = spawn(process.execPath, [path.join(root, 'scripts', 'static-server.mjs'), artifactDir], {
    env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
  });
  process.on('exit', () => server.kill());
  await new Promise(r => setTimeout(r, 800));
}
const url = base || `http://127.0.0.1:${port}/`;

await fs.mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });

async function assertPage(width, height, name) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const heroImg = document.querySelector('img.hero-bg');
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      title: document.querySelector('.hero-title')?.textContent.replace(/\s+/g, ' ').trim() || '',
      heroSrc: heroImg?.getAttribute('src') || '',
      heroLoaded: !!heroImg && heroImg.complete && heroImg.naturalWidth > 0,
      contact: !!document.querySelector('a[href="mailto:mcleevu@gmail.com"]'),
      tel: !!document.querySelector('a[href="tel:+61401676766"]'),
      setupBarHidden: getComputedStyle(document.querySelector('.setup-bar')).display === 'none',
      ledeHidden: getComputedStyle(document.querySelector('.hero-lede')).display === 'none',
      noteHidden: getComputedStyle(document.querySelector('.hero-note')).display === 'none',
    };
  });
  await page.screenshot({ path: `artifacts/${name}.png`, fullPage: false });
  await page.close();
  if (m.scrollWidth > m.innerWidth) throw new Error(`${name}: horizontal overflow`);
  if (!m.title) throw new Error(`${name}: missing hero title`);
  if (!m.heroSrc.endsWith('lee-vu-hero-ballroom.jpg')) throw new Error(`${name}: wrong hero identity asset: ${m.heroSrc}`);
  if (!m.heroLoaded) throw new Error(`${name}: hero photo did not render`);
  if (!m.contact || !m.tel) throw new Error(`${name}: real contact links missing`);
  if (!m.setupBarHidden) throw new Error(`${name}: photo-authoring setup bar visible to the public`);
  if (width <= 640) {
    if (!m.ledeHidden) throw new Error(`${name}: phone hero lede must stay off the phone hero`);
    if (!m.noteHidden) throw new Error(`${name}: phone hero note column must stay off the phone hero`);
  }
  console.log(`${name}: OK — hero "${m.title}"`);
}

try {
  await assertPage(1440, 900, 'desktop-proof');
  await assertPage(390, 844, 'phone-proof');
} finally {
  await browser.close();
  if (server) server.kill();
}
