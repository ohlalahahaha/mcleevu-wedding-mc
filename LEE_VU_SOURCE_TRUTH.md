# MC Lee Vu — source truth

- Existing product only: do not create a replacement app, backend, repo, or design system.
- Lee Vu is a Sydney wedding MC hosting in English and Vietnamese; wedding MC since 2006; one wedding per date.
- Real contact: 0401 676 766 · mcleevu@gmail.com.
- Booking facts: A$1,000 total; A$500 booking deposit; A$500 remaining; coverage from 6:00 PM until the reception concludes.
- Pricing belongs inside booking/decision context, not as a loud homepage sales band.
- Real Lee media in `public/media/` is identity authority. Never regenerate or substitute Lee's face.
- Decorative wedding assets in `public/media/decor/` may frame the design; do not introduce fake people or testimonials.
- Public design target: luxury wedding editorial, warm ivory + deep navy + restrained champagne gold, white florals/candlelight, Sydney Harbour as a meaningful Sydney moment, generous air, real photography, simple one-page navigation.
- Reject corporate/SaaS/template drift, random floral placement, generic AI copy, equal cards, KPI styling, glassmorphism, fake awards/reviews, and decorative language without meaning.
- Preserve EN/VI, availability API contracts, Stripe return states, booking-status polling, accessibility, and mobile behavior.
- Visual acceptance: desktop 1440 + mobile 390 screenshots; score artifact parity >=80/100 before merge/deploy.
## Release output law (2026-09-25)

- `deploy-candle/` is the ONE release output: the approved candlelight artifact
  (lineage: byte-identical snapshot of live mcleevusydney.com, refined only by
  reviewed honest-copy + real-reel commits). It is what CI proofs, what the
  release artifact upload contains, and what any authorized deployment uploads.
- `dist/` is a dev rebuild of the app surface only. It must never be published
  or treated as the release, no matter that `npm run build` passes.
- Integrity: `tests/deploy-candle.manifest.sha256` pins every release file by
  sha256; `tests/release-manifest.test.js` fails on any drift. Regenerating the
  manifest is a deliberate reviewed act, shown as a diff.
- Publishing: Cloudflare Pages direct upload of `deploy-candle/` only, after
  Phoenix's explicit approval. Until a deployment has a provider receipt and
  live verification, its status is "prepared", never "live".
