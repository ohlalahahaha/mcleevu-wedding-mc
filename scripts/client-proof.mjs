import { chromium } from 'playwright';
import fs from 'node:fs/promises';

// App-surface proof for the CURRENT Vite app (slimmed build-10 surface).
// This proofs the DEV REBUILD only — the release output is deploy-candle/,
// proofed separately by artifact-proof.mjs. Selectors track src/main.jsx.
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
await fs.mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });

async function assertPage(width, height, name) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    await new Promise(r => setTimeout(r, 300));
    scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
    const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }));
    return {
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      title: document.querySelector('#hero-title')?.textContent || '',
      heroImgSrc: document.querySelector('.hero-media img')?.getAttribute('src'),
      reelStripSrcs: [...document.querySelectorAll('.reel-strip img')].map(i => i.getAttribute('src')),
      brand: box(document.querySelector('.brand')),
      langBtn: box(document.querySelector('.lang-btn')),
      cta: box(document.querySelector('.btn-gold')),
      hero: box(document.querySelector('.hero')),
      heroMedia: box(document.querySelector('.hero-media')),
      imgs,
      hasVideo: !!document.querySelector('video'),
      reelFrame: document.querySelector('.reel-html-frame')?.getAttribute('src'),
      callHref: document.querySelector('a.contact-tile[href^="tel:"]')?.getAttribute('href'),
      emailHref: document.querySelector('a.contact-tile[href^="mailto:"]')?.getAttribute('href'),
    };
  });
  if (m.scrollWidth > m.innerWidth) throw new Error(name + ': horizontal overflow ' + m.scrollWidth);
  if (!m.title.trim()) throw new Error(name + ': missing hero title');
  if (m.heroImgSrc !== '/media/lee-vu-hero-artifact.webp') throw new Error(name + ': wrong hero identity asset: ' + m.heroImgSrc);
  if (!m.reelStripSrcs.includes('/media/lee-vu-portrait-navy.jpg') || !m.reelStripSrcs.includes('/media/lee-vu-portrait-blue.jpg')) throw new Error(name + ': missing real Lee identity pair in reel strip');
  for (const key of ['brand', 'langBtn', 'cta']) {
    const r = m[key];
    if (!r || r.w < 1 || r.h < 1 || r.left < 0 || r.right > width + 1) throw new Error(name + ': header control clipped: ' + key);
  }
  // The hero portrait panel is an intentional full-bleed absolute layer
  // (vertical bleed by design); it must stay inside the viewport's right edge.
  if (m.heroMedia && (m.heroMedia.h < 400 || m.heroMedia.right > width + 1)) throw new Error(name + ': hero media malformed: ' + JSON.stringify(m.heroMedia));
  const bad = m.imgs.filter(i => i.src && i.src.includes('media/') && !i.ok);
  if (bad.length) throw new Error(name + ': broken image slots: ' + JSON.stringify(bad));
  if (!m.hasVideo) throw new Error(name + ': reel video element missing');
  if (m.reelFrame !== '/lee-vu-reel.html') throw new Error(name + ': reel iframe target wrong: ' + m.reelFrame);
  if (m.callHref !== 'tel:+61401676766') throw new Error(name + ': call link wrong: ' + m.callHref);
  if (!m.emailHref?.startsWith('mailto:mcleevu@gmail.com')) throw new Error(name + ': email link wrong: ' + m.emailHref);
  await page.screenshot({ path: 'artifacts/client-' + name + '.png', fullPage: true });
  return { page, m, errors };
}

const desktop = await assertPage(1440, 1000, 'desktop');
const page = desktop.page;
const englishTitle = (await page.locator('#hero-title').innerText()).trim();

// language switch EN→VI→EN via the real buttons
await page.getByRole('button', { name: 'VI', exact: true }).click();
await page.waitForTimeout(500);
const viTitle = (await page.locator('#hero-title').innerText()).trim();
if (viTitle === englishTitle) throw new Error('VI toggle did not change hero copy');
if (!/MC đám cưới|song ngữ/i.test(viTitle)) throw new Error('VI hero copy not Vietnamese: ' + viTitle);
await page.screenshot({ path: 'artifacts/client-desktop-vi.png', fullPage: true });
await page.getByRole('button', { name: 'EN', exact: true }).click();
await page.waitForTimeout(400);
if ((await page.locator('#hero-title').innerText()).trim() !== englishTitle) throw new Error('EN toggle did not restore');

// date checker present + wired (no submission; API not expected under static preview)
await page.locator('#wedding-date').fill('2026-12-12');
await page.waitForTimeout(200);
const checkBtn = page.locator('.date-checker .btn-gold');
if (!(await checkBtn.isEnabled())) throw new Error('date check button not enabled after date pick');

if (desktop.errors.length) throw new Error('desktop page errors: ' + desktop.errors.join(' | '));
await page.close();

const mobile = await assertPage(390, 844, 'mobile-390');
const touch = await mobile.page.evaluate(() => {
  const h = el => el ? el.getBoundingClientRect().height : 0;
  return { lang: h(document.querySelector('.lang-btn')), cta: h(document.querySelector('.btn-gold')), call: h(document.querySelector('a.contact-tile[href^="tel:"]')) };
});
for (const [key, value] of Object.entries(touch)) if (!value || value < 44) throw new Error('mobile touch target too small: ' + key + '=' + value);
if (mobile.errors.length) throw new Error('mobile page errors: ' + mobile.errors.join(' | '));
await mobile.page.close();

const narrow = await assertPage(320, 800, 'mobile-320');
if (narrow.errors.length) throw new Error('320 page errors: ' + narrow.errors.join(' | '));
await narrow.page.close();
await browser.close();

await fs.writeFile('artifacts/client-proof.json', JSON.stringify({
  ok: true, source: process.env.SOURCE_SHA || process.env.GITHUB_SHA || 'local-unknown',
  desktop: desktop.metrics, mobile390: mobile.metrics, mobile320: narrow.metrics, touch,
}, null, 2));
console.log('CLIENT_PROOF PASS');
