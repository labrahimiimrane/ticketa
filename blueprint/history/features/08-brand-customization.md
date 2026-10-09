# Feature: Brand customization

**From build-plan:** feature 8
**Build attempt:** 1
**Branch:** feature/brand-customization
**Status:** verified

## Goal

Let the user brand the ticket with an uploaded logo, shown next to the existing
organizer name, and a custom accent color, across all three templates, the live
preview, and both exports. Text on the accent switches between black and white
automatically for contrast, and the paper stays white for printing.

## Design reference

- "Branding" section of the feature 1 prototype
  (`git show af19598:prototypes/generator.html`):
  - a logo row with a 48px white preview box, filename, size, Replace, and
    Remove;
  - an "Accent color" row of round swatches plus a monospace hex input.
- Prototype swatch colors (used as the presets): `#8B5CF6` (default violet),
  `#2563EB`, `#E8590C`, `#0F9D76`, `#111114`.

## In scope

- `lib/branding.ts`: the branding type, defaults, preset accents, logo limits,
  `accentInk()` contrast helper, and `brandingSchema` (Zod).
- All three templates take `branding`. They override `--color-ticket-accent`
  and `--color-ticket-accent-ink` on their root `<article>` and render the logo
  before the organizer name.
- `components/generator/BrandingPanel.tsx`, the "Branding" section after
  Template:
  - logo upload, replace, and remove, with inline errors;
  - accent swatches as a native radio group;
  - a hex input with validation.
- Export requests carry `branding`. The server validates it. The body limit
  rises from 32 KB to 512 KB to fit a base64 logo.

## Out of scope

- A separate organizer website or contact field (declined). Ink or paper color
  changes (declined).
- Remembering branding between visits (9) and history (10).
- Image editing (crop or resize), multiple logos, logo position options.
- Recoloring the template picker thumbnails or the app's own violet UI.
- Responsive layout of the panel (12).

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Branding model.** Add `lib/branding.ts` per Data / contracts.
  **Done when:** typecheck passes, and a one-off scratchpad script (`node
  --experimental-strip-types`) shows:
  - `accentInk` returns white for `#8B5CF6`, `#2563EB`, `#E8590C`, `#0F9D76`,
    and `#111114`, and black for `#FACC15` and `#FFFFFF`, matching the 3:1
    white-first rule;
  - `brandingSchema` accepts the default branding and a small PNG data URL;
  - it rejects a GIF data URL, a non-base64 payload, a decoded size over
    262,144 bytes, `"red"`, and `"#12345"`.
- [x] 2. **Branded templates.** Add a `branding` prop to `Ticket` and all three
  templates.
  - Apply the accent through CSS variables on the root `<article>`.
  - Render the logo with `next/image`, `unoptimized`, in a fixed box that
    keeps its aspect ratio (`object-contain`), left of the organizer name.
    - Classic and Minimal: a 24px-tall box, up to 96px wide.
    - Bold: inside a small white rounded chip on the band, so any logo stays
      visible on any accent.
  - With no logo, the layout is unchanged.
  - Callers pass the default branding for now.
  **Done when:** lint, typecheck, and build pass; `/` and a default PNG export
  are unchanged. Injecting into `/render/ticket` a sample logo plus each preset
  accent, for every template, shows:
  - the accent pixel (Classic band, Bold header, Minimal rule) equals the chosen
    color, and badge or band text uses the contrasting ink;
  - the logo is visible next to the organizer;
  - nothing overflows;
  - the QR still decodes.
- [x] 3. **Branding panel.** Add `BrandingPanel` and wire `branding` state in
  `Generator` to the panel and preview.
  **Done when:** lint, typecheck, and build pass. In headless Chrome, with files
  set through `DOM.setFileInputFiles`:
  - a valid PNG shows its name, size, and a preview, and appears in the ticket;
  - a 300 KB image shows "Choose an image under 256 KB" and leaves the previous
    logo unchanged;
  - a GIF shows "Use a PNG, JPEG, WebP, or SVG image";
  - Remove clears the logo from the panel and ticket;
  - clicking a swatch recolors the preview, and arrow keys move between
    swatches;
  - typing `#0F9D76` in the hex field recolors it, while `#12` shows "Enter a
    hex color like #8B5CF6" and keeps the last valid color;
  - no console errors.
- [x] 4. **Branding in exports.** Add `branding` to `exportRequestSchema`, raise
  the body limit to 512 KB, and send `branding` from `Generator`.
  **Done when:** lint, typecheck, and build pass. Against a production server:
  - a request with a PNG logo and accent `#0F9D76` returns PNGs for all three
    templates, where the accent pixel equals `#0F9D76` and the logo pixels are
    present, and a one-page A4 PDF;
  - an invalid accent, a GIF logo, and an oversized decoded logo each return
    400 `invalid_ticket`;
  - a body over 512 KB returns 413;
  - in headless Chrome, uploading a logo, choosing a swatch, and clicking
    Download PNG yields a PNG with that accent and logo.

