# Feature: PNG export

**From build-plan:** feature 5
**Build attempt:** 1
**Branch:** feature/png-export
**Status:** verified

## Goal

Let the user download the current ticket as a high-resolution PNG, rendered on
the server by Puppeteer from the same `Ticket` component and CSS as the preview,
so the download matches what they see. Export is offered only for a valid ticket
with an ID, and the button reports progress and failure clearly.

## In scope

- Add the `puppeteer` dependency. It downloads its own Chrome on install. Next 16
  already lists `puppeteer` in its default `serverExternalPackages`.
- Ticket notches become true cut-outs (a CSS mask) instead of painted
  canvas-colored circles, so the PNG has transparent notches and corners, and
  the preview looks the same.
- An export-only render page at `/render/ticket` that receives ticket data from
  Puppeteer and renders `Ticket` alone on a transparent page.
- A Route Handler `POST /api/export/png` that validates input, renders with
  Puppeteer, and returns the PNG.
- A "Download PNG" button in the generator top bar, with validation gating and
  loading, error, and success behavior.

## Out of scope

- PDF export (6), templates (7), logo and colors (8), persistence and history
  (9, 10).
- Reusing one browser across requests, concurrency limits, memory tuning, and
  production Chrome setup on Render (13, 14). This feature launches one browser
  per request and always closes it.
- Rate limiting. Not in the plans; noted for feature 14.
- Responsive or mobile placement of the button (12).

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Install Puppeteer.** `npm install puppeteer`.
  **Done when:** the install completes, and a one-off scratchpad script launches
  headless Chrome through `puppeteer`, prints the browser version, and closes it.
  `npm run build` still passes.
- [x] 2. **Notch cut-outs.** In `Ticket`, remove the two `bg-canvas` notch spans.
  Cut the notches out of the `<article>` with a CSS `mask` of two transparent
  radial gradients: 14px radius, centered on the perforation line at the top
  and bottom edges. Remove `shadow-ticket` from the article. The preview keeps
  its shadow through a wrapper in `Generator` using `drop-shadow`, which
  follows the mask.
  **Done when:** lint, typecheck, and build pass, and a screenshot of `/` shows
  notches revealing the dotted canvas, with the ticket otherwise unchanged.
- [x] 3. **Render page.** Add `app/render/ticket/page.tsx` and a client
  `components/export/RenderTicket.tsx`:
  - the page body is transparent;
  - it exposes `window.__renderTicket(data)`, which renders `<Ticket>` with no
    wrapper shadow and sets `data-ready="true"` on the ticket's container after
    the next paint;
  - with no data it renders nothing;
  - the page stays static (`○`).
  **Done when:** lint, typecheck, and build pass, and `/render/ticket` is listed
  as `○`.
- [x] 4. **Export endpoint.** Add `app/api/export/png/route.ts` and
  `lib/export/render-ticket.ts` per Data / contracts.
  **Done when:** lint, typecheck, and build pass. Against a running production
  server:
  - a valid request returns `200 image/png` that decodes to 2280 x 900 pixels
    with transparent corners;
  - invalid JSON, an invalid ticket, a bad ticket ID, and an oversized body
    return 400, 400, 400, and 413 with the documented JSON;
  - a request whose `Host` header is set to another domain still renders from
    the local origin.
  Checked with `curl` and the PNG header and size read from the file.
- [x] 5. **Download button.** In `Generator`, add "Download PNG" to the top bar
  per Data / contracts. Extend `TicketForm` with a `showAllErrors` prop.
  **Done when:** lint, typecheck, and build pass. On the running app, checked
  with headless Chrome:
  - clicking with an empty form shows all required-field errors and sends no
    request;
  - with a valid form, the button shows "Exporting…" while busy, then a file
    named `ticket-<ID>.png` downloads (captured with `Browser.setDownloadBehavior`)
    and matches the endpoint output size;
  - when the endpoint fails (forced by request interception), the inline error
    appears and the button recovers;
  - no console errors.

