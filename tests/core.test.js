import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, isIsoDate, validateFutureDate, verifyStripeSignature, cleanText, validEmail } from '../server/core.js';

const noEnv = {};

test('date format validation is strict', () => {
  assert.equal(isIsoDate('2026-10-03'), true);
  assert.equal(isIsoDate('03/10/2026'), false);
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isIsoDate('2028-02-29'), true);
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

test('availability rejects calendar-invalid dates before touching the database', async () => {
  let databaseTouched = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { databaseTouched = true; throw new Error('unexpected fetch'); };
  try {
    const result = await handleApi({ method: 'GET', path: '/api/availability', query: { date: '2027-02-30' }, env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key' } });
    assert.equal(result.status, 400);
    assert.equal(databaseTouched, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('create-checkout rejects calendar-invalid dates before acquiring a hold', async () => {
  let databaseTouched = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { databaseTouched = true; throw new Error('unexpected fetch'); };
  try {
    const body = JSON.stringify({ eventDate: '2027-11-31', customerName: 'Anna', partnerName: 'Binh', email: 'couple@example.com', phone: '0400000000' });
    const result = await handleApi({ method: 'POST', path: '/api/create-checkout', bodyText: body, env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_SECRET_KEY: 'stripe-key', PUBLIC_SITE_URL: 'https://site.test' } });
    assert.equal(result.status, 400);
    assert.equal(databaseTouched, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('create-checkout releases the hold when checkout attachment loses the date lock', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    calls.push({ target, body: options.body });
    if (target.startsWith('https://api.stripe.com/')) return new Response(JSON.stringify({ id: 'cs_deposit', url: 'https://checkout.test/deposit' }), { status: 200 });
    if (target.includes('/rpc/acquire_booking_hold')) return new Response('null', { status: 200 });
    if (target.includes('/rpc/attach_checkout_session')) return new Response('false', { status: 200 });
    if (target.includes('/rpc/release_booking_hold')) return new Response('null', { status: 200 });
    throw new Error(`unexpected request: ${target}`);
  };
  try {
    const body = JSON.stringify({ eventDate: '2026-12-05', customerName: 'Anna', partnerName: 'Binh', email: 'couple@example.com', phone: '0400000000' });
    const result = await handleApi({ method: 'POST', path: '/api/create-checkout', bodyText: body, env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_SECRET_KEY: 'stripe-key', PUBLIC_SITE_URL: 'https://site.test' } });
    assert.equal(result.status, 409);
    assert.deepEqual(result.body, { error: 'That date is no longer available.' });
    assert.equal(calls.some(({ target }) => target.includes('/rpc/release_booking_hold')), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('create-checkout completes only when checkout attachment succeeds', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    calls.push(target);
    if (target.startsWith('https://api.stripe.com/')) return new Response(JSON.stringify({ id: 'cs_deposit', url: 'https://checkout.test/deposit' }), { status: 200 });
    if (target.includes('/rpc/acquire_booking_hold')) return new Response('null', { status: 200 });
    if (target.includes('/rpc/attach_checkout_session')) return new Response('true', { status: 200 });
    throw new Error(`unexpected request: ${target}`);
  };
  try {
    const body = JSON.stringify({ eventDate: '2026-12-05', customerName: 'Anna', partnerName: 'Binh', email: 'couple@example.com', phone: '0400000000' });
    const result = await handleApi({ method: 'POST', path: '/api/create-checkout', bodyText: body, env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_SECRET_KEY: 'stripe-key', PUBLIC_SITE_URL: 'https://site.test' } });
    assert.equal(result.status, 200);
    assert.equal(result.body.url, 'https://checkout.test/deposit');
    assert.equal(calls.some((target) => target.includes('/rpc/release_booking_hold')), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
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

test('stripe webhook rejects completed sessions without a known payment type', async () => {
  const raw = JSON.stringify({ id: 'evt_missing_type', type: 'checkout.session.completed', data: { object: { id: 'cs_deposit', payment_status: 'paid', amount_total: 50000, currency: 'aud', metadata: { booking_id: 'booking-id' } } } });
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('whsec_test'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`))).toString('hex');
  let confirmCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('/rpc/confirm_booking_from_stripe')) { confirmCalled = true; return new Response('null', { status: 200 }); }
    if (target.includes('stripe_webhook_events')) return new Response(JSON.stringify([{ stripe_event_id: 'evt_missing_type' }]), { status: 200 });
    throw new Error(`unexpected request: ${target}`);
  };
  try {
    const result = await handleApi({ method: 'POST', path: '/api/stripe-webhook', bodyText: raw, headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_WEBHOOK_SECRET: 'whsec_test' } });
    assert.equal(result.status, 500);
    assert.equal(confirmCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('stripe webhook rejects a balance payment from an unlinked checkout session', async () => {
  const raw = JSON.stringify({ id: 'evt_balance_mismatch', type: 'checkout.session.completed', data: { object: { id: 'cs_wrong', payment_status: 'paid', amount_total: 50000, currency: 'aud', payment_intent: 'pi_balance', metadata: { booking_id: 'booking-id', payment_type: 'balance' } } } });
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('whsec_test'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`))).toString('hex');
  let confirmCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('/rpc/confirm_balance_payment')) { confirmCalled = true; return new Response('null', { status: 200 }); }
    if (target.includes('bookings?')) return new Response(JSON.stringify([{ id: 'booking-id', status: 'confirmed', stripe_balance_checkout_session_id: 'cs_expected' }]), { status: 200 });
    if (target.includes('stripe_webhook_events')) return new Response(JSON.stringify([{ stripe_event_id: 'evt_balance_mismatch' }]), { status: 200 });
    throw new Error(`unexpected request: ${target}`);
  };
  try {
    const result = await handleApi({ method: 'POST', path: '/api/stripe-webhook', bodyText: raw, headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_WEBHOOK_SECRET: 'whsec_test' } });
    assert.equal(result.status, 500);
    assert.equal(confirmCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('stripe webhook can process a retry after transient booking confirmation fails', async () => {
  const raw = JSON.stringify({ id: 'evt_retry', type: 'checkout.session.completed', data: { object: { id: 'cs_deposit', payment_status: 'paid', amount_total: 50000, currency: 'aud', payment_intent: 'pi_deposit', metadata: { booking_id: 'booking-id', payment_type: 'deposit' } } } });
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('whsec_test'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`))).toString('hex');
  let reserved = false;
  let confirmAttempts = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    if (target.includes('/rpc/confirm_booking_from_stripe')) {
      confirmAttempts += 1;
      if (confirmAttempts === 1) return new Response(JSON.stringify({ message: 'transient database failure' }), { status: 503 });
      return new Response('null', { status: 200 });
    }
    if (target.includes('bookings?')) return new Response('[]', { status: 200 });
    if (target.includes('stripe_webhook_events') && options.method === 'POST') {
      if (reserved) return new Response('[]', { status: 200 });
      reserved = true;
      return new Response(JSON.stringify([{ stripe_event_id: 'evt_retry' }]), { status: 200 });
    }
    if (target.includes('stripe_webhook_events') && options.method === 'DELETE') {
      reserved = false;
      return new Response(null, { status: 204 });
    }
    throw new Error(`unexpected request: ${target}`);
  };
  try {
    const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service-key', STRIPE_WEBHOOK_SECRET: 'whsec_test' };
    const first = await handleApi({ method: 'POST', path: '/api/stripe-webhook', bodyText: raw, headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, env });
    const retry = await handleApi({ method: 'POST', path: '/api/stripe-webhook', bodyText: raw, headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, env });
    assert.equal(first.status, 500);
    assert.equal(retry.status, 200);
    assert.equal(confirmAttempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