## Files / areas

- `lib/branding.ts` - new
- `components/ticket/ticket-parts.tsx` - branding prop type, accent style
  helper, logo element
- `components/ticket/Ticket.tsx`, `ClassicTicket.tsx`, `BoldTicket.tsx`,
  `MinimalTicket.tsx` - branding
- `components/generator/BrandingPanel.tsx` - new
- `components/generator/Generator.tsx` - branding state, preview, export payload
- `components/export/RenderTicket.tsx` - pass `branding`
- `lib/export/export-request.ts` - `branding`
- `lib/export/handle-export.ts` - body limit 512 KB

## Data / contracts

```ts
// lib/branding.ts
export type Branding = {
  logo: string | null;          // data URL: data:image/(png|jpeg|webp|svg+xml);base64,...
  colors: { accent: string };   // "#RRGGBB"
};

export const DEFAULT_ACCENT = "#8B5CF6";
export const DEFAULT_BRANDING: Branding = { logo: null, colors: { accent: DEFAULT_ACCENT } };
export const PRESET_ACCENTS = ["#8B5CF6", "#2563EB", "#E8590C", "#0F9D76", "#111114"] as const;

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const MAX_LOGO_BYTES = 256 * 1024;

/** "#FFFFFF" when its WCAG contrast with `accent` is at least 3:1 (AA large text),
    otherwise "#111114". (User decision during /implement.) */
export function accentInk(accent: string): string;

export const brandingSchema: z.ZodType<Branding>;
```

- `brandingSchema`:
  - `logo` is `null` or a string matching
    `^data:image/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$`, whose
    decoded size (base64 length × 3/4 minus padding) is at most
    `MAX_LOGO_BYTES`;
  - `colors.accent` matches `^#[0-9a-fA-F]{6}$`.
  - The data URL MIME type is trusted only for routing to `<img>`. The image is
    never parsed on the server.
- `exportRequestSchema` gains `branding: brandingSchema` (required). Failures
  return the existing 400 `{ "error": "invalid_ticket" }`. The body limit in
  `handle-export.ts` becomes `512 * 1024`. 256 KB base64-encoded is about
  342 KB, plus JSON.
- Accent application: the template root `<article>` gets
  `style={{ "--color-ticket-accent": accent, "--color-ticket-accent-ink":
  accentInk(accent) }}`. That is the one allowed runtime inline style, since
  the values come from user customization. Every accent use already goes
  through these tokens.
- Logo element: decorative `alt=""`, because the organizer name sits beside it
  as text. It renders only via `next/image` with `unoptimized` and a `data:` src.
  No `dangerouslySetInnerHTML`, and SVG is never inlined, so scripts inside an
  SVG never run.
- Client logo handling (`BrandingPanel`):
  - Check the file type against `LOGO_TYPES` and the size against
    `MAX_LOGO_BYTES` before reading, then `FileReader.readAsDataURL`.
  - Errors show inline under the control, linked by `aria-describedby`:
    - wrong type: "Use a PNG, JPEG, WebP, or SVG image";
    - too big: "Choose an image under 256 KB";
    - read failure: "Couldn't read that file. Try another."
  - A failed pick keeps the previous logo. The file input is reset after each
    pick so the same file can be chosen again.
- Accent controls:
  - presets as a radio group (`role` from native radios) with an accessible
    name per swatch (the hex value);
  - a labeled hex text input ("Accent hex"); invalid text shows the error and
    does not change the applied accent;
  - choosing a swatch updates the hex input.

## Testing

No test command is configured, so there is no unit-test gate. Evidence:
- the step 1 one-off script for `accentInk` and `brandingSchema`;
- `npm run lint`, `npx tsc --noEmit`, `npm run build`;
- headless Chrome DevTools-protocol checks on a temporary `next start` on a
  spare port (stopped afterward), with file inputs set by
  `DOM.setFileInputFiles` and test images generated in the scratchpad;
- `curl` export checks with PNG pixels decoded and the PDF page read.

## Notes for the AI

- Next.js 16 `next/image` with a `data:` src needs `unoptimized`. Check
  `node_modules/next/dist/docs` for the current `Image` props before using
  `fill` or `sizes`.
- Keep templates pure (no hooks). `accentInk` is a pure function, so it runs
  the same in the preview and in Puppeteer.
