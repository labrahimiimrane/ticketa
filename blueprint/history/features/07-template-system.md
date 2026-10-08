# Feature: Template system

**From build-plan:** feature 7
**Build attempt:** 1
**Branch:** feature/template-system
**Status:** verified

## Goal

Offer three ticket designs (Classic stub, Bold header, and Minimal) built from
the same data, the same `ticket-*` theme tokens, and the same 760 x 300 size,
with a template picker in the generator. The selected template drives the live
preview and both exports, so what you see is still what you download.

## Design reference

- Picker and thumbnails: the "Template" section of the feature 1 prototype
  (`git show af19598:prototypes/generator.html`). It is a 3-column grid of small
  bordered tiles, each with a mini sketch and a name below. The selected tile
  has a violet border and focus ring.
- Classic stub: the current `Ticket`, unchanged.
- Bold header (new): a full-width `ticket-accent` header band about 112px tall,
  holding the organizer (small, uppercase-tracked) and the event title (large,
  bold) in `ticket-accent-ink`. Below it, on paper:
  - Date, Time, and Venue in the existing label and value style, left;
  - the attendee label and name, left, under the meta row;
  - the QR (96px) with the ticket ID beneath it, right;
  - no notches and no perforation.
- Minimal (new): paper only, no band or stub.
  - The organizer is small and muted, top left; the event title is large; a 2px
    `ticket-accent` rule (48px wide) sits under the title.
  - A single meta line shows Date · Time · Venue.
  - The attendee name is at bottom left; the QR (80px) and ticket ID are at
    bottom right.

## In scope

- `lib/ticket-templates.ts`: the template registry (stable IDs, display names)
  and the shared size constants.
- Split `Ticket` into a dispatcher plus `ClassicTicket`, `BoldTicket`, and
  `MinimalTicket`, sharing placeholder, label, QR, and cut-line helpers.
- A `TemplatePicker` in the form panel, a "Template" section after Attendee,
  using native radio inputs.
- `Generator` holds `templateId` (default `classic`) and passes it to the
  preview and exports.
- Export requests carry `templateId`. The server validates it against the
  registry, and the render page renders that template. PDF cut lines follow each
  template's outline.

## Out of scope

- Logo, custom colors, and organizer branding (8). Templates use only the
  existing `ticket-*` tokens so feature 8 can recolor all three.
- Remembering the selected template (9) and history (10).
- Per-template sizes (declined), notches on Bold or Minimal (declined), and
  responsive picker layout (12).

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Registry and Classic extraction.**
  - Add `lib/ticket-templates.ts`.
  - Move the current markup into `components/ticket/ClassicTicket.tsx`, and
    shared helpers (placeholder, meta label and value classes, QR slot, ID
    text, cut line) into `components/ticket/ticket-parts.tsx`.
  - `Ticket` takes `templateId` and dispatches.
  - The callers pass `"classic"` for now.
  **Done when:** lint, typecheck, and build pass; a screenshot of `/` and a PNG
  export are unchanged from feature 6 (same layout; PNG 2280 x 900 with
  transparent corners and notches).
- [x] 2. **Bold header and Minimal templates.** Add `BoldTicket.tsx` and
  `MinimalTicket.tsx` per the design reference. They must follow the same
  placeholder, overflow, and QR and ID rules as Classic, and each has a
  print-only cut line for its plain rounded rectangle.
  **Done when:** lint, typecheck, and build pass. In headless Chrome, injecting
  filled and empty data into `/render/ticket` for each template shows correct
  layouts:
  - text truncates rather than overflowing;
  - placeholders show when fields are empty;
  - the QR decodes to the ID (`BarcodeDetector`).
  Screenshots are kept for review.
