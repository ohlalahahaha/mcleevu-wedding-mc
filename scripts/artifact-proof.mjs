import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = process.env.ARTIFACT_URL || 'http://127.0.0.1:4173';
await fs.mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });
const shot = (p, name) => p.screenshot({ path: `artifacts/lee-${name}.png`, fullPage: true });

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
    await new Promise(r => setTimeout(r, 400));
    scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const vis = el => { if (!el) return null; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, display: s.display }; };
    const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }));
    return {
      scrollWidth: document.documentElement.scrollWidth,
      heroBgOk: (() => { const i = document.querySelector('.hero-bg'); return !!i && i.complete && i.naturalWidth > 0; })(),
      slotsOk: imgs.filter(i => i.src && i.src.includes('media/')),
      setupBar: vis(document.querySelector('.setup-bar')),
      slotAddVisible: [...document.querySelectorAll('.slot-add')].filter(b => getComputedStyle(b).display !== 'none').length,
      phone: !!document.querySelector('a[href="tel:+61401676766"]'),
      lang: vis(document.querySelector('.lang')),
      cta: vis(document.querySelector('.btn-gold')),
      promises: document.querySelectorAll('#trow1 .tcard').length,
      promiseText: document.querySelector('#trow1 .tquote')?.textContent.slice(0, 40) || '',
      reelMeta: document.querySelector('.reel-meta')?.textContent || '',
    };
  });
  if (m.scrollWidth > width) throw new Error(name + ': horizontal overflow ' + m.scrollWidth);
  if (/1 minute|1 phút/.test(m.reelMeta)) throw new Error(name + ': reel duration overclaims: ' + m.reelMeta);
  if (!/8 seconds|8 giây/.test(m.reelMeta)) throw new Error(name + ': honest reel duration missing: ' + m.reelMeta);
  if (!m.heroBgOk) throw new Error(name + ': hero background failed to load');
  const bad = m.slotsOk.filter(i => !i.ok);
  if (bad.length) throw new Error(name + ': broken image slots: ' + JSON.stringify(bad));
  if (m.setupBar && m.setupBar.display !== 'none') throw new Error(name + ': authoring setup bar visible to customers');
  if (m.slotAddVisible) throw new Error(name + ': authoring slot-add buttons visible to customers');
  if (!m.phone) throw new Error(name + ': phone link missing');
  if (!m.lang || m.lang.w < 1) throw new Error(name + ': language toggle missing');
  if (!m.cta || m.cta.w < 1) throw new Error(name + ': primary CTA missing');
  if (m.promises < 6) throw new Error(name + ': promise cards not rendered (' + m.promises + ')');
  if (/Minh|Langham|Curzon/.test(m.promiseText)) throw new Error(name + ': fabricated testimonial still present');
  await shot(page, name + '-full');
  return { page, m, errors };
}

// ── desktop 1440x900 ──
const d = await assertPage(1440, 900, 'desktop-1440');
let page = d.page;
const enTitle = await page.locator('.hero-title').innerText();

// language toggle EN→VI→EN
await page.locator('.lang-btn[data-lang="vi"]').click();
await page.waitForTimeout(400);
const viTitle = await page.locator('.hero-title').innerText();
const viPromise = await page.locator('#trow1 .tquote').first().innerText();
if (viTitle === enTitle) throw new Error('VI toggle did not change hero copy');
if (!/MC đám cưới|song ngữ/.test(viTitle)) throw new Error('VI hero copy not Vietnamese: ' + viTitle);
if (!/lời hứa tôi|Đáng tin/i.test(viPromise)) throw new Error('VI promise cards not Vietnamese: ' + viPromise);
await shot(page, 'desktop-1440-vi');
await page.locator('.lang-btn[data-lang="en"]').click();
await page.waitForTimeout(300);
if (await page.locator('.hero-title').innerText() !== enTitle) throw new Error('EN toggle did not restore');

// menu + anchors
await page.locator('.menu-btn').click();
await page.waitForTimeout(300);
const menuVisible = await page.locator('.menu-nav').isVisible();
if (!menuVisible) throw new Error('menu did not open');
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
if (await page.locator('.menu-nav').isVisible()) throw new Error('Escape did not close menu');
await page.locator('.menu-nav a[href="#enquire"]').first().click().catch(async () => {
  await page.locator('.menu-btn').click();
  await page.locator('.menu-nav a[href="#enquire"]').click();
});

// booking flow: date → honest evening → arrangement → validation error → success (mock mailto)
await page.locator('#enquire').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const calDay = page.locator('.cal-d:not([disabled])').nth(2);
await calDay.click();
await page.waitForTimeout(500);
if (await page.locator('#bstep2').isHidden()) throw new Error('step 2 did not reveal after date pick');
const evFree = await page.locator('.ev-free').innerText();
if (/is free/i.test(evFree)) throw new Error('availability overclaim: ' + evFree);
await shot(page, 'desktop-1440-step2');
await page.locator('#toStep3').click();
await page.waitForTimeout(500);
if (await page.locator('#bstep3').isHidden()) throw new Error('step 3 did not reveal');

// validation: empty name/email must not open mailto
let mailtoFired = false;
page.on('framenavigated', () => { mailtoFired = true; });
await page.evaluate(() => { window.__origOpen = window.open; window.open = () => { window.__stripeOpened = true; return null; }; });
await page.locator('.js-pay').click();
await page.waitForTimeout(400);
if (await page.locator('#fName').evaluate(el => !el.classList.contains('f-err'))) throw new Error('empty name did not flag validation');
if (mailtoFired) throw new Error('mailto fired despite missing required fields');
await shot(page, 'desktop-1440-validation');

