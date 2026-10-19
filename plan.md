# Steer Club — The Doctor’s Note

## Purpose and delivery sequence

Build a mobile-first editorial education experience that gives sceptical Indian visitors a useful, non-diagnostic two-minute play experience and an optional, doubt-aware route to clinician consultation. Keep the full approved scope, but implement in four review gates: **A** hero/dial/reveal/landing scroll story; **B** game/Wrapped; **C** challenge/streak/backend; **D** care/lead/analytics/admin. Deliver a working Preview after each gate and pause; do not begin the next gate until the current one is smooth at 375px and the user has reviewed it. The current implementation target is Phase A only.

The user asked for Next.js App Router, TypeScript, Tailwind, GSAP/ScrollTrigger, Framer Motion, Lenis, Supabase or Vercel Postgres, Vercel deployment and a GitHub repo. Use a Next.js-compatible project layout in the flexible WebDev workspace. Preview is provided through the current Manus WebDev project. Phase A is browser-only and publishes as a Next.js static export to `out/`; the `build` command installs from the committed lockfile and builds that directory. Backend remains off for Phase A because the user explicitly deferred it to Phase C; its API routes will require a separate server/container declaration when Phase C is approved. Vercel, GitHub and Supabase are not connected yet; their integration/deployment actions remain dependencies for the phases that need them, and no external URL/repository will be claimed until confirmed. No CRM/webhook URL, actual Steer website URL, logo/font attachments, callback window, or clinician-review confirmation has been supplied. The brand is **Steer Club**. Use the approved serif wordmark fallback, no invented brand reference, and safe educational language unless a clinician review is confirmed.

## Phase A experience and component plan

The first 375×667 viewport is for the hook, dial and lock CTA: compact wordmark/streak header; mixed-roman/italic Fraunces hero; ring dial with drag, touch, mouse, keyboard and visible value; “lock in my guess” control; small handwritten aside. Locking turns the guess into a short reveal with the genes/sleep/hormones/stress/food/environment line. Before the game is entered, ask one tap question: “what’s your biggest doubt right now?” with `safe`, `muscle loss`, `weight comes back`, `only for diabetics`, and `is it for me`. Store the selected value in anonymous client state so Phase B can use it for question selection and Phase D can include it in the lead note.

Below the first viewport: reveal offers the two game modes, daily puzzle and streak entry points; scroll narrative “a day inside your metabolism” with an explicitly non-data illustration, Indian food/routine scenes, drawn curve and 4pm margin note; scroll-linked horizontal myth wall with ten tappable cards; maroon “This is not a willpower problem” section; educational-not-medical-advice/source block (never claim clinical review without confirmation); footer, care link, sources/disclaimer, and a thumb-reach CTA that appears only below the hero. Keep screens unmistakably editorial and tactile, with restrained paper texture, linework and whitespace rather than template cards.

### Design

- **Design movement:** contemporary Indian doctor’s notebook, interpreted as quiet editorial web design rather than skeuomorphic paper.
- **Core principles:** honest before persuasive; one clear focal point per viewport; tactile marks only when they add meaning; accessible controls and readable science.
- **Color philosophy:** exact brief palette only—cream `#F5EBDF`, rust `#C04E2A`, deep maroon `#661414`, ink `#351D1D`, clay `#B58777`, blush `#E6CBBD`, and soft paper `#F8F2EB`. Cream anchors the experience; rust marks decisions; maroon carries emotional emphasis. No other accent hues.
- **Layout paradigm:** phone-first, single-column, chapter-like scroll with offset handwritten margins and a narrow editorial measure; desktop retains a phone-width narrative against a cream field.
- **Signature elements:** ring-dial as the first memorable interaction; ink-like annotations and underlines; stitched progress/curve line that carries between story scenes.
- **Interaction philosophy:** gesture and movement reveal cause/effect (guess changes the ring; scrolling advances the illustrated day). No hover-only behavior, ornamental motion, or surprise movement.
- **Animation:** short pen-stroke wordmark/notes, dial arc and number movement, gentle deal-in of reveal choices, and curve/scene progression tied to scroll position. Honor `prefers-reduced-motion` with static lines, immediate state changes, and no smooth-scroll dependency.
- **Typography:** Fraunces variable with optical sizing and italics for mixed-weight headlines and wordmark; DM Sans for body, controls and small text; a handwritten face only for small annotations. Use accessible body sizes and ink rather than clay for small text.
- **Brand essence:** useful metabolic-health literacy for people with real doubts, not an ad or diagnosis; **warm, candid, curious**.
- **Brand voice:** calm, plain-English, never shaming or promising. Examples: “Nobody can give you a clean number. But it’s more than it feels.” “A 10-minute walk may help soften the rise for some. It isn’t a test of willpower.”
- **Wordmark & logo:** “steer club” in a custom typographic lock-up using Fraunces italic in rust, with a small hand-drawn route/underline motif; do not use generated lettering or claim a supplied logo exists.
- **Signature brand color:** rust `#C04E2A`.