- [x] 3. **Template picker.** Add `components/generator/TemplatePicker.tsx` and
  wire `templateId` state in `Generator` to the picker and the preview.
  **Done when:** lint, typecheck, and build pass. In headless Chrome:
  - three labeled tiles render, with Classic selected first;
  - clicking a tile switches the preview immediately;
  - arrow keys move the selection (native radio behavior);
  - the selected tile shows the accent border and focus ring;
  - form values and the ticket ID are unchanged by switching;
  - no console errors.
- [x] 4. **Templates in exports.** Add `templateId` to `exportRequestSchema`.
  `RenderTicket` renders the requested template, and `Generator` sends the
  selection.
  **Done when:** lint, typecheck, and build pass. Against a production server:
  - for each template, PNG returns 200 at 2280 x 900 with transparent corners,
    and notch pixels are transparent only for Classic;
  - for each template, PDF returns one A4 landscape page;
  - a request with an unknown or missing `templateId` returns 400
    `invalid_ticket`;
  - in headless Chrome, downloading with Bold selected yields a PNG whose header
    band color matches `ticket-accent`.

- [x] 5. **Repair review findings F-01 and F-02.**
  - F-01: remove `overflow-hidden` from `BoldTicket`'s root `<article>` so the
    print cut line's full 0.5px stroke is visible. Round the header band itself
    with `rounded-t-ticket`, so the band still follows the ticket corners.
  - F-02: update the `globals.css` comment so it points the notch cut-line
    geometry at `NOTCHED_CUT_LINE` in `components/ticket/ticket-parts.tsx`.
  **Done when:** lint, typecheck, and build pass. The Bold PNG is unchanged:
  2280 x 900, transparent corners, and the band pixel equals `ticket-accent`.
  The Bold PDF page shows the cut line at the same weight as Minimal's (both
  page-1 images compared side by side). Mark F-01 and F-02 `fixed` in
  `blueprint/context/findings.md` after this passes. A new review checkpoint
  and a fresh independent review close them.

- [x] 6. **Repair review finding F-03.** Make `TICKET_WIDTH` and
  `TICKET_HEIGHT` the single source for the cut-line geometry, rather than
  deleting them, so the spec's data contract stays intact.
  - Build the `CutLine` `viewBox` and both cut-line paths
    (`NOTCHED_CUT_LINE`, `ROUNDED_CUT_LINE`) in `ticket-parts.tsx` from the
    constants, with the corner and notch radius (14) and the notch offset from
    the right edge (209) as named constants next to them.
  - `ticketArticle` keeps literal `h-[300px] w-[760px]`, because Tailwind only
    sees static class names. A short comment ties those literals to the
    constants.
  **Done when:**
  - lint, typecheck, and build pass;
  - the generated path strings are byte-identical to the current literals
    (checked with a one-off script);
  - a Classic PNG export still decodes to 2280 x 900 with transparent notches;
  - F-03 is marked `fixed` in `blueprint/context/findings.md`. A new review
    checkpoint and a fresh independent review close it.

## Files / areas

- `lib/ticket-templates.ts` - new
- `components/ticket/Ticket.tsx` - dispatcher
- `components/ticket/ticket-parts.tsx`, `ClassicTicket.tsx`, `BoldTicket.tsx`,
  `MinimalTicket.tsx` - new
- `components/generator/TemplatePicker.tsx` - new
- `components/generator/Generator.tsx` - template state, preview, export payload
- `components/export/RenderTicket.tsx` - pass `templateId`
- `lib/export/export-request.ts` - `templateId`
- `app/globals.css` - only if a shared print or mask rule needs adjusting

## Data / contracts

```ts
// lib/ticket-templates.ts
export const TICKET_WIDTH = 760;
export const TICKET_HEIGHT = 300;

export const TICKET_TEMPLATES = [
  { id: "classic", name: "Classic stub" },
  { id: "bold", name: "Bold header" },
  { id: "minimal", name: "Minimal" },
] as const;

export type TemplateId = (typeof TICKET_TEMPLATES)[number]["id"];
export const DEFAULT_TEMPLATE_ID: TemplateId = "classic";
export const TEMPLATE_IDS = TICKET_TEMPLATES.map((t) => t.id) as [TemplateId, ...TemplateId[]];
```

