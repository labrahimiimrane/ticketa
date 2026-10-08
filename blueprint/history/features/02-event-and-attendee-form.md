# Feature: Event and attendee form

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/event-and-attendee-form
**Status:** verified

## Goal

Add the generator's form panel with inputs for event details (name, date, time,
location, organizer) and attendee information (name, optional email), validated
with Zod and showing accessible inline errors. The page becomes the generator
layout: form panel on the left, ticket stage on the right. Binding the form to
the ticket is feature 3; until then the stage keeps the sample ticket.

## Design reference

- Generator layout and form styling from the feature 1 prototype, archived in
  `blueprint/history/features/01-ticket-template.md` and recoverable with
  `git show af19598:prototypes/generator.html`: 380px left panel with sectioned
  groups ("Event", "Attendee"), small muted labels, compact 34px inputs, a violet
  focus ring, and an invalid state (red border, tinted background, red message
  below).
- Theme tokens are already in `app/globals.css`.

## In scope

- Add `zod` as a direct dependency (Zod 4 is currently only transitive).
- Initialize shadcn/ui for this Next.js 16 and Tailwind v4 project and add its
  `input` and `label` components, restyled to the dark theme through the
  existing tokens.
- Zod schemas for `EventInfo` and `AttendeeInfo`, matching `types/ticket.ts`.
- A controlled client `TicketForm` with Event and Attendee sections, labeled
  inputs, and inline errors that appear after a field is touched.
- A client `Generator` that owns form state and lays out the panel and stage.
  The stage still renders `<Ticket>` with the sample data.
- A minimal top bar with the Ticketa brand.

## Out of scope