// valid submit → honest held panel, no real send (mailto intercepted)
await page.locator('#fName').fill('Anh & Hoa Nguyen');
await page.locator('#fEmail').fill('couple@example.com');
await page.evaluate(() => {
  const a = HTMLAnchorElement.prototype;
  const orig = a.click;
  a.click = function () { if (this.href.startsWith('mailto:')) { window.__mailtoHref = this.href; return; } return orig.call(this); };
});
await page.locator('.js-pay').click();
await page.waitForTimeout(500);
const heldShown = await page.locator('#heldPanel').evaluate(el => el.classList.contains('show'));
if (!heldShown) throw new Error('held panel did not show on valid submit');
const heldText = await page.locator('#heldText').innerText();
if (!/reply personally|reply/i.test(heldText) && !/trả lời/.test(heldText)) throw new Error('held copy overclaims: ' + heldText);
if (mailtoFired) throw new Error('real navigation happened (would open mail client)');
await shot(page, 'desktop-1440-held');

// showreel: real video mode expected
await page.locator('#reel').scrollIntoViewIfNeeded();
await page.locator('.play').click();
await page.waitForTimeout(1200);
const videoMode = await page.locator('#stage').evaluate(el => el.classList.contains('can-play') ? 'video' : (el.classList.contains('motion') ? 'motion' : 'none'));
if (videoMode === 'none') throw new Error('showreel stuck in none mode');
const motionTagVisible = await page.locator('.motion-tag').isVisible();
if (videoMode === 'video' && motionTagVisible) throw new Error('motion-preview tag shown while real video plays');
await page.locator('#vBigPlay').click().catch(() => {});
await page.waitForTimeout(800);
if (videoMode === 'video') {
  const playing = await page.locator('#stage').evaluate(el => ({
    cls: el.className,
    bigplayOpacity: getComputedStyle(el.querySelector('.v-bigplay')).opacity,
    bigplayPE: getComputedStyle(el.querySelector('.v-bigplay')).pointerEvents,
    paused: el.querySelector('video').paused,
    duration: el.querySelector('video').duration,
  }));
  if (playing.paused) throw new Error('video not actually playing after bigplay click');
  if (!playing.cls.includes('is-playing-video')) throw new Error('is-playing-video class missing during playback');
  if (playing.bigplayOpacity !== '0' || playing.bigplayPE !== 'none') throw new Error('big play overlay visible during playback: ' + JSON.stringify(playing));
}
await page.screenshot({ path: 'artifacts/lee-desktop-1440-reel.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
if (await page.locator('.modal.open').count()) throw new Error('Escape did not close showreel modal');
if (d.errors.length) throw new Error('desktop page errors: ' + d.errors.join(' | '));
await page.close();

// ── phone 390x844 ──
const ph = await assertPage(390, 844, 'phone-390');
const touch = await ph.page.evaluate(() => {
  const h = el => el ? el.getBoundingClientRect().height : 0;
  return { lang: h(document.querySelector('.lang-btn')), cta: h(document.querySelector('.btn-gold')), menu: h(document.querySelector('.menu-btn')) };
});
for (const [k, v] of Object.entries(touch)) if (!v || v < 44) throw new Error('phone touch target too small: ' + k + '=' + v);
// phone booking smoke
await ph.page.locator('#enquire').scrollIntoViewIfNeeded();
await ph.page.waitForTimeout(500);
await ph.page.locator('.cal-d:not([disabled])').nth(6).click();
await ph.page.waitForTimeout(400);
if (await ph.page.locator('#bstep2').isHidden()) throw new Error('phone: step 2 did not reveal');
await shot(ph.page, 'phone-390-step2');
if (ph.errors.length) throw new Error('phone page errors: ' + ph.errors.join(' | '));
await ph.page.close();

// ── narrow 320 ──
const n = await assertPage(320, 800, 'narrow-320');
if (n.errors.length) throw new Error('320 page errors: ' + n.errors.join(' | '));
await n.page.close();

// ── setup mode still works for Lee/Phoenix ──
const s = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await s.goto(base + '/?setup', { waitUntil: 'networkidle' });
const setupOk = await s.evaluate(() =>
  !document.documentElement.classList.contains('no-setup') &&
  [...document.querySelectorAll('.slot-add')].some(b => getComputedStyle(b).display !== 'none')
);
if (!setupOk) throw new Error('?setup did not activate authoring tools');
const customerOk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await customerOk.goto(base, { waitUntil: 'networkidle' });
const customerHidden = await customerOk.evaluate(() => {
  const bar = document.querySelector('.setup-bar');
  const adds = [...document.querySelectorAll('.slot-add')].filter(b => getComputedStyle(b).display !== 'none');
  return document.documentElement.classList.contains('no-setup') && (!bar || getComputedStyle(bar).display === 'none') && adds.length === 0;
});
if (!customerHidden) throw new Error('authoring tools leaked to customers');
await customerOk.close();
await s.close();

await browser.close();
await fs.writeFile('artifacts/lee-artifact-proof.json', JSON.stringify({
  ok: true, source: process.env.SOURCE_SHA || 'local', base, videoMode, touch, promiseCards: d.m.promises, heroBgOk: d.m.heroBgOk, slots: d.m.slotsOk.length
}, null, 2));
console.log('ARTIFACT_PROOF_PASS videoMode=' + videoMode);