- The Puppeteer request interception already allows `data:` URLs. Confirm the
  logo loads in exports and that `[data-ready]` waits for images. If not, wait
  for `img.complete` in the render helper before the screenshot or PDF.
- The QR code stays ink-on-paper, never accent-colored.
- If iCloud " 2" copies reappear, stop and tell the user instead of committing
  around them. Moving the project out of `~/Desktop` is the real fix.
- Expect an independent review: this widens the public export request (user
  uploads, a larger body limit).


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9926,"specSha256":"3fc5d6279300ec8112b346f426e1279cfa7420b2ed1aa6b46d5d7270398f809b","branch":"refs/heads/feature/brand-customization","head":"5d640d2f0991df20204ae5b47c8a71a25d9363d9","baseRef":"refs/heads/main","baseCommit":"ce6f0ad6973d50ecf541f2d8e6f4be5667562b33","sourceTree":"8179805004a15e3268f30cb34efc19461cd745f4","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 5d640d2f0991df20204ae5b47c8a71a25d9363d9
**Base commit:** ce6f0ad6973d50ecf541f2d8e6f4be5667562b33
**Base ref:** refs/heads/main
**Spec hash:** 3fc5d6279300ec8112b346f426e1279cfa7420b2ed1aa6b46d5d7270398f809b
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-09T22:36:11Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-09T22:38:11Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `ce6f0ad6973d50ecf541f2d8e6f4be5667562b33..5d640d2f0991df20204ae5b47c8a71a25d9363d9` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git status --porcelain` / `git rev-parse HEAD` / `git merge-base main HEAD` / `shasum -a 256 blueprint/context/current-feature.md`: pass (HEAD, merge base, and spec hash match the request; only review.md differs)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass
- `node --experimental-strip-types <scratchpad script>` exercising `accentInk` and `brandingSchema`: pass

### Evidence

- Full delta reviewed: lib/branding.ts, lib/export/{export-request,handle-export,render-ticket}.ts, components/generator/{BrandingPanel,Generator}.tsx, components/ticket/{ticket-parts,Ticket,Classic,Bold,Minimal}Ticket.tsx, components/export/RenderTicket.tsx, plus app/globals.css tokens and the existing body reader.
- Schema script: accepts null, PNG and SVG base64 logos, and a logo of exactly 262,144 decoded bytes; rejects GIF, non-base64 characters, mid-string padding, a trailing newline, uppercase MIME, a non-base64 (`;utf8`) SVG, 262,145 bytes, `red`, `#12345`, `#123456;background:url(x)`, and `#123456\n`. A 600 KB non-matching payload is rejected in about 1 ms (no regex backtracking).
- `accentInk` returns white for all five presets plus #000000/#777777/#808080, and #111114 for #FACC15/#FFFFFF, matching the 3:1 white-first rule.
- Injection: accent reaches only React `style` custom properties after a strict `^#[0-9a-fA-F]{6}$` check on the server, and the client calls `onAccentChange` only with valid hex. The logo reaches only an `<img src>` through `next/image` (`unoptimized`, no srcset). There is no `dangerouslySetInnerHTML` and no inlined SVG, so SVG scripts and external references cannot run.
- SSRF: request interception is unchanged; only `data:` URLs and the fixed render origin continue, and everything else is aborted.
- Resource bounds: the streaming body reader enforces 512 KB on declared and actual bytes. A maximum logo serializes to about 349.6 KB of JSON. The new `waitForFunction` image wait uses the 20 s page default timeout inside the existing `Promise.race` deadline, and broken images report `complete`, so it cannot hang past the deadline.
- Theme: `--color-ticket-accent` and `--color-ticket-accent-ink` are declared in a non-inline `@theme`, so per-article overrides apply, including the `/60` opacity variant.
- Accessibility: the file input has an accessible name and focus-visible styling on its label, errors are linked by `aria-describedby`/`aria-invalid`, swatches are native radios with hex names inside a fieldset with a legend, and the hex input has a label.

### Findings

- None

### Remaining risk

- No unit test runner is configured (project opt-in), so the `lib/branding.ts` validator and contrast logic have no automated regression tests. Only a one-off script verified them.
- Check was not required and not run. No server or headless browser was started, so live preview, export pixels, and the 400/413 responses were not re-observed by this reviewer; those rely on the builder's recorded verification.
- The regex does not require the base64 length to be a multiple of 4 (this matches the spec contract), so a malformed payload produces a broken image rather than a 400. It is harmless because the image is never parsed on the server.
- If a user picks two files in quick succession, an earlier, slower FileReader could finish last and win (not observed; practically unreachable for files under 256 KB).
- Logo and hex errors are not in a live region, so screen-reader announcement on appearance was not verified (the spec requires only `aria-describedby`).