- Template IDs are stable keys. Features 9 and 10 will store them, so never
  rename them.
- `exportRequestSchema` gains `templateId: z.enum(TEMPLATE_IDS)`. It is required,
  with no default, so the server never guesses. A bad or missing ID returns 400
  `{ "error": "invalid_ticket" }` through the existing path.
- `Ticket` props: `{ templateId: TemplateId; event; attendee; ticketId: string
  | null }`. Every template renders a root `<article>` of exactly 760 x 300 with
  `rounded-ticket`, so the PNG selector `[data-render-root] article` and the PDF
  centering keep working.
- Only `ClassicTicket` uses the `ticket-notches` utility and the notched cut
  line. Bold and Minimal use the plain rounded-rectangle cut line: 14px
  radius, 0.5px stroke in `ticket-muted`, print only.
- Picker markup:
  - a `<fieldset>` with a "Template" `<legend>` styled as the section title;
  - each tile is a `<label>` wrapping a visually hidden
    `<input type="radio" name="template" value={id}>`, the sketch, and the name;
  - selection uses `:has(:checked)` or a checked prop for the accent border;
  - focus is shown with `:has(:focus-visible)`.

## Testing

No test command is configured, so there is no unit-test gate. Evidence:
- `npm run lint`, `npx tsc --noEmit`, `npm run build`;
- headless Chrome DevTools-protocol checks on a temporary `next start` on a
  spare port (stopped afterward), including render-page injection per template,
  QR decode, and picker keyboard checks;
- `curl` export checks per template, with PNG pixels decoded and PDF page and
  `MediaBox` read from the file;
- screenshots of all three templates in the preview and in the exports.

## Notes for the AI

- Templates use only `ticket-*` tokens and the existing font utilities. No new
  hard-coded colors. Feature 8 recolors through those tokens.
- Keep every template a pure component (no client hooks) so the export path
  renders the same markup.
- User text renders only as React text. Apply the same truncation and two-line
  title clamp in every template.
- The QR must sit on paper (white) in every template, never on the accent band,
  so scanners keep high contrast.
- If iCloud " 2" duplicates reappear in `.next` and break typecheck, clear `.next`
  and rebuild. It is an environment issue.
- Expect an independent review: this changes the public export request
  contract.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10440,"specSha256":"89eb03c3d05f1bc937ab7cce694f132d316fbf3ad1029a8550990d96201d4408","branch":"refs/heads/feature/template-system","head":"a31c32a8f2b4cd9f05525c8dd712cca11c79568e","baseRef":"refs/heads/main","baseCommit":"263a74b96f1e4b3aad0c17887780684b518062bd","sourceTree":"b105c5261e25a10b69bf6ad845fb5f155917dfe5","landing":"local-merge","absentOptional":[]} -->

## Findings

### 7/F-01 [P3] closed - Bold template clips the outer half of its print cut line

