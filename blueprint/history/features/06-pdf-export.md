# Feature: PDF export

**From build-plan:** feature 6
**Build attempt:** 1
**Branch:** feature/pdf-export
**Status:** verified

## Goal

Let the user download the current ticket as a print-ready PDF: one A4 landscape
page with the ticket centered at true size (760 x 300 CSS px = 201 x 79 mm),
rendered by Puppeteer from the same render page and `Ticket` component as the
PNG. Text stays vector (selectable, sharp at any zoom). A thin print-only cut
line shows where to trim, because a white ticket on white paper has no visible
edge.

## In scope

- Share the Puppeteer setup (launch, 20s deadline, origin lock, data injection,
  readiness) between PNG and PDF, and share the request handling (body limit,
  JSON, schema, errors) between both routes. PNG behavior must not change.
- Print-only styling on `/render/ticket`:
  - an A4 landscape page with no printer margins;
  - the ticket centered at true size;
  - the notch mask turned off;
  - a hairline SVG cut line drawn around the ticket's outline, including the
    notch arcs.
- `POST /api/export/pdf` returning the PDF.
- A "Download PDF" button in the top bar next to "Download PNG", sharing
  validation gating, busy, and error behavior.

## Out of scope

- Crop marks (declined), multiple tickets per page, Letter size, bleed.
- PDF metadata beyond Chrome's defaults.
- Browser reuse, concurrency or rate limits, and Render Chrome setup (13, 14).
- Templates (7) and branding (8). The cut line follows the current Classic stub
  outline only.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Share export plumbing.**
  - In `lib/export/render-ticket.ts`, extract
    `withRenderedTicket<T>(data, use: (page) => Promise<T>)`: launch, the shared
    deadline, origin-locked interception, injection, and waiting for ready and
    fonts. `renderTicketPng` becomes a thin caller.
  - Move the route logic into `lib/export/handle-export.ts` as
    `handleExport(request, render, { contentType, extension })`. The PNG route
    calls it.
  **Done when:** lint, typecheck, and build pass, and the feature 5 PNG checks
  still hold against a production server:
  - a valid request returns 200 and a 2280 x 900 PNG with transparent corners;
  - the 400, 413, and faked-`Host` cases behave as before.
- [x] 2. **Print layout and cut line.**
  - Add `@page { size: A4 landscape; margin: 0 }` and print-only rules that
    center `[data-render-root]` on the page and remove the `ticket-notches` mask
    in print.
  - Add a print-only (`hidden print:block`) absolutely positioned SVG inside
    `Ticket`, drawing the outline: 760 x 300, 14px corner radius, 14px-radius
    notch arcs centered 209px from the right edge at top and bottom.
  - Stroke it 0.5px in `ticket-muted`, with `fill="none"`.
  **Done when:** lint, typecheck, and build pass; `/` and the PNG look unchanged
  (screenshot and PNG decode); `/render/ticket` is still static.
- [x] 3. **PDF endpoint.** Add `renderTicketPdf` using `page.pdf({ format: "A4",
  landscape: true, printBackground: true, preferCSSPageSize: true })` and
  `app/api/export/pdf/route.ts` through `handleExport`.
  **Done when:** lint, typecheck, and build pass. Against a production server:
  - a valid request returns `200 application/pdf` with filename
    `ticket-<ticketId>.pdf`;
  - the file has exactly one page with an A4 landscape `MediaBox` (about 842 x
    595 pt);
  - it embeds fonts, so text is vector, not a single image;
  - converting page 1 to PNG (`sips` or `qlmanage`) shows the ticket centered,
    the cut line, and the QR;
  - the error cases match the PNG route (`invalid_json`, `invalid_ticket`, 413).
- [x] 4. **Download PDF button.** In `Generator`, add a secondary "Download PDF"
  button left of "Download PNG". Both share one export routine parameterized by
  format. While either export runs, both buttons are disabled and the active
  one shows "Exporting…" with `aria-busy`. Failure shows "Couldn't create the
  PDF. Try again." (or PNG) in the existing `role="status"` element. Every
  attempt clears the previous message.
  **Done when:** lint, typecheck, and build pass. In headless Chrome:
  - an empty-form PDF click shows all errors and sends no request;
  - a valid click downloads `ticket-<ID>.pdf`, starting with `%PDF`;
  - a forced 500 shows the PDF message and both buttons recover;
  - the PNG button still downloads;
  - no console errors.

## Files / areas

- `lib/export/render-ticket.ts` - shared render, `renderTicketPng`, `renderTicketPdf`
- `lib/export/handle-export.ts` - new shared route logic
- `app/api/export/png/route.ts` - use `handleExport`
- `app/api/export/pdf/route.ts` - new
- `app/globals.css` - `@page` and print rules
- `components/ticket/Ticket.tsx` - print-only cut line SVG
- `components/generator/Generator.tsx` - PDF button, shared export routine

## Data / contracts

- Request body for `POST /api/export/pdf`: the same `exportRequestSchema` and
  32 KB limit as PNG.
- Responses: the same error table as PNG. Success is 200 with
  `Content-Type: application/pdf`, `Content-Disposition: attachment;
  filename="ticket-<ticketId>.pdf"`, and `Cache-Control: no-store`.
- Page: A4 landscape (297 x 210 mm), zero printer margins, ticket centered at 96
  CSS px per inch (true size), which leaves about 48 mm left and right and about
  65 mm top and bottom.
- Cut line: print only. It never appears in the preview or PNG. Geometry
  constants live next to the notch mask values and must match them: corner
  radius 14px, notch radius 14px, notch center 209px from the right edge.
