import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, isIsoDate, validateFutureDate, verifyStripeSignature, cleanText, validEmail } from '../server/core.js';

const noEnv = {};

test('date format validation is strict', () => {
  assert.equal(isIsoDate('2026-10-03'), true);
  assert.equal(isIsoDate('03/10/2026'), false);
});

test('future date validation rejects malformed dates', () => {
  assert.equal(validateFutureDate('not-a-date'), false);
});

test('input cleaning removes angle brackets and truncates', () => {
  assert.equal(cleanText('<script>hello</script>', 8), 'scripthe');
});

test('email validation accepts ordinary email and rejects malformed input', () => {
  assert.equal(validEmail('couple@example.com'), true);
  assert.equal(validEmail('couple@'), false);
});

test('Stripe signature verifier accepts a valid current signature and rejects bad ones', async () => {
  const secret = 'whsec_test';
  const raw = '{"id":"evt_1"}';
  const timestamp = 1800000000;
  const crypto = globalThis.crypto;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`))).toString('hex');
  assert.equal(await verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, timestamp), true);
  assert.equal(await verifyStripeSignature(raw, `t=${timestamp},v1=bad`, secret, timestamp), false);
  assert.equal(await verifyStripeSignature(raw, null, secret, timestamp), false);
  assert.equal(await verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, timestamp + 600), false);
});

test('availability returns honest JSON 503 when the database is not connected', async () => {
  const result = await handleApi({ method: 'GET', path: '/api/availability', query: { date: '2026-12-05' }, env: noEnv });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'Online availability is not connected yet.');
});

test('availability rejects invalid dates before touching the database', async () => {
  const result = await handleApi({ method: 'GET', path: '/api/availability', query: { date: 'yesterday' }, env: noEnv });
  assert.equal(result.status, 400);
});

test('create-checkout rejects incomplete details and wrong methods', async () => {
  const post = await handleApi({ method: 'POST', path: '/api/create-checkout', bodyText: '{"eventDate":"2026-12-05","customerName":"A"}', env: noEnv });
  assert.equal(post.status, 400);
  const get = await handleApi({ method: 'GET', path: '/api/create-checkout', env: noEnv });
  assert.equal(get.status, 405);
});

test('create-checkout returns honest JSON 503 when payments are not connected', async () => {
  const body = JSON.stringify({ eventDate: '2026-12-05', customerName: 'Anna', partnerName: 'Binh', email: 'couple@example.com', phone: '0400000000' });
  const result = await handleApi({ method: 'POST', path: '/api/create-checkout', bodyText: body, env: noEnv });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'Secure checkout is not connected yet.');
});

test('stripe webhook rejects unsigned or invalid-signature posts', async () => {
  const unsigned = await handleApi({ method: 'POST', path: '/api/stripe-webhook', bodyText: '{"id":"evt_1"}', headers: {}, env: noEnv });
  assert.equal(unsigned.status, 400);
  const badSignature = await handleApi({ method: 'POST', path: '/api/stripe-webhook', bodyText: '{"id":"evt_1"}', headers: { 'stripe-signature': 't=1800000000,v1=deadbeef' }, env: noEnv });
  assert.equal(badSignature.status, 400);
});

test('admin endpoints require the access key', async () => {
  const noKey = await handleApi({ method: 'GET', path: '/api/admin-bookings', headers: {}, env: { ADMIN_ACCESS_KEY: 'real-key' } });
  assert.equal(noKey.status, 401);
  const wrongKey = await handleApi({ method: 'GET', path: '/api/admin-bookings', headers: { 'x-admin-key': 'wrong' }, env: { ADMIN_ACCESS_KEY: 'real-key' } });
  assert.equal(wrongKey.status, 401);
});

test('unknown API paths return JSON 404', async () => {
  const result = await handleApi({ method: 'GET', path: '/api/nope', env: noEnv });
  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'Not found' });
});
