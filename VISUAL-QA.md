# VISUAL QA — Phoenix's laws for mcleevusydney.com

Every visual change to deploy-candle renders and is checked against this list
at BOTH widths (1440×900 desktop, 390×844 phone) BEFORE Phoenix sees it.
A screenshot is evidence, not a claim. If any line fails, fix it first —
Phoenix never mediates a defect this list could have caught.

## Hero — photo
1. Zoom-out means the WHOLE frame is visible: Lee's full figure scale reads
   "in the room", never a cover-crop that enlarges him. If the phone crop
   would enlarge him, re-derive the phone layout — never reuse the desktop
   crop values.
2. Candle wall behind Lee must be clearly visible on desktop (both sides of
   him) and around him on phone — brightness(1.07), no right-side shade over
   the candles.
3. No hard photo edges: mask-feather every edge that meets the ink; a visible
   seam or source vignette line = fail.
4. Photo edges/subject sit where the composition says; left side of the photo
   must NOT be faded or hidden on phone — candlelight and the mic hand show
   in full.

## Hero — copy & controls
5. No text ever overlaps Lee's face. Title clearance checked at both widths
   and both languages.
6. The lede ("Since 2006, Lee Vu has hosted…") is VISIBLE on phone. The
   "Watch Lee in action" ghost button stays HIDDEN on phone — single
   Book Your Date CTA.
7. Book Your Date on phone is prominent: larger padding/type than base, sits
   low in the frame with `env(safe-area-inset-bottom)` clearance so browser
   chrome never covers it.
8. Hero fills the phone screen: `min-height` includes 100dvh so no light
   section shows below when the mobile browser bar collapses.

## Release
9. "Ask ChatGPT before pushing live" happens in Phoenix's VISIBLE chat
   (his logged-in thread), with before/after screenshots — never a terminal
   call he cannot watch.
10. Iterate the file until Phoenix says he is satisfied; deploy only when he
    approves or explicitly orders the push. Each deploy bumps the build
    marker; poll the live marker before claiming "live".

## Standing content laws (unchanged)
- Keep the heartfelt (invented) kind-words testimonials.
- Never ship the 8s reel; motion preview + "1 minute" labels stay.
- Lee's face is never regenerated or substituted.
- AHC links to the official https://acoustichearing.com.au/
  (artifact.test.js pins it).
