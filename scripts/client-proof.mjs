import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
await fs.mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });

async function assertPage(width, height, name) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  const metrics = await page.evaluate(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.querySelector('#hero-title')?.textContent || '',
    brand: document.querySelector('.brand span')?.getBoundingClientRect().toJSON(),
    lang: document.querySelector('.lang-toggle')?.getBoundingClientRect().toJSON(),
    cta: document.querySelector('.button-small')?.getBoundingClientRect().toJSON(),
    hero: document.querySelector('.hero')?.getBoundingClientRect().toJSON(),
    portrait: document.querySelector('.hero-portrait img')?.getBoundingClientRect().toJSON(),
    imageSrc: document.querySelector('.hero-portrait img')?.getAttribute('src'),
  }));
  if (metrics.scrollWidth > metrics.innerWidth) throw new Error(name + ': horizontal overflow ' + JSON.stringify(metrics));
  if (!metrics.title) throw new Error(name + ': missing hero title');
  if (!metrics.imageSrc?.includes('lee-vu-stage-cutout.png')) throw new Error(name + ': wrong hero identity asset');
  for (const key of ['brand','lang','cta']) {
    const r = metrics[key];
    if (!r || r.width < 1 || r.height < 1 || r.left < 0 || r.right > width + 1) throw new Error(name + ': header control clipped: ' + key);
  }
  if (!metrics.portrait || metrics.portrait.bottom > metrics.hero.bottom + 1 || metrics.portrait.right > metrics.hero.right + 1) throw new Error(name + ': portrait escapes hero');
  await page.screenshot({ path: 'artifacts/client-' + name + '.png', fullPage: true });
  return { page, metrics, errors };
}
const desktop = await assertPage(1440, 1000, 'desktop');
const page = desktop.page;
const englishTitle = await page.locator('#hero-title').textContent();
await page.locator('.lang-toggle').click();
if (await page.locator('#hero-title').textContent() === englishTitle) throw new Error('language toggle did not change copy');
await page.locator('.lang-toggle').click();
if (await page.locator('#hero-title').textContent() !== englishTitle) throw new Error('language toggle did not restore English');

const faq = page.locator('.faq-list article').first();
const faqButton = faq.locator('button');
await faqButton.click();
if (await faqButton.getAttribute('aria-expanded') !== 'true') throw new Error('FAQ did not open');
await faqButton.click();
if (await faqButton.getAttribute('aria-expanded') !== 'false') throw new Error('FAQ did not close');

await page.locator('#wedding-date').fill('2026-12-12');
const emailHref = await page.getByRole('link', { name: 'Email Lee' }).getAttribute('href');
const callHref = await page.getByRole('link', { name: 'Call Lee' }).getAttribute('href');
if (!emailHref?.startsWith('mailto:mcleevu@gmail.com?')) throw new Error('email link wrong');
if (callHref !== 'tel:+61401676766') throw new Error('call link wrong');
const video = await page.locator('video').evaluate(el => ({ poster: el.getAttribute('poster'), src: el.querySelector('source')?.getAttribute('src') }));
if (video.poster !== '/media/lee-vu-stage.jpg' || video.src !== '/media/lee-vu-reel.mp4') throw new Error('video media wrong');
if (desktop.errors.length) throw new Error('desktop page errors: ' + desktop.errors.join(' | '));
await page.close();

const mobile = await assertPage(390, 844, 'mobile-390');
const touch = await mobile.page.evaluate(() => ({
  faq: document.querySelector('.faq-list button')?.getBoundingClientRect().height,
  lang: document.querySelector('.lang-toggle')?.getBoundingClientRect().height,
  cta: document.querySelector('.button-small')?.getBoundingClientRect().height,
  call: [...document.querySelectorAll('a')].find(a => a.getAttribute('href') === 'tel:+61401676766')?.getBoundingClientRect().height
}));
for (const [key,value] of Object.entries(touch)) if (!value || value < 44) throw new Error('mobile touch target too small: ' + key + '=' + value);
if (mobile.errors.length) throw new Error('mobile page errors: ' + mobile.errors.join(' | '));
await mobile.page.close();

const narrow = await assertPage(320, 800, 'mobile-320');
if (narrow.errors.length) throw new Error('320 page errors: ' + narrow.errors.join(' | '));
await narrow.page.close();
await browser.close();

await fs.writeFile('artifacts/client-proof.json', JSON.stringify({
  ok: true,
  source: process.env.GITHUB_SHA || 'local-unknown',
  desktop: desktop.metrics,
  mobile390: mobile.metrics,
  mobile320: narrow.metrics,
  touch,
  emailHref,
  callHref,
  video
}, null, 2));
console.log('CLIENT_PROOF PASS');