- Binding form values to the ticket (3), QR/ID (4), export buttons (5, 6).
- Template picker and branding controls, including organizer branding and logo (7, 8).
- Saving or restoring values (9), history (10).
- Friendlier date/time display, long-name handling, empty states, other polish (11).
- Mobile stacking and responsive tuning (12).
- Length limits or date range rules. None are defined in the plans.
- shadcn components beyond `input` and `label`.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Add Zod and initialize shadcn/ui.** `npm install zod`. Run the shadcn
  CLI init (`npx shadcn@latest init`), then `npx shadcn@latest add input label`.
  Check what init changed: it may rewrite `app/globals.css`, add `lib/utils.ts`
  (`cn`), `components.json`, and dependencies such as `clsx`, `tailwind-merge`,
  and `tw-animate-css`. Reconcile `app/globals.css` so that:
  - every feature 1 `@theme` token survives unchanged (the ticket must look the same);
  - shadcn's semantic variables (`--background`, `--foreground`, `--input`,
    `--ring`, `--primary`, `--destructive`, `--border`, `--muted-foreground`, and
    the rest init adds) map to the existing theme colors (dark only, no light
    palette);
  - the app is dark-only: add `className="dark"` to `<html>` in `app/layout.tsx`
    if the components rely on the `dark:` variant, and set `color-scheme: dark`
    so native date and time pickers render dark.
  If init cannot detect the project (Tailwind runs through the Turbopack loader,
  not PostCSS), write `components.json` by hand for Tailwind v4 with an empty
  `tailwind.config`, `app/globals.css`, and aliases `@/components`,
  `@/components/ui`, and `@/lib/utils`, then run `add`. Stop and report if it
  still fails.
  **Done when:** `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass, and
  a screenshot of `/` shows the feature 1 ticket unchanged.
- [x] 2. **Schemas.** Add `lib/ticket-schema.ts` with `eventInfoSchema` and
  `attendeeInfoSchema` per Data / contracts.
  **Done when:** typecheck passes, and a one-off script run with
  `node --experimental-strip-types` (Node 25 is installed) from the scratchpad
  (not committed) shows valid sample data passing and each listed invalid case
  failing with its exact message.
- [x] 3. **Form and generator layout.** Add `components/generator/TicketForm.tsx`
  (client, controlled) and `components/generator/Generator.tsx` (client, holds
  state, renders the top bar, panel, and stage with the sample `<Ticket>`).
  Update `app/page.tsx` to render `<Generator />`.
  **Done when:** lint, typecheck, and build pass. On the running app:
  - all seven inputs render with visible labels;
  - after clearing the event name and leaving the field, "Enter the event name"
    appears under it, and it disappears after typing a name;
  - "amina@" in the email field shows the email error after leaving the field,
    and an empty email shows no error;
  - the screenshot matches the prototype panel styling.

## Files / areas

- `package.json`, `package-lock.json` - `zod` plus whatever shadcn init adds
- `components.json` - new (shadcn)
- `lib/utils.ts` - new (shadcn `cn`)
- `components/ui/input.tsx`, `components/ui/label.tsx` - new (shadcn), restyled
  only through tokens or classes
- `app/globals.css` - reconcile shadcn variables with the theme
- `app/layout.tsx` - dark class or color scheme only, if needed
- `lib/ticket-schema.ts` - new
- `components/generator/TicketForm.tsx`, `components/generator/Generator.tsx` - new
- `app/page.tsx` - render `Generator` (sample data moves into `Generator`)
- `types/ticket.ts` - unchanged; schemas must stay assignable to it

## Data / contracts

No persistence and no server input. All validation runs in the browser on
in-memory state.

Form state in `Generator`:

```ts
type TicketFormValues = { event: EventInfo; attendee: AttendeeInfo };
```

Initial values: all fields empty strings (`attendee.email` as `""`). No defaults
are invented. Saved values arrive in feature 9.

Schemas (`lib/ticket-schema.ts`, Zod 4). Required strings are checked after
`trim()`; the stored value stays exactly as typed:

| Field | Rule | Message |
|---|---|---|
| `event.name` | required | Enter the event name |
| `event.date` | required, `YYYY-MM-DD` and a real calendar date | Choose a valid date |
| `event.time` | required, `HH:mm` 24h (00:00 to 23:59) | Choose a valid time |
| `event.location` | required | Enter the location |
| `event.organizer` | required | Enter the organizer |
| `attendee.name` | required | Enter the attendee's name |
| `attendee.email` | optional; `""` means absent; otherwise a valid email | Enter a complete email, like name@example.com |

- `eventInfoSchema` must satisfy `z.ZodType<EventInfo>` and `attendeeInfoSchema`
  must satisfy `z.ZodType<AttendeeInfo>`, so they cannot drift from `types/ticket.ts`.
- The date rule may reuse the calendar check in `lib/format-ticket-date.ts`. If it
  does, extract a shared `isValidIsoDate` there rather than duplicating it.
- `TicketForm` props: `{ values: TicketFormValues; onChange: (values:
  TicketFormValues) => void }`. Errors come from `safeParse` of the current
  values. Touched state (a set of field keys, added on blur) is local to
  `TicketForm`. A field shows its first error only when touched; the message
  clears as soon as the value becomes valid.

Inputs:

- Native `type="date"` and `type="time"` for date and time (they emit
  `YYYY-MM-DD` and `HH:mm`).
- `type="email"` for email, with `autoComplete` set where it applies (`name`,
  `email`).
- No `required` attribute and no `<form>` submit. There is nothing to submit;
  validation is live.

## Testing

No test command is configured, so there is no unit-test gate. Evidence:
- the step 2 one-off schema script output;
- `npm run lint`, `npx tsc --noEmit`, `npm run build`;
- a screenshot of `/`;
- the interaction checks in step 3's done-when, done in the running app. If they
  cannot be automated, list them as the manual try path and do not claim they
  passed.

## Notes for the AI

- Read `node_modules/next/dist/docs/` for any unfamiliar Next 16 API. `Generator`
  and `TicketForm` are client components (`'use client'`). `app/page.tsx` stays
  a server component that renders `<Generator />`. Keep values deterministic: no
  `Date.now()` defaults.
- Accessibility:
  - every input has a `<Label htmlFor>`;
  - optional email shows "(optional)" in the label;
  - an invalid touched field sets `aria-invalid="true"` and `aria-describedby`
    pointing at its message element (stable ids, for example
    `field-event-name-error`);
  - messages are plain text in a `<p>` below the input. No toast, no
    `role="alert"` on blur.
- User-controlled text renders only as React text or input values. No
  `dangerouslySetInnerHTML`.
- Keep the shadcn components close to upstream. Express theme differences
  through CSS variables in `globals.css` rather than rewriting component classes.
- The ticket's notches use `bg-canvas`. The stage must keep the canvas background.
- Do not delete the empty untracked `components/ticket 2/` directory (a Finder
  artifact outside this feature). Mention it in the review packet.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9104,"specSha256":"51313977b98d37fa4ff395a1fa9070080624563da89ed8e498f72c150d57f5ab","branch":"refs/heads/feature/event-and-attendee-form","head":"61c65ba1667ecb7b2c9d769365b9cb66be33c368","baseRef":"refs/heads/main","baseCommit":"61c65ba1667ecb7b2c9d769365b9cb66be33c368","sourceTree":"b6954f4c390dae5d7e6b808e657a5520f1c3084e","landing":"local-merge","absentOptional":[]} -->
