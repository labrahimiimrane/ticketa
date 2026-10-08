# Feature: Ticket template

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/ticket-template
**Status:** verified

## Goal

Create the first professional, themeable ticket template with event, attendee,
organizer, and QR code placeholders, rendered from typed data with sample values
on `/`. It is the single HTML/CSS template that the later preview (3) and PNG/PDF
export (5, 6) reuse, so what you see is what you download.

## Design reference

- `prototypes/generator.html` - the `.ticket` block (Classic stub layout):
  accent band, organizer row, "Admit one" badge, title, subtitle line, meta row
  (Date, Doors, Venue), dashed perforation with notches, stub with attendee
  name, QR area, and ticket ID.
- `prototypes/theme.css` - the theme tokens. Porting them into `app/globals.css`
  `@theme` is step 1.

## In scope

- Port the prototype theme tokens into `app/globals.css` `@theme` (app shell and
  ticket palettes, fonts, radii) and make the app shell dark.
- Wire the existing `next/font` Geist and Geist Mono variables to the theme font
  tokens (self-hosted at build time, which satisfies the plan's self-hosted fonts).
- Types for the ticket's inputs, matching the overview data model.
- A `Ticket` server component rendering the Classic stub template from those
  types, colored only by ticket theme variables so later features can recolor it.
- QR placeholder and ticket ID placeholder in the stub (no real QR or ID yet).
- Replace the create-next-app home page with the ticket on a dark canvas, using
  realistic sample data. Set the page metadata title to "Ticketa".

## Out of scope

- Form inputs and validation (feature 2), live binding (3).
- Real QR code and ticket ID generation (4).
- PNG/PDF export and the render endpoint (5, 6).
- Additional templates and the picker (7).
- Logo upload, custom colors, organizer branding controls (8). The template shows
  the organizer as text only; no logo slot yet.
- Persistence (9), history (10), long-name and formatting polish beyond the
  basic overflow guard below (11), responsive scaling of the ticket (12).
- Installing shadcn/ui or Zod; nothing in this feature needs them.
- Removing the unused scaffold assets in `public/`.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet with the full diff and done-when evidence. No checkpoint commits;
`/complete` makes the feature commit.

## Build steps

- [x] 1. **Port the theme.** Replace the scaffold variables in `app/globals.css`
  with `@theme` tokens taken from `prototypes/theme.css`: app colors
  (`bg`, `surface`, `surface-raised`, `canvas`, `border`, `border-strong`,
  `text`, `muted`, `faint`, `accent`, `accent-hover`, `accent-ink`, `danger`,
  `success`) and ticket colors (`ticket-paper`, `ticket-ink`, `ticket-muted`,
  `ticket-rule`, `ticket-accent`, `ticket-accent-ink`) as `--color-*`, plus
  `--font-sans` / `--font-mono` mapped to the Geist `next/font` variables. Remove
  the `prefers-color-scheme` light/dark switch and the Arial body font; body uses
  `bg`, `text`, and the sans font. Update `app/layout.tsx` metadata title to
  "Ticketa" and description to the product one-liner.
  **Done when:** `npm run build` and `npx tsc --noEmit` pass, and `/` renders on
  the dark background in Geist (checked via screenshot of the running app).
- [x] 2. **Ticket types, date formatter, and component.** Add `types/ticket.ts`
  (`EventInfo`, `AttendeeInfo`), `lib/format-ticket-date.ts`, and
  `components/ticket/Ticket.tsx` implementing the Classic stub layout from the
  design reference with Tailwind utilities on the ported tokens.
  **Done when:** `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- [x] 3. **Render the ticket on `/`.** Replace `app/page.tsx` with a dark dotted
  canvas centering `<Ticket>` with sample data (Frontend Nation 2026 example from
  the prototype).
  **Done when:** `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass, and
  a screenshot of `/` from the running app shows the ticket matching the
  prototype ticket: all fields, QR and ID placeholders, perforation and notches,
  and no text overflowing the ticket.

## Files / areas

- `app/globals.css` - theme tokens (modify)
- `app/layout.tsx` - metadata, font variables already present (modify)
- `app/page.tsx` - replace scaffold content (modify)
- `types/ticket.ts` - new
- `lib/format-ticket-date.ts` - new
- `components/ticket/Ticket.tsx` - new
- Imports use the existing `@/*` alias from `tsconfig.json`.

## Data / contracts

No persisted data or external API in this feature. In-memory types follow the
overview data model so features 2 to 4 build on them:

```ts
// types/ticket.ts
export type EventInfo = {
  name: string;
  date: string;      // ISO date "YYYY-MM-DD"
  time: string;      // 24h "HH:mm"
  location: string;
  organizer: string;
};

export type AttendeeInfo = {
  name: string;
  email?: string;    // not shown on the ticket
};
```

- `Ticket` props: `{ event: EventInfo; attendee: AttendeeInfo }`. Server
  component (no `'use client'`), so the same markup can be rendered by the
  later export path.
- `formatTicketDate("2026-11-14")` returns `"Sat, 14 Nov 2026"`: parse the
  `YYYY-MM-DD` parts and format with `Intl.DateTimeFormat("en-GB", { weekday:
  "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })`.
  Fixed locale and UTC keep server and client output identical. If the input is
  not a valid `YYYY-MM-DD` date, return the input unchanged. Locale choice is
  reversible and revisited in feature 11.
- Time is displayed as given (`HH:mm`).
- Ticket size: 760 x 300 CSS px, from the prototype. Final print and PDF
  dimensions are decided in feature 6.
- Ticket theming: all ticket colors come from the `--color-ticket-*` variables.
  No component prop for colors yet; feature 8 overrides the variables.

## Testing

No test command is configured, so there is no unit-test gate. Evidence per step:
`npm run lint`, `npx tsc --noEmit`, `npm run build`, and a screenshot of `/` from
`npm run start` (or `npm run dev`). `formatTicketDate` is pure logic that would
get a unit test once `/tests` adds a runner. For now, verify the sample output in
the screenshot.

## Notes for the AI

- Next.js 16 with `cacheComponents`: the page and `Ticket` use no dynamic APIs,
  so the page stays static. Do not add `Date.now()` or random values at render;
  they break prerendering and later export determinism.
- Read `node_modules/next/dist/docs/` before using any unfamiliar Next API.
- Tailwind v4 is loaded via the Turbopack loader, not PostCSS. Define tokens in
  `@theme`, not `@theme inline`, unless a value references another variable
  (font variables from `next/font` do, so use `@theme inline` for those).
- User-controlled text (all fields) renders as React text children only; never
  `dangerouslySetInnerHTML`.
- Basic overflow guard from the prototype: title clamps to two lines, meta values
  and attendee name truncate with an ellipsis. Fuller long-name handling is
  feature 11.
- The notches are circles in the canvas color. Keep the canvas color as a token
  so they match the page.
- QR placeholder: a square outlined box labeled "QR" in `ticket-muted`. ID
  placeholder: monospace text "TICKET ID". No fake QR pattern in app code.
- Inline `style` only for runtime values. None are needed here.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7459,"specSha256":"788d77b110381f8f2f58a0cc3c12b5545f83f38512a0a915342d50dba8fb017f","branch":"refs/heads/feature/ticket-template","head":"50f13eea74bf1bc28b8d2f9bb827ec1dbe88cba9","baseRef":"refs/heads/main","baseCommit":"50f13eea74bf1bc28b8d2f9bb827ec1dbe88cba9","sourceTree":"af19598cf7b040554a668b490eb6fb8239f461f9","landing":"local-merge","absentOptional":[]} -->
