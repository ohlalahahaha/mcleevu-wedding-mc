import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { isIsoDate, validateFutureDate, verifyStripeSignature, cleanText, validEmail } from '../api/_lib.js';

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

test('Stripe signature verifier accepts a valid current signature', () => {
  const secret = 'whsec_test';
  const raw = Buffer.from('{"id":"evt_1"}');
  const timestamp = 1800000000;
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw.toString('utf8')}`).digest('hex');
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, timestamp), true);
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=bad`, secret, timestamp), false);
});
