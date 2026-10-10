# Feature: Production deployment

**From build-plan:** feature 13
**Build attempt:** 1
**Branch:** feature/production-deployment
**Status:** verified

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
- [x] 4. **Deploy and verify (approval-gated).** Ask for an explicit yes before
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

## Verification log

- **Local (2026-10-10):** `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.
  Build traces for `/api/export/png` and `/api/export/pdf` include all four
  `@sparticuz/chromium/bin/*.br` files (via `outputFileTracingIncludes`). Local
  `npm run start` smoke: `GET /` 200, PNG 200 `image/png` 2280x900, PDF 200
  `application/pdf` one A4 landscape page; both viewed and match the preview.
- **Vercel Preview (2026-10-10):** deployment of `d6d608f` on
  `feature/production-deployment`, URL
  `https://ticketa-mn5lmluqu-labrahimiimranegmailcoms-projects.vercel.app`
  (Deployment Protection off). `GET /` 200 (0.25 s); PNG 200 `image/png`
  2280x900 (6.6 s, cold start); PDF 200 `application/pdf` one page (1.5 s). Both
  files viewed: identical to the local renders and the preview (Geist fonts, QR,
  accent). Downloads from the live UI were not exercised by the builder; the UI
  calls these same endpoints.
- **Earlier failures, resolved:** the first URL was `main`'s production
  deployment (old full-`puppeteer` code, `render_failed`); `5f7ecfc` was blocked
  by Vercel Hobby because its commit author email was not linked to the
  account. Repo-local git email is now `labrahimiimrane@gmail.com`.
- **Pending after landing:** re-run the README smoke checks on the production
  domain once `main` is pushed (exercises the `VERCEL_PROJECT_PRODUCTION_URL`
  origin branch).

## Open questions (resolved)

- **Preview deployment protection:** turned off by the user (2026-10-10).


<!-- blueprint:completion {"schemaVersion":2,"specBytes":8561,"specSha256":"91e8d0e12a2ad32ab558e8c6653a39bb166a79052994a6cc92daf56dfcff2eb5","branch":"refs/heads/feature/production-deployment","head":"6f29da43172b7326c3681f632db47bb9d1b5ed49","baseRef":"refs/heads/main","baseCommit":"ea70117a6e4850a99b7fa3c830979aa44679b40f","sourceTree":"fafadf22f056f1729d49bad313496f237ecb97b0","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 6f29da43172b7326c3681f632db47bb9d1b5ed49
**Base commit:** ea70117a6e4850a99b7fa3c830979aa44679b40f
**Base ref:** refs/heads/main
**Spec hash:** 91e8d0e12a2ad32ab558e8c6653a39bb166a79052994a6cc92daf56dfcff2eb5
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-10T00:31:42Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-10T00:33:24Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD` / `git merge-base refs/heads/main HEAD` / `shasum -a 256 blueprint/context/current-feature.md` / `git status --porcelain --untracked-files=all`: pass (target, base, spec hash match; only `blueprint/context/review.md` differs)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass
- Trace inspection of `.next/server/app/api/export/{png,pdf}/route.js.nft.json`: pass (all four `@sparticuz/chromium/bin/*.br` files included; no Puppeteer Chrome cache traced)

## Evidence

- Reviewed the spec and the full `ea70117..6f29da4` delta: `lib/export/render-ticket.ts`, `next.config.ts`, `package.json`, `package-lock.json` (new packages only), `.puppeteerrc.cjs`, `README.md`, `blueprint/build-plan.md`, `blueprint/project-plan.md`, `blueprint/context/project-overview.md`, plus read-only callers `lib/export/handle-export.ts` and `app/api/export/png/route.ts`.
- Security: `renderOrigin()` derives the origin only from server env vars (`RENDER_ORIGIN`, `VERCEL_ENV`/`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, loopback); the request-interception allowlist still compares against that fixed origin, so callers cannot redirect the server browser. Export input validation and size limits unchanged.
- Version alignment: `puppeteer-core` 25.11.0 targets Chrome 153.0.8010.36, matching `@sparticuz/chromium` 153.0.0; dev `puppeteer` pinned to the same 25.11.0.
- `render.yaml` and the `/.cache/` ignore entry are absent; no Render references remain outside workflow skills and the spec's history text.
- Deployed preview evidence (PNG/PDF 200 on Vercel) is the builder's record in the spec Verification log; this reviewer made no network requests to deployed sites.

## Findings

- None (no new findings; existing F-01 [P3] fixed is outside this delta and was not re-examined)

## Remaining risk

- No test runner or Verify command exists, so there is no automated coverage for `renderOrigin()` precedence or `launchBrowser()` branching.
- The `@sparticuz/chromium` launch path cannot run locally (Linux-only binary); only the builder's recorded Vercel preview smoke proves it.
- The production-domain branch (`VERCEL_ENV=production` -> `VERCEL_PROJECT_PRODUCTION_URL`) is unexercised until `main` is pushed; a production deployment that is not yet (or no longer) assigned to the production domain would render through another deployment's `/render/ticket` page (unverified version-skew risk).
- `launchBrowser()` uses `headless: true` with `chromium.args` rather than the `@sparticuz/chromium` README's `headless: "shell"` plus `puppeteer.defaultArgs(...)`; it works on the recorded preview, but differs from vendor guidance.
- Local non-Vercel production installs that omit dev dependencies would fail exports because `puppeteer` is now a devDependency (not a current deployment target).