**File:** components/ticket/BoldTicket.tsx:18
**Found:** 2026-10-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** The Bold root `article` uses `overflow-hidden` (to round the accent header's top corners) and is the containing block for the absolutely positioned `CutLine` SVG. The rounded-rectangle path runs exactly along the article's edge, so the 0.5px stroke is centered on the clip boundary and only its inner 0.25px survives in the PDF. Classic (mask dropped in print) and Minimal (no overflow clip) print the full 0.5px stroke the spec requires, so Bold's trim line is fainter and inconsistent with the "0.5px stroke in `ticket-muted`, print only" contract.
**Suggested fix:** Remove `overflow-hidden` from the Bold `article` and round the header directly (for example `rounded-t-ticket` on the `<header>`), keeping the two-line title clamp and truncation inside the header. No current requirement is lost.
**Resolution:** Fixed in step 5 of the feature 7 spec: removed `overflow-hidden` from `BoldTicket` and rounded the header band with `rounded-t-ticket`. In print-media emulation at 8x, the Bold and Minimal left-edge cut-line profiles are identical (4 ink pixels, darkest 107, ink sum 592); Bold PNG unchanged (2280x900, transparent corners, band (139,92,246)). Closed 2026-10-08 by /audit independent (fresh subagent, target 677d75f): `components/ticket/BoldTicket.tsx` root `article` no longer has `overflow-hidden`, so the absolutely positioned `CutLine` stroke is not clipped. The header band uses `rounded-t-ticket` (`--radius-ticket: 14px`), the same token as the article's `rounded-ticket`, and spans the full article width (flex-col, no article padding), so the band's top corners follow the card outline. Remaining content stays inside the 300px card: header 128px with truncated organizer and `line-clamp-2` title (~78px of 88px inner height); body 172px with 132px inner height holding the meta grid plus attendee (~80px) and the QR column (96 + 8 + ~16 = ~120px); every text node truncates horizontally. No new defect from the repair.

### 7/F-02 [P3] closed - globals.css still points the cut-line geometry at Ticket.tsx

**File:** app/globals.css:99
**Found:** 2026-10-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** The `ticket-notches` comment says "The print cut line in Ticket.tsx uses the same geometry", but this feature moved the notched path to `NOTCHED_CUT_LINE` in `components/ticket/ticket-parts.tsx` and it now applies only to Classic. A maintainer adjusting the notch mask would look in the wrong file and could let the mask and the Classic cut line drift apart.
**Suggested fix:** Update the comment to reference `NOTCHED_CUT_LINE` in `components/ticket/ticket-parts.tsx` (Classic only). No current requirement is lost.
**Resolution:** Fixed in step 5 of the feature 7 spec: the `globals.css` comment now points at `NOTCHED_CUT_LINE` in `components/ticket/ticket-parts.tsx`. Closed 2026-10-08 by /audit independent (fresh subagent, target 677d75f): `app/globals.css:99-100` now names `NOTCHED_CUT_LINE` in `components/ticket/ticket-parts.tsx`, which is where the notched path lives (`ticket-parts.tsx:29-31`) and is used only by `ClassicTicket`. No new defect.

### 7/F-03 [P3] closed - TICKET_WIDTH and TICKET_HEIGHT are exported but never used

**File:** lib/ticket-templates.ts:1
**Found:** 2026-10-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec describes these as the shared size constants, but nothing imports them. The ticket size is still hard-coded in `ticketArticle` (`h-[300px] w-[760px]`), the `CutLine` `viewBox="0 0 760 300"`, and both cut-line paths in `components/ticket/ticket-parts.tsx`. The constants are dead code that suggests a single source of truth that does not exist, so a later size change could update them and miss the real values.
**Suggested fix:** Either use them where it is cheap (for example, build the `CutLine` `viewBox` from `TICKET_WIDTH` and `TICKET_HEIGHT`) or delete them and drop them from the spec's data contract. Deleting loses no current runtime requirement; it only changes the spec's documented contract, so it needs the user's decision.
**Resolution:** Fixed in step 6 of the feature 7 spec: `CutLine` viewBox and both cut-line paths in `components/ticket/ticket-parts.tsx` are now built from `TICKET_WIDTH`/`TICKET_HEIGHT` plus named radius and notch-offset constants; `ticketArticle` keeps literal Tailwind sizes with a comment tying them to the constants. Rendered `d` attributes for classic, bold, and minimal are byte-identical to the previous literals (viewBox `0 0 760 300`); Classic PNG still 2280x900 with transparent corners and notches. Closed 2026-10-08 by /audit independent (fresh subagent, target a31c32a): `components/ticket/ticket-parts.tsx:2` imports `TICKET_WIDTH`/`TICKET_HEIGHT`; `CutLine` builds its viewBox from them (`ticket-parts.tsx:56`), and `NOTCHED_CUT_LINE`/`ROUNDED_CUT_LINE` (`ticket-parts.tsx:44-50`) derive from them plus `CORNER_RADIUS`, `NOTCH_RADIUS` (14) and `NOTCH_OFFSET_FROM_RIGHT` (209). A Node recomputation of the exact template expressions yields `M14 0H537A14 14 0 0 0 565 0H746A14 14 0 0 1 760 14V286A14 14 0 0 1 746 300H565A14 14 0 0 0 537 300H14A14 14 0 0 1 0 286V14A14 14 0 0 1 14 0Z` (equal to the base `CUT_LINE` literal at 263a74b), the expected rounded path, and viewBox `0 0 760 300`. The constants are no longer dead; the remaining literal `h-[300px] w-[760px]` in `ticketArticle` is a Tailwind static-class necessity and is documented beside it. The repair introduced no new defect; tsc, lint, and build pass.

## Independent review

**Status:** passed
**Target commit:** a31c32a8f2b4cd9f05525c8dd712cca11c79568e
**Base commit:** 263a74b96f1e4b3aad0c17887780684b518062bd
**Base ref:** refs/heads/main
**Spec hash:** 89eb03c3d05f1bc937ab7cce694f132d316fbf3ad1029a8550990d96201d4408
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T18:59:16Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T19:00:24Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `263a74b96f1e4b3aad0c17887780684b518062bd..a31c32a8f2b4cd9f05525c8dd712cca11c79568e` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD`, `git merge-base refs/heads/main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (target, merge base, and spec hash match the request; only review.md and findings.md differ)
- `node -e <recompute cut-line paths>`: pass (notched and rounded paths and viewBox equal the expected strings and the base `CUT_LINE` literal)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass

### Evidence

- Reviewed the full code delta 263a74b..a31c32a: `lib/ticket-templates.ts`, `lib/export/export-request.ts`, `components/ticket/{Ticket,ticket-parts,ClassicTicket,BoldTicket,MinimalTicket}.tsx`, `components/generator/{Generator,TemplatePicker}.tsx`, `components/export/RenderTicket.tsx`, `app/globals.css`, plus unchanged callers `lib/export/handle-export.ts`, `lib/export/render-ticket.ts`, `app/api/export/png/route.ts`, and the active spec.
- Security: `templateId` is `z.enum(TEMPLATE_IDS)`, required with no default; `handleExport` returns 400 `invalid_ticket` on any parse failure and passes only Zod-parsed data (unknown keys stripped) to Puppeteer, so `TEMPLATES[templateId]` in `Ticket.tsx` only receives a registry key. Body limit, fixed render origin, and request interception are unchanged. User text still renders only as React text.
- Quality: templates share `ticketArticle`, placeholder, QR, ID, and cut-line helpers; every root is a 760x300 `rounded-ticket` `article` (PNG selector intact); only Classic uses `ticket-notches` and the notched cut line; the QR sits on paper in all three templates; picker uses native radios in a fieldset/legend with `has-checked`/`has-focus-visible` styling.
- Performance: no new network, render, or unbounded work; cut-line strings and `TEMPLATE_IDS` are computed once at module load; one Puppeteer render per export as before.
- Tests: no test runner is configured (test gate off per coding standards); no skipped, focused, or placeholder tests exist in the delta.

### Findings

- F-03 [P3] closed (repair verified: constants now drive the CutLine viewBox and both paths, byte-identical output)
- F-01 [P3] and F-02 [P3] remain closed from the previous pass
- No new findings

### Remaining risk

- No unit test command is configured, so `exportRequestSchema` template validation has no automated test; evidence is code reading plus the builder's recorded curl checks.
- No browser or runtime check was run in this review (Check not required; no servers started), so PNG/PDF pixel output and picker interaction were not re-observed by the reviewer.
- The notch geometry (14px radius, 209px offset) is duplicated between `app/globals.css` and `ticket-parts.tsx`, linked only by comments.
