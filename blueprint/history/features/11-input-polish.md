# Feature: Input polish

**From build-plan:** feature 11
**Build attempt:** 1
**Branch:** feature/input-polish
**Status:** verified

## Goal

Polish the generator's inputs and output so long text, empty values, blocked
downloads, and dates read cleanly: long names wrap or step down in size instead
of overflowing, a blocked download says what to fix and moves focus there, the
history list shows when each ticket was made and for which date, and empty
screens explain themselves. No stored data, schema, or export contract changes.

## In scope

- **Long-text handling on all three ticket templates** (preview and export share
  the same components, so both change together):
  - unbroken strings (a 60-character word, a long URL as the venue) wrap or clamp
    inside their box instead of overflowing it;
  - long event names step down one font size so more of the name fits in the
    existing two-line clamp;
  - the attendee name wraps to at most two lines instead of a one-line ellipsis;
  - the venue wraps to at most two lines on Classic and Bold.
- **Blocked-download feedback:** when Download PNG or PDF is pressed with invalid
  fields, show an announced summary near the buttons ("Fix 2 fields before
  downloading.") and move focus to the first invalid field in form order. The
  summary clears once every field is valid or a ticket is reopened.
- Mark required form inputs with `aria-required`; the email field stays marked
  "(optional)".
- **Date/time formatting in history:** each history entry shows the event date
  (same format as the ticket) and when the ticket was created, in the viewer's
  local time.
- **Empty states:**
  - the preview stage shows a short hint while every event and attendee field is
    blank;
  - the branding panel shows "Saved logo" instead of the upload-format hint when
    a logo is present without file details (restored from storage or reopened
    from history).

## Out of scope

- Length limits on any field, in the form, the Zod schemas, or the export
  endpoint. Changing `eventInfoSchema` or `attendeeInfoSchema` would also drop
  existing history entries that fail the new rule. Server input limits belong to
  feature 14.
- Detecting at runtime whether a value was cut off on the ticket (DOM
  measurement) and warning in the form.
- Changing the ticket date locale or the 24-hour time display (see Open
  questions).
- Mobile and responsive layout of any panel (feature 12).
- Storage, history, or export behavior changes; new validation rules or messages
  for individual fields (feature 2's messages stay as they are).
- New dependencies or shadcn components.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Long text on the tickets.** In `components/ticket/ticket-parts.tsx`
  add a shared wrap class (`[overflow-wrap:anywhere]`) and a pure
  `eventTitleClass(name, normal, long)` helper that returns `long` when the
  trimmed name is longer than `LONG_TITLE_CHARS` (40) and `normal` otherwise.
  Apply in Classic, Bold, and Minimal per Data / contracts: title size step-down
  plus wrap, attendee name `line-clamp-2` plus wrap, venue `line-clamp-2` plus
  wrap on Classic and Bold. Organizer, date, time, and Minimal's combined meta
  line keep their one-line truncate.
  **Done when:** lint, typecheck, and build pass, and screenshots of `/` for each
  template with the stress values in Testing show: no text outside the ticket or
  its column, the 80-character title at the smaller size in two clamped lines, the
  attendee name on two lines, the venue on two lines (Classic, Bold), and the QR
  code and ticket ID fully visible. A PNG exported with the same values matches
  the Classic preview.
- [x] 2. **Blocked-download feedback.** In `Generator.tsx` replace the
  `showAllErrors` boolean with a `blockedAttempts` counter (incremented on each
  blocked export, reset to 0 on reopen; `showAllErrors = blockedAttempts > 0`).
  Pass it to `TicketForm`, which focuses the first invalid input in form order
  whenever the counter increases. Render the summary per Data / contracts in the
  header status area. Add `aria-required="true"` to the six required inputs.
  **Done when:** lint, typecheck, and build pass. On the running app with an
  empty form: pressing Download PNG shows "Fix 6 fields before downloading.",
  every field error, and focus on Event name; filling the event name and
  pressing Download PDF updates the count to 5 and focuses Date; once every
  field is valid the summary disappears without another click; reopening a
  history ticket clears it.
- [x] 3. **History dates and empty states.** Add `formatCreatedAt` to
  `lib/format-ticket-date.ts`. In `TicketHistory.tsx` show the event date and a
  `<time>` with the created timestamp per Data / contracts. In `Generator.tsx`
  show the blank-form hint under the preview. In `BrandingPanel.tsx` show
  "Saved logo" when `value.logo` is set and `logoFile` is null.
  **Done when:** lint, typecheck, and build pass; a scratchpad script (not
  committed) run with `node --experimental-strip-types` shows `formatCreatedAt`
  output for a valid ISO datetime and returns `""` for an invalid one. On the
  running app: a history entry shows "Sat, 14 Nov 2026" and "Created …" with the
  local time of export; a fresh, empty form shows the preview hint and typing
  any character in any field hides it; after reload with a saved logo the
  branding panel reads "Saved logo".

## Files / areas

- `components/ticket/ticket-parts.tsx` - wrap class, `LONG_TITLE_CHARS`,
  `eventTitleClass`
- `components/ticket/ClassicTicket.tsx`, `BoldTicket.tsx`, `MinimalTicket.tsx` -
  class changes only
- `components/generator/Generator.tsx` - `blockedAttempts`, summary, blank-form
  hint
- `components/generator/TicketForm.tsx` - focus on blocked attempt,
  `aria-required`
- `components/generator/TicketHistory.tsx` - event date and created time
- `components/generator/BrandingPanel.tsx` - "Saved logo" label
- `lib/format-ticket-date.ts` - `formatCreatedAt`
- Unchanged: `lib/ticket-schema.ts`, `lib/ticket-history.ts`, `lib/local-state.ts`,
  `lib/export/*`, `app/api/*`, `app/render/ticket/page.tsx`, `types/ticket.ts`

## Data / contracts

No persisted-data, schema, or API change. `ticketa:state` and `ticketa:history`
records and the export request contract stay byte-for-byte compatible.

Ticket text classes (sizes and clamps are fixed classes chosen from the name
length, so server render, preview, and Puppeteer export agree):

| Template | Title normal / long (> 40 chars) | Attendee | Venue |
|---|---|---|---|
| Classic | `text-[34px]` / `text-[28px]`, `line-clamp-2` | `line-clamp-2` | `line-clamp-2` |
| Bold | `text-[28px]` / `text-[24px]`, `line-clamp-2` | `line-clamp-2` | `line-clamp-2` |
| Minimal | `text-[34px]` / `text-[28px]`, `line-clamp-2` | `line-clamp-2` | one-line truncate (shared meta line) |

All wrapped or clamped user text also gets the shared wrap class. Tailwind only
sees literal class names, so pass full class strings to `eventTitleClass`, never
built ones.

Blocked-download summary:

- Count = number of event and attendee fields whose schema check fails (first
  issue per field, same as `TicketForm`), recomputed from current values.
- Text: `Fix 1 field before downloading.` or `Fix N fields before downloading.`
- Rendered in a `role="alert"` element in the header, `text-danger`, only while
  `blockedAttempts > 0` and the count is above 0. A blocked export with only a
  missing ticket ID (before mount) shows no summary, as today.
- The existing export-error message is unchanged and still clears on the next
  attempt.

`formatCreatedAt(iso: string): string` - formats an ISO datetime as
`"9 Oct 2026, 14:05"` with `Intl.DateTimeFormat("en-GB", { day: "numeric",
month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12:
false })` in the viewer's local time zone; returns `""` for an unparseable
value. Browser only in practice: history renders only after hydration
(`useTicketHistory` server snapshot is `null`), so local time never causes a
hydration mismatch.

History entry lines: attendee name (truncate), event name (truncate), event date
via `formatTicketDate` (muted), then the ticket ID and `<time dateTime={createdAt}>
Created {formatCreatedAt(createdAt)}</time>` (faint mono). The Reopen and Remove
labels stay as they are.

Blank-form hint: while every `event` and `attendee` field is blank after trim,
show `Fill in the event details to build your ticket.` as muted text under the
ticket in the stage. Plain text, not a live region.

## Testing

No test command is configured, so there is no unit-test gate. Evidence per step:
`npm run lint`, `npx tsc --noEmit`, `npm run build`, plus running-app checks with
`npm run dev`. `eventTitleClass` and `formatCreatedAt` are pure and would get
unit tests once `/tests` adds a runner.

Stress values for step 1 screenshots:

- Event name: `International Conference on Sustainable Urban Infrastructure and Mobility 2026` (80 chars)
- Venue: `Grand Ballroom, Level 3, Metropolitan Convention Centre, 1200 Harbourfront Boulevard`
- Attendee: `Maria-Alejandra Konstantinopoulou-Fitzgerald`
- Unbroken: event name `Superlongunbrokeneventnamewithoutanyspacesatalltotestwrapping`

## Notes for the AI

- Next.js 16 with `cacheComponents`: the templates stay server-renderable for
  `app/render/ticket/page.tsx`. Do not measure the DOM or use client hooks in
  ticket components; length-based classes only.
- User text stays React text children; never `dangerouslySetInnerHTML`.
- Focus moves by focusing the input with the existing `field-<section>-<name>`
  id in an effect keyed on `blockedAttempts`, after errors render. Form order is
  event name, date, time, location, organizer, attendee name, email.
- The summary uses `role="alert"`; do not also add `aria-live` to the inline
  field errors (they are announced through `aria-describedby` when focused).
- Keep `TicketForm`'s `key={reopenCount}` remount; resetting `blockedAttempts` on
  reopen is in `reopenTicket`.
- Check line heights in the PDF too if step 1 changes the Classic stub layout;
  the stub is `justify-between`, so two-line names push nothing off the ticket.

## Open questions

Not blocking; the spec uses the default shown. Change before `/implement` if you
prefer otherwise.

- **Time on the ticket:** keep 24-hour `19:30` (matches the fixed `en-GB` date,
  current default) or switch to 12-hour `7:30 PM`?
- **Long-title threshold:** step down one size above 40 characters (default), or
  a different cutoff?


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10750,"specSha256":"fc38d9457b79a0df82be2e06c0cc7eb178ccdb24c245a9e832c33b009845435b","branch":"refs/heads/feature/input-polish","head":"80518232168db3390847d3200d0a625f7c660820","baseRef":"refs/heads/main","baseCommit":"80518232168db3390847d3200d0a625f7c660820","sourceTree":"138adf41644f530dd91c2d0b31710f35146e0ebe","landing":"local-merge","absentOptional":[]} -->