## Stack and project structure

Use Next.js App Router + TypeScript + Tailwind, with Framer Motion for small UI transitions and GSAP/ScrollTrigger for the story section. Add Lenis only if it remains accessible and can be cleanly disabled for reduced motion. Use CSS variables for the palette and real text for all content. The Phase A interactive dial and plot will be deterministic inline SVG, not AI-rendered data. Commission a small number of planned, consistent in-palette editorial food/routine illustrations for the story; ensure the image assets never contain text. No stock imagery. Preload/subset the chosen typefaces if feasible; optimize initial JS and avoid cumulative layout shift.

```text
src/app/                    App Router pages, metadata, global layout/styles
  page.tsx                  Phase A landing and reveal
  play/page.tsx             Phase B game-only / embed flow
  c/[id]/page.tsx            Phase C challenge entry
  r/[id]/page.tsx            Phase B public result/share route
  care/page.tsx              Phase D care options and lead flow
  admin/page.tsx             Phase D protected funnel view
  api/                       Phase C/D route handlers
src/components/landing/     Header, hero, accessible dial, reveal, doubt picker,
                             illustrated day story, myth wall, trust block, footer
src/components/shared/      Wordmark, paper motifs, buttons, reduced-motion helpers
src/content/                 Editorial copy, sources and later question bank
src/lib/                     Anonymous session, personalization, events, persistence,
                             validation, i18n, share/challenge helpers
public/                       Fonts, generated/supplied assets and route manifest
```

The complete intended page-route manifest must be served at `/manus-routes.json` before the first dev-server start and updated when routes are added. For Phase A only, include `/`; reserve declared patterns for the agreed later routes and update the manifest as their source pages land. Include meaningful initial HTML and page metadata for public routes; do not declare guessed absolute canonical/social URLs before a real public origin exists.

## Later approved gates (not started until the prior gate is smooth)

- **B — game and Wrapped:** 30+ sourced conservative question bank at `/content/questions.json`, date-seeded seven-question rounds and daily five-question puzzle; quick quiz and myth/fact; explanation/source sheets; correct combo and progress; doubt-based two-question selection; seven-slide 9:16 personalized Wrapped, honest doubt answer, archetype, strengths, misconception, takeaway, guessed-vs-actual dial; share/download/copy and public result metadata.
- **C — challenge, streak and backend:** anonymous persisted sessions/results/challenges/check-ins; same-order friend challenge and comparison; opt-in shared three-day habits with no phone-number collection or automatic WhatsApp messages; streak/grace days/milestones, myth jar/doubt list, returning state, installable/offline game and optional push. Connect Supabase or use the approved requested Postgres alternative only after service setup is confirmed; no login.
- **D — care, lead, analytics and admin:** doubt answers and tap events; clinician-guided support language within brief limits; consent-first validated +91 form; display exact warm lead note including selected doubt and UTMs; POST `/api/lead` persistence/forwarding only after CRM/webhook URL is provided; truthful callback copy; privacy/deletion/DPDP and emergency guidance; English/Hinglish with Hindi/Marathi-ready structure; event funnel and env-protected admin.

## Constraints and dependencies

Never name medicines, give dosing, efficacy figures or promises; diagnose; body-shame; show weight numbers; invent testimonials, statistics, review status, sources or callback commitments. Label educational content, not medical advice; end results and care content with talk-to-a-doctor guidance and include an urgent-symptom note. Use WCAG AA contrast, 44px targets, keyboard/focus support, aria-live feedback, alt text, reduced motion, 320px+ layouts and iPhone safe areas. User-approved external production delivery (Vercel), GitHub canonical repository and Supabase/CRM integrations require their setup and confirmation; staging preview is not production deployment. Keep secrets server-side, consent explicit, data minimal, and provide deletion path.
