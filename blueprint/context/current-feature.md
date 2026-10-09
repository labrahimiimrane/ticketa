# Feature: Production deployment

**From build-plan:** feature 13
**Build attempt:** 1
**Branch:** feature/production-deployment

## Goal

Make the app deployable as a Render Node web service with Puppeteer's Chrome
available at runtime, deploy it to the Render-provided domain, and prove that
PNG and PDF export work in production.

## In scope

- Keep Puppeteer's downloaded Chrome inside the project directory so the copy
  fetched during Render's build is still present when the service runs.
- Pin the Node runtime Render uses (Next.js 16 needs Node 20.9+).
- A `render.yaml` Blueprint for one web service: build `npm ci && npm run build`,
  start `npm run start`, health check on `/`, no env vars.
- A short "Deploy" section in `README.md`: how to create the service from the
  Blueprint and the production smoke-test commands.
- Deploying (after explicit approval, see Build steps) and recording observed
  production results for `/`, PNG export, and PDF export.

## Out of scope

- Feature 14 work: memory profiling, render concurrency limits, browser reuse,
  rate limiting, broader error handling, production config tuning.
- Custom domain, CI checks (`/ci`), Docker, env vars, any server storage.
- Changing the export API, ticket templates, or render page.

## Build loop

`workflow.stepReview` is `feature`: implement all steps, then present one review
packet. `checkpointCommits` is `disabled`; `/complete` makes the feature commit.
Step 4 contains outward actions (git push, Render service creation) and stops for
a separate explicit yes in chat regardless of review cadence.

## Build steps

- [x] 1. **Chrome survives build-to-runtime.** Add `.puppeteerrc.cjs` setting
  `cacheDirectory` to `<project>/.cache/puppeteer`; add `/.cache/` to `.gitignore`;
  re-run `npm install` (or `npx puppeteer browsers install chrome`) so Chrome lands
  there. Add `"engines": { "node": "24.x" }` to `package.json`.
  **Done when:** Chrome exists under `.cache/puppeteer`, `npx tsc --noEmit`,
  `npm run lint`, and `npm run build` pass, and with `npm run start` running,
  `POST /api/export/png` and `/api/export/pdf` with a schema-valid body return
  200 with `image/png` and `application/pdf` (files open and match the preview).
- [x] 2. **Render Blueprint.** Add `render.yaml`: one `web` service,
  `runtime: node`, `plan` per the open question, `buildCommand: npm ci && npm run build`,
  `startCommand: npm run start`, `healthCheckPath: /`, no `envVars`. Rely on
  Render's `PORT`; `lib/export/render-ticket.ts` already derives its loopback
  origin from `PORT`, so `RENDER_ORIGIN` stays unset.
  **Done when:** the file contains only those fields and matches the Overview's
  Deployment section; build still passes.
- [x] 3. **Deploy docs and smoke commands.** Add a "Deploy" section to `README.md`:
  create the service via Render → New → Blueprint from the repo; then three
  `curl` checks against `$URL` (GET `/` → 200; POST PNG and PDF with a minimal
  schema-valid JSON body → 200, correct `Content-Type`, saved to a file). Build the
  sample body from `lib/export/export-request.ts`; keep it inline in the README
  (no new fixture file or script).
  **Done when:** the commands run successfully against the local production
  server from step 1.
- [ ] 4. **Deploy and verify in production (approval-gated).** Stop and ask for an
  explicit yes before each outward action: adding a git remote / pushing the
  branch, and the user creating the Render service. The user performs the Render
  dashboard steps and reports the URL. Then run the README smoke commands against
  it and also download PNG and PDF from the live UI.
  If Chrome fails to launch in production, capture the Render log line and stop:
  a missing-library or sandbox failure is a decision (e.g. `--no-sandbox`, Docker
  runtime) that comes back for review, not a silent workaround.
  **Done when:** the live URL, health-check status, and observed PNG/PDF results
  (status, content type, file opens, matches preview) are recorded in this spec's
  Notes.

## Files / areas

- `.puppeteerrc.cjs` (new), `.gitignore`, `package.json` (`engines`)
- `render.yaml` (new)
- `README.md` (Deploy section)
- Read-only reference: `lib/export/render-ticket.ts`, `lib/export/handle-export.ts`,
  `lib/export/export-request.ts`, `app/api/export/{png,pdf}/route.ts`

## Data / contracts

- No change to the export API: `POST /api/export/{png,pdf}`, JSON body validated by
  `exportRequestSchema`, 512 KB limit; errors `413 too_large`, `400 invalid_json`,
  `400 invalid_ticket`, `500 render_failed`.
- No env vars, no persisted server data. `next/font/google` fetches Geist at build
  time, so the Render build needs outbound network (default on Render).

## Testing

- No test runner and no Verify command exist. Gates: `npx tsc --noEmit`,
  `npm run lint`, `npm run build`, local production smoke (step 1/3), production
  smoke (step 4).
- Production evidence must be observed, not assumed; record any skipped check as
  skipped.

## Notes for the AI

- Untracked `components/generator/use-fit-scale 2.ts` and
  `blueprint/history/features/12-responsive-ui 2.md` look like Finder duplicates.
  Do not stage them; the `.ts` copy can still affect local `tsc`. Ask the user
  before deleting.
- Render runs the build and the service from the same project directory, which is
  why the in-project Puppeteer cache works; the default `~/.cache/puppeteer` is
  not kept between build and runtime.
- Do not add `--no-sandbox` or other launch flags speculatively (see step 4).
- No git remote exists yet. Never push or create remote resources without a
  separate yes in the current chat.

## Open questions

- **Render instance plan:** Free (512 MB RAM, spins down when idle, cold starts;
  Chrome plus Next.js may hit the memory cap) or a paid plan such as Starter.
  This sets cost and `render.yaml`'s `plan`. Default if unanswered: `free`.
- **Git hosting:** which GitHub (or GitLab/Bitbucket) repository Render should
  deploy from, and its visibility. Needed before step 4 only.
