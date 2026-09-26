import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'deploy-candle');
const html = fs.readFileSync(path.join(artifactDir, 'index.html'), 'utf8');
const photos = fs.readFileSync(path.join(artifactDir, 'photos.js'), 'utf8');

test('real contact details only — wrong enquiry domain is gone, phone present', () => {
  assert.ok(html.includes("EMAIL='mcleevu@gmail.com'"), 'EMAIL var must be Lee’s real address');
  assert.ok(!html.includes('leevu.com.au'), 'wrong enquiry domain must not appear');
  assert.ok(html.includes('href="tel:+61401676766"'), 'click-to-call link present');
  assert.ok(html.includes('0401 676 766'), 'phone number shown to customers');
  assert.ok(html.includes('href="mailto:mcleevu@gmail.com"'), 'visible email link present');
});

test('kind words stay heartfelt and keep their star treatment (Phoenix law: no promise-card flattening)', () => {
  assert.ok(html.includes('Lee held the whole room'), 'heartfelt EN quote present');
  assert.ok(html.includes('Lee không chỉ dẫn chương trình'), 'heartfelt VI quote present');
  assert.ok(html.includes('class="tstar"'), 'star treatment intact');
  assert.ok(html.includes("fill('#trow1',T1.concat(T2),false)"), 'quotes render on load');
  assert.ok(!html.includes('PROMISE'), 'no promise-card regression');
});

test('booking claims stay honest — no unverified availability promises', () => {
  assert.ok(!html.includes('Your date is free'), 'must not claim an unverified date is free');
  assert.ok(!/Date held\s*—/.test(html), 'must not claim the date is held after a mere enquiry');
  assert.ok(html.includes('Lee confirms every date personally'), 'honest confirmation wording present');
  assert.ok(html.includes('$500'), 'deposit fact kept');
  assert.ok(html.includes('$1,000'), 'fee fact kept');
});

test('photo-authoring tools are gated behind ?setup', () => {
  assert.ok(html.includes("classList.add('no-setup')"), 'head gate script present');
  assert.ok(html.includes('html.no-setup .setup-bar,html.no-setup .slot-add{display:none!important}'), 'CSS hides authoring tools');
  assert.ok(html.includes('var SETUP='), 'JS setup flag present');
  assert.ok(html.includes("if(SETUP){"), 'setup-only bindings guarded');
});

test('Acoustic Hearing Care links to the official clinic site', () => {
  assert.ok(html.includes('https://acoustichearing.com.au/'), 'official AHC URL');
  assert.ok(!html.includes('fairfieldcity.nsw.gov.au'), 'council directory link gone');
});

test('showreel stays the motion preview — no 8s reel shipped (Phoenix law)', () => {
  assert.ok(!fs.existsSync(path.join(artifactDir, 'media', 'lee-vu-reel.mp4')), 'no reel mp4 shipped');
  assert.ok(!photos.includes('LEE_VIDEO'), 'photos.js must not wire a video');
  assert.ok(html.includes("['assets/showreel.mp4','showreel.mp4']"), 'player falls back to motion mode');
  assert.ok(html.includes("mode='motion'"), 'motion preview mode present');
});

test('reel duration labels consistent in EN and VI', () => {
  assert.ok(html.includes('>1 minute<'), 'EN duration on reel card');
  assert.ok(html.includes('Showreel · 1 minute'), 'EN modal caption');
  assert.ok(html.includes("'reel-meta':'1 phút'") && html.includes("'modal-sub':'Reel · 1 phút'"), 'VI duration consistent');
});

test('photo slots resolve to files that exist — no blank slots', () => {
  const refs = [...html.matchAll(/media\/[\w.-]+\.(?:jpg|png|webp)/g)].map(m => m[0]);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(artifactDir, ref)), `missing media file: ${ref}`);
  for (const slot of ['golden-hour', 'ballroom', 'harbour-sunset', 'portrait-burgundy']) {
    assert.ok(photos.includes(`media/lee-vu-${slot}.jpg`), `photos.js binds ${slot}`);
  }
});

test('markup hygiene — no stray close tags in scenes', () => {
  assert.ok(!html.includes('alt=""></p>'), 'no stray </p> after scene images');
  assert.ok(!html.includes('alt=""></span>'), 'no stray </span> after scene images');
});

test('EN/VI strings exist for every new customer-facing key', () => {
  for (const key of ['w-eyebrow', 'w-title', 'ev-free', 'held-b', 'b-contact']) {
    const count = html.split(`'${key}':`).length - 1;
    assert.ok(count >= 2, `${key} defined in both en and vi dictionaries (found ${count})`);
  }
});
