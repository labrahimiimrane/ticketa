# Feature: Production hardening

**From build-plan:** feature 14
**Build attempt:** 1
**Branch:** feature/production-hardening
**Status:** verified

## Goal

Make the internet-facing PNG/PDF export endpoints safe to run in production:
bound how many Chrome instances one server instance runs at once, cap request
duration and input size, return distinct and correctly surfaced errors, measure
Puppeteer memory, and confirm the production configuration on Vercel.

## In scope

- Per-instance render concurrency limit; excess requests are rejected fast with
  `503 { "error": "busy" }` and a `Retry-After` header instead of launching
  another Chrome.
- Distinct timeout result: `504 { "error": "render_timeout" }`; other render
  failures stay `500 { "error": "render_failed" }`.
- `maxDuration` route segment config on both export Route Handlers.
- Client export message for the busy case; every other failure keeps the
  existing "Couldn't create the PNG/PDF. Try again." message.
- Measured Chrome memory and process cleanup evidence for local production.
- Server-side length limits for ticket text fields (see Open questions; step 4
  runs only after the decision).
- Production verification on Vercel, including the feature 13 pending
  production-domain smoke check (approval-gated).

## Out of scope

- Browser reuse or a warm Chrome pool across requests.
- Rate limiting or abuse protection across instances (no shared store exists in
  v1; a per-instance counter cannot enforce a global rate).
- Queueing waiting requests; busy requests are rejected, not held.
- Vercel function memory/region tuning, unless step 3's measurement shows the
  default does not fit two concurrent renders (then stop and ask).
- Security headers, CSP, or other config not tied to the export endpoint.
- The untracked `render.yaml` and `.cache/` in the working tree: not touched and
  not committed by this feature (see Notes).
- Any future-feature work (accounts, verification pages, bulk generation).

## Build loop

`workflow.stepReview` is `feature`: implement all steps, then present one review
packet for the whole feature. `workflow.checkpointCommits` is `disabled`: no
step commits; `/complete` creates the feature commit. Step 5 still pauses for an
explicit yes before any push or network action against deployments.

## Build steps

- [x] 1. **Render concurrency limit and typed render errors.** In
  `lib/export/render-ticket.ts`, add a module-level active-render counter with
  `MAX_CONCURRENT_RENDERS = 2`. `withRenderedTicket` takes a slot before
  launching Chrome and releases it only after the browser close settles (or the
  launch fails), so the slot bounds live Chrome processes, not just response
  time. When no slot is free it throws `RenderBusyError` without launching. The
  deadline rejects with `RenderTimeoutError`. In `lib/export/handle-export.ts`,
  map `RenderBusyError` to `503 {"error":"busy"}` with `Retry-After: 5` and
  `Cache-Control: no-store`, `RenderTimeoutError` to
  `504 {"error":"render_timeout"}`, anything else to the existing 500. Log
  timeouts and failures with `console.error`; do not log the request body.
  **Done when:** against `npm run build && npm run start`, four parallel PNG
  `curl`s using the README body return exactly two `200 image/png` and two `503`
  with `Retry-After: 5`; a following sequential PNG and PDF both return `200`;
  `npx tsc --noEmit` and `npm run lint` pass.

- [x] 2. **Route duration and client busy message.** Add
  `export const maxDuration = 30;` to `app/api/export/png/route.ts` and
  `app/api/export/pdf/route.ts` (covers the 20 s render deadline plus body read
  and close). In `components/generator/Generator.tsx`, treat a `503` response as
  a busy state and show "Export is busy right now. Try again in a few seconds."
  in the existing `role="status"` error line; all other non-OK responses keep
  the current message. A busy failure records no history entry, like other
  failures. **Done when:** `npm run build` succeeds with both routes listed; in
  the browser, forcing a 503 (temporarily set the limit to 0 locally, then
  revert) shows the busy message under the export buttons and buttons re-enable;
  a normal export still downloads and records history.

- [x] 3. **Memory and cleanup measurement (evidence only).** On local production,
  sample peak Chrome RSS during one PNG and one PDF render (`ps` on the Chrome
  child processes), then run 10 sequential exports and confirm no Chrome
  processes remain afterwards and Node RSS does not grow steadily. Record numbers
  in the Verification log below. **Done when:** the log lists peak Chrome RSS per
  format, the post-run Chrome process count (expected 0), and Node RSS before
  and after; if two concurrent renders would not fit Vercel's default function
  memory, stop and ask before tuning anything.

- [x] 4. **Text field length limits (after Open question 1 is answered).** Add a
  shared max length to the text fields in `lib/ticket-schema.ts` with an inline
  message, mirror it as `maxLength` on the matching inputs in
  `components/generator/TicketForm.tsx`, and confirm how saved state and history
  parsing (`lib/local-state.ts`, `lib/ticket-history.ts`) treat older entries
  that exceed it so no saved ticket is silently dropped. **Done when:** an
  over-limit export request returns `400 {"error":"invalid_ticket"}`, the form
  blocks typing past the limit, existing saved history still loads, and
  typecheck, lint, and build pass.

