# Steer Club — The Doctor’s Note

A mobile-first metabolic-health learning experience. The public flow starts with a percentage dial, asks one tap-question about the visitor’s biggest doubt, then gives a seven-note quiz or myth/fact round, an honest personalised Wrapped, and an optional shared challenge. Care contact is optional and requested only with explicit consent. The experience is educational, not medical advice, and does not diagnose.

## Current delivery state

- Phase A: editorial landing, accessible dial, doubt picker, illustrated scroll story and source-linked myth wall.
- Phase B: seven-question quick quiz and myth/fact modes, five-question daily puzzle, two doubt-targeted questions per regular round, source sheets, personalized Wrapped and share assets.
- Phase C: anonymous Supabase persistence, saved doubts and cleared myths, daily streak/grace handling, same-order friend challenge, three-day shared check-ins, result/challenge OG images and an installable offline question shell.
- Phase D is implemented locally: honest care answers, consented lead capture, event analytics, an admin funnel, sources and review, and anonymous-record deletion. External database, CRM, policy and deployment integrations remain pending.

The selected Steer Club Supabase project is used through `@supabase/server`. A server-only secret is required; never add it to source control, a browser bundle, an issue, or chat. Supabase and browser storage can contain anonymous game data and, only after explicit consent, lead contact details. `/privacy` offers deletion of the current anonymous server record; deletion from an externally forwarded CRM is not connected.

## Run locally

Prerequisites: Node.js compatible with Next.js 15 and the pinned pnpm toolchain (`pnpm@11.25.0`).

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill SUPABASE_SECRET_KEY through a secure local secret manager; do not commit .env.local.
pnpm dev
```

Open `http://localhost:3000`. The server checks `/api/health` for readiness. Useful commands:

```sh
pnpm typecheck
pnpm build
pnpm start
```

`SUPABASE_URL` is the project URL (the selected project is also pinned and validated in the server helper). `SUPABASE_SECRET_KEY` is required only by server routes; it must remain server-only. Do not use a publishable key in place of the server key. In WebDev, configure the two values in the project environment, with the secret entered through the protected secret card.

## Database setup

The selected project already has the Phase B/C schema. Phase D migration 0004 has not been applied. For an authorized development project, review and apply the additive SQL files in order using the Supabase SQL editor or migration tooling:

1. `migrations/0001_steerclub_core.sql`
2. `migrations/0002_steerclub_result_rpc.sql`
3. `migrations/0003_steerclub_doubt_tracker.sql`
4. `migrations/0004_steerclub_care_analytics.sql`

They create the app’s own tables/RPC and tracker columns; they do not modify unrelated tables. The fourth migration adds anonymous event rows and consented care requests. It has not been applied to the selected project in this workspace. Review it with the project owner before applying. The app uses RLS and performs writes from protected server handlers only. Never point this app at a database with the wrong project or run synthetic test writes against shared production data.

## Local environment

Copy `.env.example` to `.env.local`. Keep every value local and out of source control:

- `SUPABASE_URL`: selected project URL; the server helper validates the project host.
- `SUPABASE_SECRET_KEY`: server-only Supabase key, needed for result, challenge, event, lead, admin and deletion persistence.
- `LEAD_WEBHOOK_URL`: optional HTTPS endpoint for forwarding a consented care request. If unset, leads are stored in Supabase only. Configure the destination and its deletion/retention handling before collecting real contact details.
- `ADMIN_PASSWORD`: strong private password required by `/admin`; do not use a shared or default value.

The local preview can render pages without these values, but protected persistence endpoints will not work. Do not submit real contact information until the database migration, privacy/retention policy, and approved care-team destination are ready.

## Care, sources and privacy

- `/care` contains general, non-diagnostic answers, language microcopy, an explicit-consent lead form and the exact note preview passed to the server.
- `/sources` lists the source notes used by both the landing myth wall and game question bank. No clinician review is claimed until a reviewer and date are supplied.
- `/privacy` explains the anonymous records and offers deletion for the browser’s server-side record. If a lead has been forwarded externally, deletion from that destination must be handled there; no external deletion integration is configured.
- `/admin` shows aggregated funnel and UTM-source counts. The event endpoint accepts allowlisted event names and properties only; lead contact fields are not selected by the dashboard.

The preview has no automatic data-retention cutoff. Set and implement an approved retention schedule before production. The care page does not promise a callback window because one has not been provided.

## Editing the question bank

Edit `public/content/questions.json`. Keep question `id` values unique and stable; each item needs its topic, prompt, three options, correct index, concise explanation, caveat, format/verdict, doubt tags and cited source records. Keep claims conservative, source links direct, and explanations short enough for the answer sheet. Each regular round needs at least two bank items for each concern; `src/lib/game.ts` selects exactly two. The shared challenge pack is the fixed seven-ID list in `src/lib/game.ts` and must contain exactly two tagged items for each of the five doubts. The server validates submitted IDs, order and score against the bank—do not change those rules to make an arbitrary client payload pass.

## Routes and embed mode

- `/` — landing, dial, one-tap doubt selection, scroll story and myth wall.
- `/play` — quiz, myth/fact, daily puzzle, Wrapped, streak and tracker entry.
- `/play?embed=1` — hides the in-app header/footer for a link or iframe embed; game controls and APIs remain same-origin.
- `/c/[id]` — friend challenge.
- `/r/[id]` — public sanitized result with dynamic social image.
- `/doubts` — anonymous doubt and cleared-myth tracker.
- `/care` — honest concern answers and optional consented contact request.
- `/sources` — source directory and review status.
- `/privacy` — storage and deletion details with a self-serve browser-record deletion action.
- `/admin` — password-protected anonymous funnel view; requires `ADMIN_PASSWORD`.
- `/api/health` — unauthenticated readiness endpoint.
- `/api/lead`, `/api/events`, `/api/admin`, `/api/privacy` — protected server handlers for consented leads, allowlisted events, aggregate reporting and deletion.

Example iframe after an approved production domain exists:

```html
<iframe
  src="https://YOUR_APPROVED_HOST/play?embed=1&amp;utm_source=meta&amp;utm_medium=paid&amp;utm_campaign=steer-club"
  title="Steer Club learning game"
  loading="lazy"
  style="width:100%;min-height:680px;border:0;border-radius:16px"
></iframe>
```

No production host has been configured in this project yet. The API stores the supported UTM values (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) on the anonymous session. For an ad destination, use `/play` or `/` on the eventual approved host. Public result and challenge links are generated from the request origin; do not hard-code a temporary Preview host.

## Deployment and repository status

The current WebDev runtime is configured for a standalone Next.js container with `/api/health` as its health check. `Dockerfile` includes the pinned toolchain and builds at image time; server secrets are read only at runtime. No Vercel deployment or external GitHub repository is connected, and this workspace has no `.git` metadata. Do not claim a production URL or GitHub delivery until those services are authorized and connected.

## Safety, privacy and accessibility

The content is general education, not clinical guidance. Never add a diagnosis, medicine/dose, efficacy promise, invented statistic, testimonial, clinician-review claim or weight target. Keep sources visible, distinguish illustration from data, preserve the exact palette and reduced-motion alternatives, and keep touch targets, keyboard focus, screen-reader labels and small-screen layouts intact. Do not collect real lead data until migration 0004, the approved retention policy, admin secret and care-team routing are configured and verified.
