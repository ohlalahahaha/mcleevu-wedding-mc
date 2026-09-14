# MC Lee Vu Sydney

One-page bilingual English/Vietnamese wedding MC website for Sydney, with real Lee Vu media, database-backed date availability, protected booking holds, Stripe deposit checkout, calendar/email adapters and a small operator admin.

## Public offer

- Wedding MC: A$1,000 total
- Booking deposit: A$500
- Remaining balance: A$500
- Coverage: 6:00 PM until the reception concludes
- Languages: English + Vietnamese
- Wedding MC since 2006
- Phone: 0401 676 766
- Email: mcleevu@gmail.com

GST and refund/cancellation wording are intentionally absent until confirmed.

## Design

The public page uses a cinematic luxury-editorial system: charcoal black, warm ivory and restrained champagne gold, with real Lee Vu photography and video as the visual focus. The working bilingual booking flow remains conversion-first and accessible across desktop and mobile. Real Lee Vu photos/video live in `public/media/`.

## Stack

- Vite + React
- Vercel Functions in `api/`
- Supabase/Postgres via REST/RPC
- Stripe Checkout
- Google Calendar OAuth refresh-token adapter
- Resend transactional email
- No extra runtime SDK dependencies

## Booking safety

The database is the source of truth. `booking_date_locks.event_date` is the unique date lock. Booking acquisition is serialized per date with a Postgres advisory transaction lock. Public availability exposes only `available`, `held`, or `unavailable` — never customer details.

Apply `supabase/migrations/001_booking.sql` before activating live booking.

## Setup

1. Copy `.env.example` to the deployment environment.
2. Apply the Supabase migration.
3. Add Lee's Stripe account keys and configure `/api/stripe-webhook` as the Stripe webhook endpoint.
4. Add Lee's Google Calendar OAuth credentials if calendar sync is required.
5. Add Resend credentials and admin notification emails if confirmation email is required.
6. Set a long random `ADMIN_ACCESS_KEY`; admin is at `/admin`.
7. Deploy to Vercel and set `PUBLIC_SITE_URL` to the production URL.

## Commands

```bash
npm install
npm test
npm run dev
npm run build
```

## Payment ownership

Customer payments must be processed by **Lee / Lee's business Stripe account** and paid out directly to Lee's nominated business bank account. Do not place Lee's bank details in this repository and do not route customer money through another business.

## Testimonials

No fabricated reviews are published. The database includes a testimonial model for real, approved client feedback only.
