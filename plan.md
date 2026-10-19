# Steer Club — The Doctor’s Note

## Purpose and delivery sequence

Build a mobile-first editorial education experience that gives sceptical Indian visitors a useful, non-diagnostic two-minute play experience and an optional, doubt-aware route to clinician consultation. The user has now explicitly asked to complete Phases **A**, **B** and **C** in this run. Phase A is implemented and was already reviewed at 375px; proceed through B and C without another between-phase approval pause, but only advance after the preceding phase is smooth at a 375px viewport. Deliver a working Preview for each phase in the final handoff. Phase D remains outside the current request.

The user asked for Next.js App Router, TypeScript, Tailwind, GSAP/ScrollTrigger, Framer Motion, Lenis, Supabase Postgres or Vercel Postgres, Vercel deployment and a GitHub repo. Use the current Manus WebDev project for the working Preview. The user selected the active Supabase **SteerClub** project in `ap-south-1` and supplied its project URL, publishable key and instructions to use `@supabase/server`; use that official server package with a protected server-only `SUPABASE_SECRET_KEY`, never a raw database URL or browser-visible secret. The protected secret must be supplied through the secure project input card before persistence routes can be live-tested. Do not silently replace the selected Supabase project with Manus-managed MySQL. Phase A was a static export; B adds `/play` and public result pages; C uses a Next.js server container, API routes, anonymous Supabase persistence, dynamic `/c/[id]` and `/r/[id]` routes, fair same-order friend challenges, streaks and offline support. Supabase schema work is additive and must not run test writes against shared production data. Vercel and external GitHub delivery are not configured; no external URL/repository will be claimed until connected. No CRM/webhook URL, actual Steer website URL, logo/font attachments, callback window, VAPID contact, or clinician-review confirmation has been supplied. The brand is **Steer Club**. Use the approved serif wordmark fallback, no invented brand reference, and safe educational language unless a clinician review is confirmed.

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

Use Next.js App Router + TypeScript + Tailwind, with Framer Motion for small UI transitions and GSAP/ScrollTrigger for the story section. Add Lenis only if it remains accessible and can be cleanly disabled for reduced motion. Use CSS variables for the palette and real text for all content. The Phase A interactive dial and plot are deterministic inline SVG; the supplied five story illustrations are reused. Phase B rounds stay anonymous and local-first, with result persistence through Next.js routes and the Supabase `@supabase/server` admin client. Phase C writes result/session updates through an additive Postgres RPC so daily streak changes and challenge completion stay atomic; protect tables with RLS and keep the server key out of browser bundles. Use a curated seven-question challenge pack that contains exactly two questions addressing each of the five doubt options, allowing both friends to choose different doubts while answering the same questions in the same order. Build the server runtime as a standalone Next.js container; direct-entry `/r/[id]` and `/c/[id]` pages resolve on the server. Add a service worker for same-origin app-shell/question-bank caching only, never cache private API responses, and keep push opt-in disabled until a real VAPID contact and key pair are supplied. Optimize JS and avoid cumulative layout shift.

```text
src/app/                    App Router pages, metadata, global layout/styles
  page.tsx                  Phase A landing and reveal
  play/page.tsx             Phase B game-only / embed flow
  c/[id]/page.tsx            Phase C challenge entry
  r/[id]/page.tsx            Phase B public result/share route
  care/page.tsx              Phase D care options and lead flow
  admin/page.tsx             Phase D protected funnel view
  api/                       Phase C persistence and challenge route handlers
src/components/landing/     Header, hero, accessible dial, reveal, doubt picker,
                             illustrated day story, myth wall, trust block, footer
src/components/shared/      Wordmark, paper motifs, buttons, reduced-motion helpers
src/content/                 Editorial copy and game content models
src/lib/                     Anonymous session, personalization, events, persistence,
                             validation, i18n, share/challenge helpers
public/content/questions.json  Editable, sourced 30+ question bank
public/                       Fonts, supplied illustrations, PWA assets and route manifest
```

The complete intended page-route manifest must remain served at `/manus-routes.json` and be updated for `/play`, `/r/:id` and `/c/:id`. Include meaningful initial HTML and page metadata for public routes; do not declare guessed absolute canonical/social URLs before a real public origin exists.

## Current delivery scope: Phase B and Phase C

- **B — game and Wrapped:** 30+ sourced conservative question bank at `/content/questions.json`, date-seeded seven-question rounds and daily five-question puzzle; quick quiz and myth/fact; explanation/source sheets; correct combo and progress; exactly two doubt-tagged questions in each regular seven-question round; seven-slide 9:16 personalized Wrapped, honest doubt answer, archetype, strengths, misconception, takeaway, guessed-vs-actual dial; share/download/copy and public result metadata.
- **C — challenge, streak and backend:** anonymous persisted sessions/results/challenges/check-ins through Supabase `@supabase/server`; same-order challenge round with exactly two questions tagged for each selectable doubt, side-by-side comparison and a shared three-day habit with manual check-ins; no phone-number collection, leaderboard or automatic WhatsApp messages; streak/grace days/milestones, myth jar/doubt list, returning state and installable/offline game. Push subscription UI and sending remain disabled until the owner supplies a real VAPID contact and keys; no login.
- **D — care, lead, analytics and admin:** outside this user's current request; retain these requirements for a later phase. Do not collect leads or claim forwarding until CRM/webhook details and consent flows are supplied.

## Constraints and dependencies

Never name medicines, give dosing, efficacy figures or promises; diagnose; body-shame; show weight numbers; invent testimonials, statistics, review status, sources or callback commitments. Label educational content, not medical advice; end results and care content with talk-to-a-doctor guidance and include an urgent-symptom note. Use WCAG AA contrast, 44px targets, keyboard/focus support, aria-live feedback, alt text, reduced motion, 320px+ layouts and iPhone safe areas. User-approved external production delivery (Vercel), GitHub canonical repository and Supabase/CRM integrations require their setup and confirmation; staging preview is not production deployment. Keep secrets server-side, consent explicit, data minimal, and provide deletion path.
