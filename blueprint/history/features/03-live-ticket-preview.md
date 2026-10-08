# Feature: Live ticket preview

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/live-ticket-preview
**Status:** verified

## Goal

Bind the generator form's values to the ticket so the preview updates on every
keystroke. The ticket rendered in the stage is the same `Ticket` component that
export (features 5 and 6) will use, keeping "what you see is what you get". With
the form starting empty, the ticket shows muted placeholder labels for empty
fields instead of blank space.

## In scope

- `Generator` passes `values.event` and `values.attendee` to `<Ticket>`. Remove
  the hard-coded sample event and attendee.
- `Ticket` renders a muted placeholder label for any field whose value is empty
  after trimming.
- The date shows formatted when valid (`formatTicketDate`); a partial or invalid
  date cannot come from the native date input, but if one arrives it renders as
  given (existing `formatTicketDate` behavior).

## Out of scope

- QR/ID generation (4), export (5, 6), templates (7), branding/logo/colors (8).
- Saving or restoring form values (9), history (10).
- Long-name handling beyond the existing clamp and ellipsis, friendlier
  formatting, other polish (11).
- Scaling the ticket for narrow viewports (12).
- Any validation change. The ticket shows exactly what is typed, valid or not;
  gating export on validity belongs to features 5 and 6.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Placeholder labels in `Ticket`.** For each displayed field, render its
  placeholder label (table below) in `text-ticket-muted` when `value.trim()` is
  empty; otherwise render the value exactly as typed with the current styles.
  **Done when:** `npx tsc --noEmit` and `npm run lint` pass.
- [x] 2. **Bind the form to the preview.** In `Generator`, render
  `<Ticket event={values.event} attendee={values.attendee} />` and delete
  `SAMPLE_EVENT` and `SAMPLE_ATTENDEE`.
  **Done when:** lint, typecheck, and `npm run build` pass. On the running app:
  - the initial ticket shows all six placeholders;
  - typing in each of the six ticket fields updates the matching ticket text
    without any other action;
  - date "2026-11-14" shows "Sat, 14 Nov 2026";
  - clearing a field restores its placeholder;
  - email never appears on the ticket;
  - a screenshot of the filled and empty states shows the ticket layout intact.

## Files / areas

- `components/ticket/Ticket.tsx` - placeholders (modify)
- `components/generator/Generator.tsx` - bind values, remove sample data (modify)

## Data / contracts

No new types, persistence, or server input. `Ticket` props stay `{ event:
EventInfo; attendee: AttendeeInfo }`.

Placeholder labels (shown only when the trimmed value is empty):

| Ticket field | Placeholder |
|---|---|
| `event.organizer` | Organizer |
| `event.name` (title) | Event name |
| `event.date` | Date |
| `event.time` | Time |
| `event.location` | Venue |
| `attendee.name` | Attendee name |

- Non-empty values render untrimmed, as typed (React text only).
- Static labels ("Date", "Time", "Venue", "Attendee", "Admit one") and the QR and
  ticket ID placeholders are unchanged.

## Testing

No test command is configured, so there is no unit-test gate. Evidence:
- `npm run lint`, `npx tsc --noEmit`, `npm run build`;
- headless Chrome on a running production server, either the user's or a
  temporary `next start` on a spare port that is stopped afterward. It drives
  the step 2 interactions through the DevTools protocol with focus emulation on,
  reads the ticket text, and takes screenshots of the empty and filled states.

## Notes for the AI

- Keep `Ticket` free of client-only APIs. It renders inside the client
  `Generator` now and must stay renderable on its own for the export path.
- No debouncing or deferred rendering. Instant update is the requirement, and
  the ticket is cheap to render.
- Placeholder and value share the same element and truncation classes, so layout
  does not shift between the empty and filled states. Change only the color.
- Never use `dangerouslySetInnerHTML`.
- The empty untracked `components/ticket 2/` directory is not part of this
  feature. Leave it.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4373,"specSha256":"6b54208ba67556d105cbdc2d2ab24322f7ebcff36bb8c74c5e5e66c92e143fb9","branch":"refs/heads/feature/live-ticket-preview","head":"a2fcd4d15b7deee838bd5c6ce530f55b59375c14","baseRef":"refs/heads/main","baseCommit":"a2fcd4d15b7deee838bd5c6ce530f55b59375c14","sourceTree":"fb68e8784b5494bd0d2670578f453430ee787d94","landing":"local-merge","absentOptional":[]} -->
