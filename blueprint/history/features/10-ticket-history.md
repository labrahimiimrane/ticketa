# Feature: Ticket history

**From build-plan:** feature 10
**Build attempt:** 1
**Branch:** feature/ticket-history
**Status:** verified

## Goal

Every ticket the user successfully downloads (PNG or PDF) is saved to a history
list in this browser. From that list the user can reopen a ticket, which puts
its exact snapshot back into the generator: event, attendee, template, branding,
and the same ticket ID. They can then download it again and get an identical
ticket. History survives reloads. If stored data is missing, malformed, or
unavailable, the generator keeps working.

## In scope

- A separate `localStorage` record, `ticketa:history`, holding the overview's
  `Ticket[]`. Feature 9 already reserved a separate key so that typing never
  re-serializes the history.
- Recording a ticket only after its export succeeds. The snapshot is taken when
  the download starts, so edits made while the export is running are not saved
  into that entry.
- One entry per ticket ID (upsert). When a ticket that is already in history is
  exported again, its entry gets the new snapshot, keeps its `createdAt`, and
  moves to the top.
- A **History** section in the generator's left panel, below Branding. It lists
  entries newest first and shows an empty state.
- **Reopen** loads an entry into the generator: form values, template, branding,
  and ticket ID. The existing Download buttons then regenerate it.
- **Remove** deletes a single entry. This is the only way to free space when
  storage is full; see Open questions.
- Defensive restore: each entry is validated on its own, and invalid entries are
  dropped without discarding the rest.
- A non-blocking status message when saving history fails. The download itself
  has already succeeded at that point.

## Out of scope

