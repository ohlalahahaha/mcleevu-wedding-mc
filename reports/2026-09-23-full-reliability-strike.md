# 2026-09-23 — full reliability strike

## Scope and method

This pass traced the existing React enquiry form through `server/core.js`, the Vercel/Cloudflare wrappers, the Supabase booking/lock RPCs, deposit Checkout creation, public booking status, Stripe webhook confirmation, and operator balance-link handling. Source and tests were read before edits. No payment, email, calendar event, deployment, credential change, publication, commit, or push was made.

## Baseline proof

- `npm ci` — pass (`0 vulnerabilities`, 57 packages added).
- `npm test` — pass: 12/12 tests.
- `npm run build` — pass: Vite production build, 18 modules transformed.
- `git diff --check` — pass.

The first red-test run after defect reproduction had 18 tests: 12 passed and 6 failed, proving the calendar, lost-lock, payment-type, and balance-link defects before fixes. A later red-test run for webhook retry had 19 tests: 18 passed and 1 failed, proving the failed webhook was permanently suppressed as a duplicate.

## Defects found

1. **Impossible calendar dates passed format validation.** `isIsoDate` only checked `YYYY-MM-DD`, so dates such as `2027-02-30` reached Supabase and returned a misleading 503 instead of a deterministic 400.
2. **A lost hold could still receive a payable Checkout URL.** `attach_checkout_session` returned `void` and the caller ignored whether any row updated. If the hold expired or was replaced while Stripe created the session, the server could return Checkout for a date it no longer reserved.
3. **Webhook payment type was inferred as deposit.** A completed session with no `payment_type` took the deposit branch. Invalid provider state should never be accepted as a deposit.
4. **Balance payment was not linked to the stored session.** The RPC marked any A$500 balance event paid without checking the booking's saved balance Checkout session ID, permitting inconsistent payment state.
5. **Transient webhook failure was permanently marked processed.** The event ID was inserted before processing. If confirmation failed, Stripe's retry looked like a duplicate and returned 200 without reprocessing, leaving a paid deposit unconfirmed.

## Exact changes

- `server/core.js`
  - Validates the calendar day/month/year combination in `isIsoDate` (`server/core.js:14`).
  - Requires `attach_checkout_session` to return `true`, otherwise releases the hold and returns 409 (`server/core.js:221`).
  - Classifies only exact date-lock failures as 409 (`server/core.js:228`).
  - Requires signed completed events to identify `deposit` or `balance` explicitly (`server/core.js:257`).
  - Prechecks the booking/status/session link before balance confirmation (`server/core.js:260`).
  - Reserves webhook IDs, removes the reservation when processing fails, and permits Stripe retry to process again (`server/core.js:241`, `server/core.js:285`).
- `supabase/migrations/003_booking_reliability.sql`
  - Replaces deposit attachment with a boolean RPC that succeeds only while both booking and date lock are unexpired, on hold, and on the same event date (`supabase/migrations/003_booking_reliability.sql:3`).
  - Preserves service-role-only execution after the required function replacement (`supabase/migrations/003_booking_reliability.sql:27`).
  - Locks the booking row and rejects a balance session mismatch before marking paid; matching replay remains idempotent (`supabase/migrations/003_booking_reliability.sql:30`).
- `tests/core.test.js`
  - Adds deterministic boundary/failure tests for impossible dates, successful and lost lock attachment, invalid payment type, unlinked balance session, and webhook retry after transient confirmation failure (`tests/core.test.js:51`, `tests/core.test.js:78`, `tests/core.test.js:144`, `tests/core.test.js:166`, `tests/core.test.js:189`).

No visual file, public copy, workflow, secret, environment value, or dependency was changed.

## Database migration proof

A disposable Docker Postgres 16 container applied `supabase/migrations/001_booking.sql`, `002_service_role_grants.sql`, and `003_booking_reliability.sql` with `ON_ERROR_STOP=1`. Verification covered:

- migration application — pass;
- valid hold/session attachment returned `t`;
- wrong booking attachment returned `f`;
- mismatched balance session raised `Balance checkout session mismatch`;
- matching balance confirmation and replay ended as `confirmed / paid / paid` with the expected session and payment intent.

The first migration attempt exposed that PostgreSQL refuses an in-place return-type change; `003` now explicitly drops/recreates the attachment RPC and restores its service-role grant. The disposable container was removed after verification.

## Final verification

- `npm ci` — pass (`0 vulnerabilities`).
- `npm test` — pass: 19/19 tests, 0 failed.
- `npm run build` — pass: Vite production build, 18 modules transformed, built in 231 ms.
- `git diff --check` — pass.
- Disposable Postgres migration/behavior check — pass.

## Remaining BLOCKED items

- The GitHub `Verify` workflow cannot be green on an **exact commit** from inside this job because the worker is forbidden to stage or commit. The operator must run it on the resulting commit.
- Provider-native Stripe/Supabase integration proof is intentionally not claimed here: production credentials/configuration were not touched and no provider operation was performed.