- `handleExport` keeps the PNG route's exact responses. Unexpected render errors
  are logged server-side as `"<FORMAT> export failed"` and returned as
  `{ "error": "render_failed" }`.

## Testing

No test command is configured, so there is no unit-test gate. Evidence:
- `npm run lint`, `npx tsc --noEmit`, `npm run build`;
- `curl` against a temporary `next start` on a spare port (stopped afterward)
  for both routes;
- PDF structure checked by reading the file (page count, `MediaBox`, embedded
  font objects) and by rendering page 1 to PNG for a visual check;
- headless Chrome DevTools-protocol checks for the buttons, with download
  capture and request interception.

## Notes for the AI

- Clear `.next` before building if duplicate `" 2"` files from iCloud sync
  appear there again. That is a local environment issue, not a code change.
- Chrome may rasterize masked or filtered content when printing. That is why
  print turns the mask off and draws the cut line as a plain SVG stroke. Do not
  use CSS `filter` or `mask` in print styles.
- Keep `/render/ticket` static and data-injected only. No query params.
- The PNG path must keep `omitBackground` transparency. The print rules apply
  only to `print` media, so they cannot affect the PNG screenshot.
- Never put user text into HTML strings.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7072,"specSha256":"9a62380c8849c8c65365bca4598f65055f3921dd3c22e317ab28d52577521446","branch":"refs/heads/feature/pdf-export","head":"3cd126338e3598d4b5f403ddfc4ff654abd24aac","baseRef":"refs/heads/main","baseCommit":"8def2fceb0a34419a665f72cb1d0531078fb2dd5","sourceTree":"522d381b487e5b0e7796abefc413f0176ff3b826","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 3cd126338e3598d4b5f403ddfc4ff654abd24aac
**Base commit:** 8def2fceb0a34419a665f72cb1d0531078fb2dd5
**Base ref:** refs/heads/main
**Spec hash:** 9a62380c8849c8c65365bca4598f65055f3921dd3c22e317ab28d52577521446
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T18:32:06Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T18:33:45Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `8def2fceb0a34419a665f72cb1d0531078fb2dd5..3cd126338e3598d4b5f403ddfc4ff654abd24aac` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD`, `git merge-base refs/heads/main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (HEAD, merge base, and spec hash match the request; only `blueprint/context/review.md` differs; spec is tracked, no snapshot needed)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass (`/render/ticket` still static; `/api/export/pdf` and `/api/export/png` dynamic)

### Evidence

- Full delta `8def2fc..3cd1263` reviewed: `app/api/export/pdf/route.ts`, `app/api/export/png/route.ts`, `lib/export/handle-export.ts`, `lib/export/render-ticket.ts`, `app/globals.css`, `components/ticket/Ticket.tsx`, `components/generator/Generator.tsx`, plus the spec; callers/dependencies read: `lib/export/export-request.ts`, `components/export/RenderTicket.tsx`, `app/render/ticket/page.tsx`, `app/layout.tsx`.
- Security: both routes go through one `handleExport` with the unchanged 32 KB streaming limit, JSON parse, and `exportRequestSchema`; filename uses the regex-validated `ticketId`; render origin still comes from `RENDER_ORIGIN`/`PORT`, never the request `Host`, and request interception still aborts every non-origin, non-`data:` request for both formats.
- Resource handling: the 20s deadline still races launch + page work + the format callback; the timer is cleared and the browser is closed in `finally` on success, error, and timeout; late rejections are swallowed. Unexpected errors log `"PNG export failed"` / `"PDF export failed"` and return `{ "error": "render_failed" }` 500, matching the spec.
- Print isolation: compiled CSS (`.next/static/chunks/*.css`) shows `@page{size:A4 landscape;margin:0}` and all overrides (color-scheme, fixed centered root, `mask:none`, `.print\:block`) only inside `@media print`; the PNG path uses a screen-media element screenshot with `omitBackground`, so it is unaffected. Unlayered print rules correctly outrank the layered `inline-block` and `ticket-notches` utilities.
- Cut-line geometry verified by hand: notch arcs at x 537-565 (center 551 = 760 - 209, radius 14, sweep 0 bends into the ticket at top and bottom), corner arcs radius 14 matching `--radius-ticket: 14px`, and the mask's 14px transparent radius at `calc(100% - 209px)`; it also aligns with the stub's 2px perforation at x 550-552.
- Generator: one `exportTicket(format)` routine; every attempt clears the message; both buttons disabled while either runs; only the active one shows "Exporting…" and `aria-busy`; error text renders "Couldn't create the PDF/PNG. Try again." in the existing `role="status"`; PDF button is secondary and left of PNG.

### Findings

- None

### Remaining risk

- No unit or browser test runner is configured, so no automated tests cover export handling or the Generator; behavioral evidence relies on the builder's recorded verification (Check was not required and was not run in this review).
- Runtime PDF output (page count, MediaBox, embedded fonts, visual centering) was not re-verified here because servers were not started; review is static plus lint, typecheck, and build.
- `POST /api/export/pdf` is public and launches a fresh Chrome per request with no rate or concurrency limit, same as PNG; deferred by the spec to build-plan items 13 and 14.
- The global `@page` rule and print overrides also apply if a user prints the generator page `/` from the browser (zero margins, cut line visible on the preview ticket); not a spec contract, noted only.
- Dashboard activity (`blueprint/.state/run.json`) was not written by this reviewer because the review was restricted to writing only the findings and review files.