- [x] 6. **Repair review findings F-01 and F-02.**
  - F-01: make the 20-second overall timeout cover the whole render, including
    `puppeteer.launch()`. Start the deadline before launching, race launch plus
    screenshot against it, and still close any launched browser in `finally`
    (closing must not hold the response past the deadline).
  - F-02: reset `exportState` to `"idle"` at the start of every Download PNG
    attempt, so a validation-blocked click also clears a previous failure
    message.
  **Done when:** lint, typecheck, and build pass. A one-off check shows a render
  forced to hang (for example `RENDER_ORIGIN` pointing at a port that accepts
  connections but never answers) returns `500 render_failed` within about 20
  seconds of the request. In headless Chrome, a forced failure followed by a
  click with an invalid form shows the field errors and no "Couldn't create the
  PNG" message. Mark F-01 and F-02 `fixed` in `blueprint/context/findings.md`
  after this passes. A new review checkpoint and a fresh independent review
  close them.

## Files / areas

- `package.json`, `package-lock.json` - `puppeteer`
- `components/ticket/Ticket.tsx` - mask notches, no shadow
- `components/generator/Generator.tsx` - shadow wrapper, top-bar button, export state
- `components/generator/TicketForm.tsx` - `showAllErrors` prop
- `app/render/ticket/page.tsx`, `components/export/RenderTicket.tsx` - new
- `app/api/export/png/route.ts` - new
- `lib/export/render-ticket.ts` - new (Puppeteer render helper, reused by PDF in 6)
- `lib/export/export-request.ts` - new (shared request schema)

## Data / contracts

**Request:** `POST /api/export/png`, `Content-Type: application/json`.

```ts
// lib/export/export-request.ts
export const exportRequestSchema = z.object({
  event: eventInfoSchema,
  attendee: attendeeInfoSchema,
  ticketId: z.string().regex(/^TKT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/),
});
export type ExportRequest = z.infer<typeof exportRequestSchema>;
```

- Body limit is 32 KB, read as text before parsing. Today's payload is under
  1 KB; feature 8 (logos) will revisit this.
- The server validates every request with the same schemas the form uses.
  Unknown keys are stripped (Zod default).

**Responses:**

| Case | Status | Body |
|---|---|---|
| Success | 200 | PNG bytes, `Content-Type: image/png`, `Content-Disposition: attachment; filename="ticket-<ticketId>.png"`, `Cache-Control: no-store` |
| Body over 32 KB | 413 | `{ "error": "too_large" }` |
| Not JSON | 400 | `{ "error": "invalid_json" }` |
| Schema failure | 400 | `{ "error": "invalid_ticket" }` |
| Render failure or 20s timeout | 500 | `{ "error": "render_failed" }` (details logged on the server only) |

**Render helper** (`renderTicketPng(data: ExportRequest): Promise<Uint8Array>`):

- Launch headless Chrome per call and close it in `finally`.
- Navigate to `${RENDER_ORIGIN}/render/ticket`. `RENDER_ORIGIN` defaults to
  `http://127.0.0.1:${process.env.PORT ?? 3000}`, overridable with the env var
  `RENDER_ORIGIN`. Never derive it from the request `Host` header; that would
  let a caller point the server's browser at any site.
- Enable request interception: abort any request whose origin is not
  `RENDER_ORIGIN`.
- Viewport 1000 x 600, `deviceScaleFactor: 3`.
- Call `window.__renderTicket(data)` and wait for `[data-ready="true"]` and
  `document.fonts.ready`.
- Screenshot the `<article>` element with `omitBackground: true`. The result is
  760 x 300 CSS px times 3, so 2280 x 900 px.
- Apply an overall timeout of 20 seconds.

**Client button** (top bar, right side, primary violet, native `<button>`):

- If the form is invalid (either schema) or there is no ticket ID: set
  `showAllErrors`, which shows every field's error as if touched, and send
  nothing.
- Otherwise send the POST. Show "Exporting…" with `aria-busy`, and disable the
  button so it cannot be double-submitted.
- On success, download the blob as `ticket-<ticketId>.png` through a temporary
  object URL, then revoke it.
- On failure (non-200 or network error): show "Couldn't create the PNG. Try
  again." next to the button in a `role="status"` element. It clears on the
  next attempt.