- [x] 5. **Production verification: deferred to after landing (user decision).**
  `/implement` cannot create the feature commit, so nothing deployable exists on
  this branch. The user chose to run the deployed checks after `/complete`. See
  Post-landing verification. **Done when:** the deferral and the exact
  post-landing checks are recorded in this spec.

## Files / areas

- `lib/export/render-ticket.ts` - concurrency slot, typed errors, close-tracked release
- `lib/export/handle-export.ts` - error-to-status mapping, `Retry-After`
- `app/api/export/png/route.ts`, `app/api/export/pdf/route.ts` - `maxDuration`
- `components/generator/Generator.tsx` - busy message
- Step 4 only: `lib/ticket-schema.ts`, `components/generator/TicketForm.tsx`,
  checks in `lib/local-state.ts` and `lib/ticket-history.ts`
- `README.md` - add the `503 busy` behavior and burst check to the Deploy section

## Data / contracts

Export endpoints `POST /api/export/png` and `POST /api/export/pdf`, request body
unchanged (`exportRequestSchema`). Responses:

| Status | Body | Headers | When |
| --- | --- | --- | --- |
| 200 | file bytes | `Content-Type`, `Content-Disposition`, `Cache-Control: no-store` | rendered |
| 400 | `{"error":"invalid_json"}` / `{"error":"invalid_ticket"}` | | unchanged |
| 413 | `{"error":"too_large"}` | | unchanged (512 KB body) |
| 503 | `{"error":"busy"}` | `Retry-After: 5`, `Cache-Control: no-store` | all render slots taken |
| 504 | `{"error":"render_timeout"}` | | 20 s deadline exceeded |
| 500 | `{"error":"render_failed"}` | | any other render failure |

The concurrency limit is per server instance (in-process counter), not global.
No persisted data changes except possibly step 4's validation (see Open
questions).

## Testing

No test runner or Verify command is configured, so there is no unit-test gate.
Evidence per step: `npx tsc --noEmit`, `npm run lint`, `npm run build`, local
production `curl` checks, a browser check for the busy message, and `ps`
measurements. The concurrency counter is logic that would merit a unit test once
`/tests` adds a runner; note it as a gap, do not add a runner here.

## Notes for the AI

