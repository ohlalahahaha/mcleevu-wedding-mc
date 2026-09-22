import { Bench } from 'tinybench';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import {
  handleApi,
  isIsoDate,
  validateFutureDate,
  cleanText,
  validEmail,
  verifyStripeSignature,
} from '../server/core.js';

// Precompute a valid signature once so the benchmark times verification only.
const SECRET = 'whsec_bench';
const RAW_BODY = '{"id":"evt_bench","type":"checkout.session.completed"}';
const TIMESTAMP = 1800000000;
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(SECRET),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign'],
);
const signature = Buffer.from(
  await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${TIMESTAMP}.${RAW_BODY}`),
  ),
).toString('hex');
const signatureHeader = `t=${TIMESTAMP},v1=${signature}`;

const bench = withCodSpeed(new Bench());

bench
  .add('isIsoDate valid', () => {
    isIsoDate('2026-12-05');
  })
  .add('validateFutureDate valid', () => {
    validateFutureDate('2026-12-05');
  })
  .add('cleanText sanitise', () => {
    cleanText('<script>Anna & Binh</script>', 120);
  })
  .add('validEmail check', () => {
    validEmail('couple@example.com');
  })
  .add('verifyStripeSignature valid', async () => {
    await verifyStripeSignature(RAW_BODY, signatureHeader, SECRET, TIMESTAMP);
  })
  .add('handleApi availability invalid date', async () => {
    await handleApi({
      method: 'GET',
      path: '/api/availability',
      query: { date: 'not-a-date' },
      env: {},
    });
  });

await bench.run();
console.table(bench.table());