## Testing

No test command is configured, so there is no unit-test gate. Evidence:
- `npm run lint`, `npx tsc --noEmit`, `npm run build`;
- step 4 `curl` checks against a production server (user's or a temporary
  `next start` on a spare port, stopped afterward; set `RENDER_ORIGIN` to match
  that port);
- step 5 headless Chrome DevTools-protocol checks with download capture and
  request interception;
- screenshots of the preview and the exported PNG.

## Notes for the AI

- Server-only code (`lib/export/render-ticket.ts`) must start with
  `import "server-only"` if the package is available. Otherwise keep it imported
  only from the route handler. Never import Puppeteer from client code.
- The route handler is dynamic by nature (POST). Do not add `use cache`. Read
  the Route Handler docs in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  first.
- `/render/ticket` must not read search params or cookies. It stays static, and
  data arrives only through `window.__renderTicket`.
- The mask must not hide the ticket's rounded corners. Combine it with the
  existing `rounded-ticket` and check both preview and PNG screenshots.
- Never put user text into HTML strings. The render page renders through React
  only.
- Do not touch the untracked empty `components/ticket 2/` directory.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9966,"specSha256":"162863ba98f4984cd00fa16e84403906035968327596470c950e844b19e7142c","branch":"refs/heads/feature/png-export","head":"faa95ad03b31b56788610bfc46b624b7c9e6563d","baseRef":"refs/heads/main","baseCommit":"37aa2f2665b964768a803db80e648c1dd80416a3","sourceTree":"263ee469d291d37c163bcfa497f27dad29286d6a","landing":"local-merge","absentOptional":[]} -->

## Findings

### 5/F-01 [P3] closed - 20s overall render timeout does not cover browser launch or close

**File:** lib/export/render-ticket.ts:17
**Found:** 2026-10-08 by /audit independent (scope: current; lens: performance)
**Why it matters:** The spec's render helper contract says "Apply an overall timeout of 20 seconds" and the response table maps a 20s timeout to `500 render_failed`. `puppeteer.launch()` runs before the `Promise.race`, so a slow or stuck Chrome start uses Puppeteer's own 30s launch default, and `browser.close()` in `finally` is unbounded. A request can therefore hold the handler well past 20s before answering.
**Suggested fix:** Start the timer before launching and race the launch plus screenshot together (for example pass `timeout` to `puppeteer.launch` from the remaining budget, or move the launch inside the raced function while still closing any launched browser in `finally`). No current requirement is lost.
**Resolution:** Fixed in step 6 of the feature 5 spec: the deadline now starts before `puppeteer.launch()` (also given `timeout`), launch plus screenshot race it, and the browser closes in the background. A render against a non-answering origin returned `500 render_failed` in 20.08s; normal render 200 in 0.54s; no Chrome processes left. Awaiting independent re-review. Closed 2026-10-08 by /audit independent re-review (scope: current; target faa95ad): in lib/export/render-ticket.ts:17-37 the deadline timer is created before `puppeteer.launch` (which also gets `timeout: 20_000`), `Promise.race([rendering, deadline])` covers launch plus screenshot, `finally` clears the timer, attaches a no-op catch to `rendering`, and closes any launched browser in the background with both outcomes of `launching` handled, so close never delays the response and no unhandled rejection is left. A late launch after the deadline still closes its browser. No new defect introduced.

### 5/F-02 [P3] closed - Export error message persists after a validation-blocked retry

**File:** components/generator/Generator.tsx:26
**Found:** 2026-10-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** The client contract says the "Couldn't create the PNG. Try again." status "clears on the next attempt". When a failed export is followed by a click while the form is invalid (or no ticket ID), `downloadPng` returns after `setShowAllErrors(true)` without resetting `exportState`, so the stale render-failure message stays next to the button alongside the field errors, misattributing the problem.
**Suggested fix:** Reset `exportState` to `"idle"` at the start of `downloadPng` (or in the validation-blocked branch) so every attempt clears the previous failure message. No current requirement is lost.
**Resolution:** Fixed in step 6 of the feature 5 spec: `downloadPng` resets `exportState` to idle at the start of every attempt. Headless Chrome: forced failure showed the message, then a validation-blocked click cleared it and showed only the field error. Awaiting independent re-review. Closed 2026-10-08 by /audit independent re-review (scope: current; target faa95ad): components/generator/Generator.tsx:21 calls `setExportState("idle")` as the first statement of `downloadPng`, before the validation early return, so every attempt clears the `role="status"` failure text; the exporting and error transitions are unchanged. No new defect introduced.