- Storage, quota, or dedupe changes for `ticketa:state` (feature 9's record).
- Downloading straight from the history list without reopening it first.
- Clear-all, search, sorting options, rename, or bulk actions.
- Cross-tab sync through `storage` events, and migrating other record versions.
- Deduplicating logo data URLs across entries, and compressing stored data.
- Date and time formatting, long-name truncation polish, and richer empty
  states (feature 11).
- Mobile or responsive layout of the history section (feature 12).
- Server storage or verification by ticket ID (Later, not v1).

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement all the steps below and run the checks after each one,
then present one review packet for the whole feature. There are no checkpoint
commits; `/complete` creates the final feature commit.

## Build steps

- [x] 0. **Clear the typecheck baseline** - `npx tsc --noEmit` currently fails
  only because of `.next/types/routes.d 2.ts`, a stray Finder duplicate in
  ignored, generated output. Delete that one file. Delete no other files and
  change no source.
  **Done when:** `npx tsc --noEmit` and `npm run lint` pass on the unchanged
  source.

- [x] 1. **History storage module** - Add `lib/ticket-history.ts` with:
  - the `Ticket` type
  - `TICKET_HISTORY_KEY`
  - an entry schema built from the existing `eventInfoSchema`,
    `attendeeInfoSchema`, `brandingSchema`, and `z.enum(TEMPLATE_IDS)`, plus the
    ticket ID regex
  - `parseTicketHistory(raw: string | null): Ticket[]`, which is pure and never
    throws
  - `upsertTicket(history, ticket): Ticket[]` and
    `removeTicket(history, id): Ticket[]`, both pure
  - `readTicketHistory(): Ticket[]` and
    `writeTicketHistory(history): boolean`, which wrap every `localStorage`
    access in `try/catch`

  Move the ticket ID regex out of `lib/export/export-request.ts` into
  `lib/ticket-id.ts` as an exported `TICKET_ID_PATTERN`. Both schemas then share
  it, and the export contract stays the same.
  **Done when:** the module typechecks, nothing imports it yet except the moved
  regex, the export routes still compile, and `npx tsc --noEmit` and
  `npm run lint` pass.

- [x] 2. **Record on successful export** - Add
  `components/generator/use-ticket-history.ts`. It follows the
  `use-saved-state.ts` pattern: a module-level cache read once,
  `useSyncExternalStore` with a server snapshot of `null`, and a
  `useHistorySaveFailed()` flag. It exports `useTicketHistory()`,
  `recordTicket(ticket)`, and `removeHistoryTicket(id)`.

  Each mutation does three things: it computes the next list with the pure
  helpers, writes it, and then updates the cache. On success it caches the
  written list. On failure it leaves the cache unchanged, so the list on screen
  always matches what is stored. In both cases it sets the failure flag and
  notifies listeners.

  In `Generator.exportTicket`, build the snapshot
  (`{ id: ticketId, createdAt, templateId, event, attendee, branding }`) before
  the `fetch`. Use the same snapshot for the request body. After the blob is
  saved, call `recordTicket`. `createdAt` is `new Date().toISOString()`, and
  `upsertTicket` keeps an existing entry's original `createdAt`. In the header,
  show "Couldn't save this ticket to history." in its own polite status
  region, separate from the save-state and export messages. Clear it after the
  next successful history write.
  **Done when:** two exports of different tickets leave two entries under
  `ticketa:history` in DevTools, newest first. Exporting PNG and then PDF of the
  same ticket leaves one entry. A failed export (for example with the network
  offline) records nothing. With `setItem` blocked, the download still works
  and the history message appears. `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` pass.

- [x] 3. **History section, reopen, and remove** - Add
  `components/generator/TicketHistory.tsx`. It is a
  `<section aria-labelledby>` with an `h2` "History", following the existing
  section styling, and is rendered in the aside below `BrandingPanel`.

  - While the snapshot is `null` (server render and hydration), it renders the
    heading only.
  - An empty list shows "No tickets yet. Downloaded tickets appear here."
  - Each entry shows the attendee name, the event name, and the ticket ID in
    mono. Text renders through ordinary React bindings.
  - Each entry has a **Reopen** button and a **Remove** button. Their
    accessible names include the attendee name and the ticket ID, for example
    `Reopen ticket TKT-7F3K-92QD for Ada Lovelace`.

  Reopen calls a `Generator` handler. The handler sets `values`, `templateId`,
  and `branding` from the entry, sets the ticket ID through a new
  `setTicketId(id)` export in `use-ticket-id.ts`, resets `showAllErrors` and
  the export state, and bumps a `reopenCount` that is used as the `key` on
  `TicketForm` and `BrandingPanel`. This re-seeds their mount-only state:
  touched fields, hex text, and the logo file name and error. After a reopen, a
  polite status announces "Reopened ticket TKT-…".

  Remove deletes the entry immediately, with no confirmation. Remove changes
  only history. The generator's current ticket stays as it is.
  **Done when:**
  - With no history, the section shows the empty state.
  - After a download, the entry appears without a reload.
  - Reopen restores the form, template picker, hex field, logo, preview, and
    ticket ID. Downloading again produces a file named with the same ID, and
    the history still has one entry for it.
  - Remove deletes the entry, and the deletion survives a reload.
  - A hand-edited `ticketa:history` with one malformed entry still shows the
    valid entries, and invalid JSON shows the empty state.
  - There is no hydration warning.
  - `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.

## Files / areas

- `.next/types/routes.d 2.ts` - delete. This is generated and ignored output,
  not source.
- `lib/ticket-history.ts` (new) - type, key, schema, parse, upsert, remove,
  read, and write.
- `lib/ticket-id.ts` - export `TICKET_ID_PATTERN`.
- `lib/export/export-request.ts` - use `TICKET_ID_PATTERN`. Behavior stays the
  same.
- `components/generator/use-ticket-history.ts` (new) - client store, mutations,
  and the failure flag.
- `components/generator/use-ticket-id.ts` - add `setTicketId(id)`, which
  notifies listeners the same way `regenerate` does.
- `components/generator/TicketHistory.tsx` (new) - list, empty state, and
  buttons.
- `components/generator/Generator.tsx` - snapshot before export, record on
  success, history status, reopen handler, `reopenCount` keys, and rendering
  `TicketHistory`.
- Reused unchanged: `lib/branding.ts`, `lib/ticket-schema.ts`,
  `lib/ticket-templates.ts`, `lib/local-state.ts`,
  `components/generator/use-saved-state.ts`, and the export routes.

## Data / contracts

Persisted in the browser only. There is no server or API change.

- **Key:** `ticketa:history`.
- **Value:** JSON, newest first.

  ```json
  {
    "version": 1,
    "tickets": [
      {
        "id": "TKT-7F3K-92QD",
        "createdAt": "2026-10-09T14:03:12.511Z",
        "templateId": "classic",
        "event": { "name": "", "date": "YYYY-MM-DD", "time": "HH:mm", "location": "", "organizer": "" },
        "attendee": { "name": "", "email": "" },
        "branding": { "logo": null, "colors": { "accent": "#8B5CF6" } }
      }
    ]
  }
  ```

- **Ticket:** `id` matches `TICKET_ID_PATTERN` and is unique within the list.
  `createdAt` is an ISO datetime from `toISOString()`, set on the first record
  and kept on upsert. `templateId` must be in `TEMPLATE_IDS`. `event`,
  `attendee`, and `branding` must pass the same schemas the export endpoint
  enforces, so every entry that is restored can be exported. Values are stored
  exactly as typed, just as export sends them.
- **Restore rules** (stored data is untrusted):
  - A missing key, unreadable storage, invalid JSON, a non-object,
    `version !== 1`, or a non-array `tickets` all return `[]`.
  - Each entry is parsed on its own, and failing entries are dropped.
  - If an `id` appears more than once, the first occurrence is kept.
  - Unknown fields are dropped on the next write.
- **Write:** the whole record, `{ version: 1, tickets }`. Any thrown error
  (`QuotaExceededError`, `SecurityError`) is caught and reported as a failed
  write. The in-memory list is not changed, and no entries are evicted
  automatically.
- **Rendering:** stored strings render only through React text and attributes.
  Logos render through the existing ticket components after they pass
  `brandingSchema`. There is no `dangerouslySetInnerHTML`.

## Testing

No test runner is configured, so this feature has no automated logic tests.
`parseTicketHistory`, `upsertTicket`, and `removeTicket` are pure so that they
can get unit tests once `/tests` adds a runner. Each step is verified with
`npx tsc --noEmit` and `npm run lint`, plus `npm run build` from step 2 on, and
with the manual browser checks in each step's Done when. There is no Browser
tests command.

## Notes for the AI

- Baseline at spec time: `npm run lint` passes. `npx tsc --noEmit` fails only
  on `.next/types/routes.d 2.ts` (duplicate `LayoutProps` / `RouteContext`),
  and step 0 removes that file. No `Verify` command exists.
- Keep the module-cache plus `useSyncExternalStore` pattern from
  `use-saved-state.ts` and `use-ticket-id.ts`. The React lint rule forbids
  `setState` inside effects.
- Reopen replaces the current draft in the generator, and feature 9's save
  effect then persists it as `lastEvent` and the other fields. This is
  expected.
- A reopened ticket that is edited and downloaded again keeps the same ID, so
  it updates that entry. Use "New ticket ID" to make a separate entry.
- A logo can be about 350 KB as a data URL, and each entry snapshots it, so a
  few branded tickets can fill the roughly 5 MB quota that history shares with
  `ticketa:state`. Remove is the recovery path, and the failure message must
  appear when that happens.
- Do not add Zod schemas that duplicate `eventInfoSchema`,
  `attendeeInfoSchema`, or `brandingSchema`. Reuse them.

## Open questions

These choices have defaults so that implementation can start. Confirm or
change each one in review:

1. **History placement:** the overview leaves "separate route or panel" open.
   Default: a section in the generator's left panel, with no new route.
2. **What counts as "generated":** default: a successful PNG or PDF download,
   one entry per ticket ID. Nothing is recorded on preview or on "New ticket
   ID".
3. **Full storage:** default: no automatic eviction and no count cap. A failed
   save shows a message, and per-entry **Remove** frees space. The
   alternatives are to evict the oldest entries silently or to cap the list at
   N entries.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":12719,"specSha256":"f370dcf107561edbde68a9fd3bf52608db54e08161bb676151789fbacd3c8a5d","branch":"refs/heads/feature/ticket-history","head":"2bef97f375162e6dd6cbb2696036b4f23204bcb5","baseRef":"refs/heads/main","baseCommit":"2d6f15bf7e462027d940b5e0a9ec286b976aca9b","sourceTree":"dca3c7f80e9493d056f3680857b289c16e776a1d","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 2bef97f375162e6dd6cbb2696036b4f23204bcb5
**Base commit:** 2d6f15bf7e462027d940b5e0a9ec286b976aca9b
**Base ref:** refs/heads/main
**Spec hash:** f370dcf107561edbde68a9fd3bf52608db54e08161bb676151789fbacd3c8a5d
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-09T22:57:53Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-09T22:58:57Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `git rev-parse HEAD`: pass (matches Target commit)
- `git merge-base HEAD refs/heads/main`: pass (matches Base commit)
- `shasum -a 256 blueprint/context/current-feature.md`: pass (matches Spec hash; spec is tracked)
- `git status --porcelain --untracked-files=all`: pass (only blueprint/context/review.md differs)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass
- Test command: unavailable (no test runner configured)
- Verify command: unavailable (not defined)

### Evidence

- Reviewed the full delta: lib/ticket-history.ts, lib/ticket-id.ts, lib/export/export-request.ts, components/generator/use-ticket-history.ts, components/generator/use-ticket-id.ts, components/generator/TicketHistory.tsx, components/generator/Generator.tsx, plus the spec, and callers/contracts in use-saved-state.ts, lib/branding.ts, lib/ticket-schema.ts, TicketForm.tsx, BrandingPanel.tsx.
- Security: stored history is parsed with JSON.parse in try/catch, then validated per entry with the same eventInfoSchema, attendeeInfoSchema, brandingSchema (logo restricted to base64 image data URLs, 256 KB cap), TEMPLATE_IDS enum, and the shared TICKET_ID_PATTERN the export endpoint enforces; zod strips unknown keys; no dangerouslySetInnerHTML anywhere in components, lib, or app; strings render through React text and attributes only.
- Contracts: export-request regex moved to TICKET_ID_PATTERN with identical pattern; snapshot is built before fetch and reused for the request body; recordTicket runs only after saveBlob succeeds; upsert keeps createdAt and moves the entry to the top; failed writes leave the cache unchanged and set the failure flag, which a later successful write clears; server snapshot is null so hydration renders the heading only.
- Performance: storage read once per page load into a module cache; one full-record stringify per successful export or remove, bounded by the browser quota; history list does not render logos.
- Tests: no runner exists; parseTicketHistory, upsertTicket, and removeTicket are pure and test-ready, per the spec's Testing section.

### Findings

- F-01 [P3] open - Reopen during an in-flight export clears the exporting state (components/generator/Generator.tsx:122)

### Remaining risk

- No test runner: the pure history helpers and restore rules have no automated tests.
- No Verify command or GitHub checks are defined.
- No Browser tests command; Check was not required and no browser or runtime evidence was inspected by this reviewer (hydration, quota-full, and reopen flows are unverified at runtime).
- Cross-tab writes can overwrite each other's history (stale per-tab cache); out of scope per the spec.
- A failed Remove reuses the message "Couldn't save this ticket to history.", which is slightly imprecise wording for a removal failure.