- Next 16 docs: `maxDuration` is a supported route segment config in
  `route.ts` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`).
  With `cacheComponents` on, `dynamic`/`revalidate`/`fetchCache` are removed;
  do not add them.
- Keep the existing `renderOrigin()` and request-interception allowlist exactly
  as they are; they are the SSRF boundary.
- The slot must stay held while Chrome closes in the background; releasing on
  response would let a burst stack Chrome processes past the limit.
- `MAX_CONCURRENT_RENDERS = 2` and `Retry-After: 5` are internal defaults chosen
  for Vercel Fluid compute (one instance can serve several invocations); step 3's
  measurement confirms or overturns the 2.
- Untracked `render.yaml` (Render free-plan service) and `.cache/puppeteer/`
  are in the working tree. Feature 13 deliberately removed Render; leave both
  untouched and out of the feature commit unless the user decides otherwise.
- Never log request bodies; they contain attendee names and emails.

## Post-landing verification

After `/complete` merges locally and the user separately approves pushing `main`:
run the README smoke checks (`GET /`, PNG, PDF → 200 with the right content
types) and the 4-request PNG burst against the production domain. Expect at
most two `200` per instance, and every `503` must carry `Retry-After: 5`. This
also covers the production-domain smoke check feature 13 left pending. Record
the results with the archived feature. If the burst shows memory failures (500s
or function crashes rather than 503s), lower `MAX_CONCURRENT_RENDERS` with a
`/fix`.

## Resolved decisions

- **Text length limit (user, step 4):** 120 characters for event name, location,
  organizer, and attendee name; 254 for email. Form and export enforce them.
  History parsing uses the same rules without the length limits
  (`storedEventInfoSchema`, `storedAttendeeInfoSchema`), so older long tickets
  are kept. A reopened over-limit field shows "Use 120 characters or fewer" once
  touched or when a download is attempted, the same as other form errors.
- **Render limit (user):** keep `MAX_CONCURRENT_RENDERS = 2` and measure on
  Vercel in step 5.
- **Step 5 (user):** deployed checks run after `/complete`, not on a preview.
- **`render.yaml` / `.cache/` (user):** leftovers; leave untouched and out of
  every commit.

## Verification log

- **Static gates (after steps 1-2):** `npx tsc --noEmit` passed, `npm run lint` passed, `npm run build` passed and lists `ƒ /api/export/png` and `ƒ /api/export/pdf`.
- **Step 1 (local production, `npm run start`, macOS):** 4 parallel PNG requests → `200 image/png` (1.29 s), `200 image/png` (1.85 s), `503` (0.08 s), `503` (0.08 s); both 503s carried `Retry-After: 5`, `Cache-Control: no-store`, body `{"error":"busy"}`. Following sequential PNG `200 image/png` (2280×900 PNG) and PDF `200 application/pdf` (1 page).
- **Step 2 (headless Chrome via the local `puppeteer` dev package):** the 503 was simulated by intercepting `/api/export/png` in the test browser rather than setting the limit to 0, so the user's running server needed no rebuild. Result: header status read "Export is busy right now. Try again in a few seconds.", Download PDF and Download PNG were enabled, and no history entry was written. With interception off, a real PNG downloaded (`ticket-TKT-5MHR-K5BW.png`), the status cleared, and `ticketa:history` was written.
- **Step 3 (local production, macOS, Puppeteer's Chrome for Testing, not `@sparticuz/chromium`):** peak summed Chrome RSS during one render was 952 MB for PNG and 916 MB for PDF. Summed RSS counts memory that Chrome processes share more than once, so it overstates the real footprint. Node RSS was 128 MB before 10 sequential exports (alternating PNG/PDF, all `200`) and 134 MB after. Chrome processes: 0 before and 0 after. Whether two concurrent renders fit Vercel's default function memory is not proven locally; this goes to the user and step 5.
- **Step 4 (local production restarted after the rebuild; headless Chrome via `puppeteer`):** static gates passed again (`tsc`, `lint`, `build`). API: event name of 121 chars → `400 {"error":"invalid_ticket"}`, 120 → `200 image/png`; email of 255 chars → `400`, 254 → `200 image/png`. Form: typing 130 characters into Location left 120. History: a seeded old entry (`TKT-QLDX-2345`, 150-char event name) was listed and stayed stored (1 entry). After Reopen it loaded with all 150 characters; Download PNG was blocked with "Fix 1 field before downloading." and the field showed "Use 120 characters or fewer" with `aria-invalid="true"`.
- **Pre-existing bug seen during step 4 (not changed here):** after Reopen, a stale second copy of the form stays on the page. In `components/generator/Generator.tsx`, `TicketForm` and `BrandingPanel` are siblings sharing `key={reopenCount}`, and that code is identical on `main`. It needs its own `/fix`.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":12624,"specSha256":"ef521907f57b3d59f5c80c9d7aff9f3b415b11419d2f444efc73d9c8275673b8","branch":"refs/heads/feature/production-hardening","head":"9c562075d2771c4301d80d646b5316f34fcbf808","baseRef":"refs/heads/main","baseCommit":"b467b4f567ce19218c2f5d075421218707d2eee2","sourceTree":"0e662c99918e8a02416f5fb87abd23d007c77476","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 9c562075d2771c4301d80d646b5316f34fcbf808
**Base commit:** b467b4f567ce19218c2f5d075421218707d2eee2
**Base ref:** main
**Spec hash:** ef521907f57b3d59f5c80c9d7aff9f3b415b11419d2f444efc73d9c8275673b8
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-10T11:17:01Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-10T11:20:53Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `b467b4f567ce19218c2f5d075421218707d2eee2..9c562075d2771c4301d80d646b5316f34fcbf808` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `git rev-parse HEAD` / `git merge-base main HEAD` / `git status --porcelain=v1 --untracked-files=all`: pass (HEAD = target, merge base = base, only `blueprint/context/review.md` modified)
- `shasum -a 256 blueprint/context/current-feature.md`: pass (matches Spec hash; spec is tracked in the target, no snapshot required)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass (lists `ƒ /api/export/png` and `ƒ /api/export/pdf`; tree unchanged afterwards)
- Test command: unavailable (no test runner configured)
- Verify command: unavailable (not configured)

## Evidence

- Reviewed the full code delta: `lib/export/render-ticket.ts`, `lib/export/handle-export.ts`, both export `route.ts` files, `components/generator/Generator.tsx`, `components/generator/TicketForm.tsx`, `lib/ticket-schema.ts`, `lib/ticket-history.ts`, `README.md`, plus callers `lib/export/export-request.ts` and `lib/local-state.ts`.
- Concurrency slot: check-and-increment is synchronous (no await between), busy path never increments, and the single decrement runs in `.finally` after `launching` settles and `browser.close()` settles, so the slot bounds live Chrome processes as the spec requires.
- Error mapping matches the spec contract table (503 + `Retry-After: 5` + `no-store`, 504, 500); logs carry only the error, never the request body; `renderOrigin()` and the request-interception allowlist are unchanged.
- Length limits apply to form and export (`exportRequestSchema` uses the limited schemas); history parsing uses the unlimited `stored*` schemas so older long entries are kept; draft state (`local-state.ts`) only checks shape, so no saved data is dropped.
- Client: 503 shows the busy message and returns before `recordTicket`; other failures keep the existing message.

## Findings

- None (no new findings; existing F-01 left unchanged as out-of-scope context)

## Remaining risk

- No test runner or Verify command exists, so the render concurrency counter and schema limits have no automated tests (the spec records this as a known gap).
- Check was not required and was not run; no browser or runtime evidence was gathered by this reviewer (no server started, no deployed-site requests).
- Production verification on Vercel (burst behavior, whether two concurrent `@sparticuz/chromium` renders fit default function memory) is deferred to post-landing by user decision and remains unproven.
- If Chrome wedges during close, the slot stays held until Puppeteer's CDP protocol timeout and process kill complete; not observed, inferred from reading the library close path only.
- The concurrency limit is per instance, not global (documented and out of scope by design).