## Independent review

**Status:** passed
**Target commit:** faa95ad03b31b56788610bfc46b624b7c9e6563d
**Base commit:** 37aa2f2665b964768a803db80e648c1dd80416a3
**Base ref:** refs/heads/main
**Spec hash:** 162863ba98f4984cd00fa16e84403906035968327596470c950e844b19e7142c
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T18:06:46Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T18:08:36Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `37aa2f2665b964768a803db80e648c1dd80416a3..faa95ad03b31b56788610bfc46b624b7c9e6563d` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD`, `git merge-base refs/heads/main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (HEAD, merge base, and spec hash match the request; only findings.md and review.md differ)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass (`/api/export/png` dynamic, `/render/ticket` and `/` static)

### Evidence

- Reviewed the full `37aa2f2..faa95ad` delta: app/api/export/png/route.ts, lib/export/render-ticket.ts, lib/export/export-request.ts, app/render/ticket/page.tsx, components/export/RenderTicket.tsx, components/generator/Generator.tsx, components/generator/TicketForm.tsx, components/ticket/Ticket.tsx, app/globals.css, package.json (package-lock.json limited to the puppeteer addition), plus callers and dependencies TicketQr.tsx, lib/ticket-schema.ts, app/layout.tsx.
- Security: route validates with `exportRequestSchema` (same form schemas plus the ticket ID regex) after a 32 KB limit enforced on both `Content-Length` and streamed bytes; the render origin comes only from `RENDER_ORIGIN` or `127.0.0.1:${PORT}`, never the request; interception aborts every non-origin, non-`data:` request; user data reaches the page only as a serialized `page.evaluate` argument and renders through React text; `Content-Disposition` uses the regex-validated ticket ID; render errors are logged server-side and answered with a generic `render_failed`.
- Resource cleanup: `renderTicketPng` starts the 20s deadline before launch, races launch plus screenshot, clears the timer, swallows only post-race rejections of `rendering`, and closes any launched browser in the background, including a browser whose launch resolves after the deadline. No unhandled rejection path found.
- Spec contracts matched: response table statuses and bodies, 1000x600 viewport at scale 3, `[data-ready="true"]` plus `document.fonts.ready` wait, `omitBackground` element screenshot, mask notches at the perforation (760 - 209 px) with no `bg-canvas` spans, drop-shadow wrapper only in the preview, client gating with `showAllErrors`, `aria-busy` and disabled button, `role="status"` failure text, object URL download named `ticket-<ID>.png`. Puppeteer is imported only from the route handler (`server-only` package not installed, so the spec's fallback applies).
- TicketQr builds its SVG synchronously, so the ready signal cannot fire before the QR code exists.
- F-01 and F-02 re-examined against the repaired code and closed in the findings ledger.

### Findings

- F-01 [P3] closed - 20s timeout now covers launch and close does not delay the response
- F-02 [P3] closed - every export attempt resets the failure status
- No new findings

### Remaining risk

- No test runner or `Verify` command is declared, so no automated tests cover the body limit, schema, or timeout logic; evidence is typecheck, lint, build, and the builder's recorded manual checks.
- Check was not required and this reviewer started no server, so runtime behavior (PNG dimensions, transparency, 413/400/500 responses, download capture) was not re-run here.
- The public endpoint launches one Chrome per request with no concurrency or rate limit, so parallel requests can exhaust memory. The spec explicitly defers this to features 13 and 14.
- `saveBlob` revokes the object URL right after `link.click()`. Verified in headless Chrome only; Firefox and Safari download behavior was not checked.
- No dependency vulnerability scan was run (network-backed tools not approved); package.json inspection is not a vulnerability scan.
