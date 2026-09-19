# MC Lee Vu — repository contract

Phoenix's latest explicit request and current GitHub/live evidence are authoritative. This repository belongs only to the MC Lee Vu project. Do not mix Mystic Wellness, Phoenix Live / TRI ÂN, Keepsy, Angel Wings or Phoenix Digital customer data, credentials, branding, payment state or audiences into it.

## Current product rule

The public surface must remain truthful and dependable. Do not publish a price, availability claim, booking/deposit promise, testimonial, support promise or integration claim unless current source/provider evidence proves it.

When Phoenix asks for enquiry-only delivery, direct enquiry is the product boundary. Booking/deposit/calendar/email functionality remains gated until the required Lee-owned provider configuration is actually live and verified.

Payments, if activated, must use Lee's own Stripe/business payout path. Never route Lee customer money through another business.

## Reuse map

Before adding anything new, inspect and extend the existing:
- React/Vite public site;
- `api/` server functions;
- Supabase migration/data layer;
- Stripe checkout/webhook path;
- Google Calendar adapter;
- Resend adapter;
- real media under `public/media/`;
- existing verification workflow.

Repair before rewrite. Preserve supplied real photos/video and the approved visual direction.

## Fast path

- Repo/source/history -> `git` / `gh`.
- Verification -> existing GitHub Actions + local project commands.
- Provider truth -> provider-native API/connector/CLI.
- Substantial coding -> one GLM worker if needed.
- Do not route ordinary repo/provider checks through Mystic Portal unless the job must run unattended.

## Verification

Before a code/runtime commit:

```bash
npm ci
npm test
npm run build
git diff --check
```

The GitHub `Verify` workflow must be green for the exact commit. For client-facing changes, inspect real desktop and phone renders. A build is not deployment proof; a deployment is not proof of a working enquiry/booking path.

Visual QA must test the current intended asset, not a stale filename or retired design assumption.

## Safety

Do not:
- fabricate reviews or business facts;
- create a real charge as a test;
- weaken database/date-lock/payment confirmation logic;
- expose credentials or private booking data;
- publish or send customer-facing material without the current approval;
- silently substitute another person's image.

## Stop rule

When the requested client-facing outcome works, is visually checked and has source-bound proof, stop. Do not expand into speculative booking/CRM/marketing infrastructure.
