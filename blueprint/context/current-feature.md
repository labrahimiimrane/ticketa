# Feature: Production deployment

**From build-plan:** feature 13
**Build attempt:** 1
**Branch:** feature/production-deployment

## Goal

Make the app deployable to Vercel with PNG/PDF export working inside a Vercel
serverless function, deploy it from the GitHub repository, and prove that PNG and
PDF export work on the deployed site.

## In scope

- Run export rendering on Vercel with `puppeteer-core` plus `@sparticuz/chromium`
  (a Chromium build that fits the function size limit), while local development
  keeps using the full `puppeteer` package's Chrome.
- Point the export renderer at the deployment's own public origin on Vercel,
  derived from Vercel's system env vars, never from request headers.
- Skip Puppeteer's Chrome download during Vercel builds.
- Remove the Render-only setup from the branch's first checkpoint (`render.yaml`,
  in-project Chrome cache).
- Rewrite the README "Deploy" section for Vercel, keeping the `curl` smoke checks.
- Deploying (the user imports the repo in Vercel) and recording observed results
  for `/`, PNG export, and PDF export on the deployed URL.

## Out of scope

- Feature 14 work: memory profiling, render concurrency limits, browser reuse,
  rate limiting, broader error handling, function memory/duration tuning.
- `vercel.json`, custom domain, CI checks (`/ci`), protection-bypass secrets.
- Changing the export API, ticket templates, or render page.

## Build loop

`workflow.stepReview` is `feature`: implement all steps, then present one review
packet. `checkpointCommits` is `disabled`; `/complete` makes the feature commit.
The branch already carries checkpoint `c7d83ad` (Render config, pushed); the
squash merge in `/complete` folds it away. Step 4 contains outward actions (git
push, Vercel project creation) and stops for a separate explicit yes in chat.

## Build steps

- [x] 1. **Serverless Chrome.** Move `puppeteer` to `devDependencies`; add
  `puppeteer-core` and `@sparticuz/chromium` to `dependencies`, choosing the
  `puppeteer-core` version that supports the bundled Chromium per the
  `@sparticuz/chromium` README. In `lib/export/render-ticket.ts`, replace the
  direct `puppeteer.launch` with one local `launchBrowser()` that, when
  `process.env.VERCEL` is set, launches `puppeteer-core` with
  `executablePath: await chromium.executablePath()` and `args: chromium.args`;
  otherwise dynamically imports `puppeteer` and launches as today. Keep the
  existing 20 s deadline around the launch.
  **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm run build` pass; the
  build trace for `/api/export/png` (`.next/server/app/api/export/png/route.js.nft.json`)
  lists `@sparticuz/chromium`'s `bin` files (if not, add an
  `outputFileTracingIncludes` entry for both export routes in `next.config.ts`);
  and the local production smoke (PNG and PDF → 200 with correct content types)
  still passes.
- [x] 2. **Render origin on Vercel.** In `renderOrigin()`, keep `RENDER_ORIGIN`
  first, then use `https://${VERCEL_PROJECT_PRODUCTION_URL}` when
  `VERCEL_ENV === "production"`, then `https://${VERCEL_URL}` when set, then the
  existing `127.0.0.1:${PORT}` loopback. Update the comment: the origin is still
  fixed server configuration, never the request's Host header, so the request
  interception allowlist keeps the same guarantee.
  **Done when:** typecheck and lint pass and local smoke still passes (no Vercel
  vars set → loopback).
- [x] 3. **Remove Render setup; Vercel docs.** Delete `render.yaml`. Change
  `.puppeteerrc.cjs` to only `skipDownload: Boolean(process.env.VERCEL)` (default
  cache location again); remove the `/.cache/` `.gitignore` entry and the local
  `.cache/puppeteer` download. Rewrite README "Deploy" for Vercel: import
  `labrahimiimrane/ticketa` in Vercel (framework auto-detected, no env vars),
  note the Deployment Protection requirement for previews, keep the three `curl`
  checks with `URL=https://<deployment>.vercel.app`. Keep `engines.node: 24.x`
  (supported by Vercel).
  **Done when:** no `render.yaml` or Render references remain outside history;
  `npm run build` passes; local smoke passes using Chrome from the default
  Puppeteer cache.
- [ ] 4. **Deploy and verify (approval-gated).** Ask for an explicit yes before
  pushing the branch. The user imports the repo in Vercel and shares the branch's
  preview deployment URL (production branch stays `main` until `/complete`).
  Run the README smoke checks against it and download PNG and PDF from the live
  UI. If Chromium fails to launch or the function errors, capture the Vercel
  function log line and stop for review; do not add launch flags or config
  speculatively.
  **Done when:** the deployment URL, `GET /` status, and observed PNG/PDF results
  (status, content type, file opens, matches preview) are recorded in Notes.

## Files / areas

- `package.json`, `package-lock.json` (dependencies)
- `lib/export/render-ticket.ts` (`launchBrowser`, `renderOrigin`)
- `next.config.ts` (only if the trace check in step 1 fails)
- `.puppeteerrc.cjs`, `.gitignore`, `render.yaml` (deleted), `README.md`
- Read-only: `lib/export/handle-export.ts`, `lib/export/export-request.ts`,
  `app/api/export/{png,pdf}/route.ts`, `app/render/ticket/page.tsx`

## Data / contracts

- Export API unchanged: `POST /api/export/{png,pdf}`, JSON validated by
  `exportRequestSchema`, 512 KB limit; errors `413 too_large`, `400 invalid_json`,
  `400 invalid_ticket`, `500 render_failed`.
- Render origin precedence: `RENDER_ORIGIN` → production domain
  (`VERCEL_ENV=production`) → `VERCEL_URL` → `127.0.0.1:${PORT}`. All are
  server-side env vars set by the operator or Vercel.
- No user-set env vars required. No persisted server data.

## Testing

- No test runner or Verify command. Gates: `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, local production smoke (`npm run start` + `curl`), trace check,
  deployed smoke (step 4).
- Local runs cannot exercise `@sparticuz/chromium` (Linux-only binary); only the
  Vercel deployment proves that path. Do not claim it from local evidence.

## Notes for the AI

- `next/dist/lib/server-external-packages.jsonc` already externalizes
  `puppeteer`, `puppeteer-core`, and `@sparticuz/chromium`; do not add
  `serverExternalPackages`.
- On Vercel the export function loads `/render/ticket` over the public URL; with
  Vercel Authentication on, preview and deployment-specific URLs return 401 to
  both the smoke `curl` and the function's own browser.
- Vercel Hobby defaults (Fluid compute) give enough memory and duration for one
  render within the existing 20 s deadline; tuning is feature 14.
- The production-domain branch of `renderOrigin()` only runs after `/complete`
  merges to `main` and `main` is pushed; re-run the smoke checks on the production
  domain then.
- Untracked `components/generator/use-fit-scale 2.ts` and
  `blueprint/history/features/12-responsive-ui 2.md` are Finder duplicates: never
  stage them.
- Never push or create remote resources without a separate yes in chat.

## Open questions

- **Preview deployment protection:** Vercel Authentication blocks preview URLs
  for unauthenticated requests, including the export function calling its own
  page. Recommended: turn it off for this project (Settings → Deployment
  Protection), since the app is public, accountless, and holds no secrets.
  Alternative: verify only after merging to `main` on the production domain.
  Needed before step 4.
