# Fix: Cap ticket history at 20

**Type:** Fix
**Status:** verified
**Branch:** fix/cap-ticket-history-at-20
**Fixes:** F-02

## The problem

`upsertTicket` in `lib/ticket-history.ts` prepends every exported ticket, and
nothing ever trims the list. Each entry stores its full branding, including the
logo as a base64 data URL of up to about 342 KB. History (`ticketa:history`) and
the draft autosave (`ticketa:state`) share the origin's localStorage quota. Once
history fills it, new tickets stop being saved to history and the draft autosave
starts failing too. Both failures are caught and shown, but saving stays broken
until the user removes entries by hand. See F-02 in
`blueprint/context/findings.md`.

The only write path is `Generator.exportTicket` → `recordTicket`
(`components/generator/use-ticket-history.ts`) → `upsertTicket` → `commit` →
`writeTicketHistory`. Remove only filters the list, so it never grows it.

## The fix

User decision (2026-10-10): keep the newest **20** tickets.

- In `lib/ticket-history.ts`, add `MAX_HISTORY_TICKETS = 20`. Have `upsertTicket`
  return its existing newest-first list trimmed to that length, so adding a 21st
  ticket drops the oldest (the last entry).
- Re-exporting a ticket that is already in history still moves it to the front
  and keeps its original `createdAt`. It replaces its old entry rather than
  adding one, so it never removes another ticket.

Must not break:
- **Ordering:** newest first; `upsertTicket` and duplicate-ID rules stay the same.
- **Error handling:** `commit` still updates the cached list only when
  `writeTicketHistory` succeeds, and a failed write still shows "Couldn't save
  this ticket to history."
- **Autosave:** `ticketa:state` is untouched by this change.
- **Reading:** `parseTicketHistory` is unchanged. A stored list that already has
  more than 20 entries still loads in full and is trimmed on the next export
  only. Nothing is dropped on page load.

Not changed: the logo storage format, Remove, and quota handling. No new state,
dependency, or configuration.

## Build steps

- [x] 1. **Cap the list in `upsertTicket`.** Add the constant and the trim in
  `lib/ticket-history.ts`. **Done when:**
  - `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
  - On local production (`npm run start`, restarted after the build), with 20
    valid tickets seeded in `ticketa:history`, one export leaves exactly 20
    stored entries. The new ticket is first, the previously oldest entry is gone,
    and the other 19 keep their order.
  - Re-exporting a reopened ticket that is already in history keeps 20 entries,
    moves that ticket to the front, and keeps its original `createdAt`.
  - With 25 seeded entries, the History panel lists all 25 on load before any
    export.

## Verify

1. Seed `ticketa:history` with 20 tickets, then export a new ticket. History
   shows 20 entries, newest first, and the oldest seeded one is gone.
2. Reopen one of the older tickets and export it again. It moves to the top,
   still 20 entries, and its "Created" time is unchanged.
3. Make a normal edit and reload: the draft autosave still restores the form.

No test runner is configured, so verification is the static checks plus a
headless-browser check of localStorage and the History panel. `upsertTicket` is
pure logic that should get a unit test once `/tests` adds a runner.

## Verification log

- Static checks: `npm run lint` passed and `npm run build` passed. The first
  `npx tsc --noEmit` failed only on `.next/types/routes.d 3.ts`, an iCloud Drive
  conflict copy of generated output (the project lives under the iCloud-synced
  Desktop). After the rebuild regenerated `.next/types`, `npx tsc --noEmit`
  passed.
- Local production (`npm run start` restarted at 11:58 after the 11:56 build),
  headless Chrome via the `puppeteer` dev package, with seeded valid tickets
  (`TKT-SEED-2xx2`, newest first):
  - 20 seeded: the History panel showed 20. After one PNG export, storage held
    20, the new ticket was first, the oldest seeded ticket (`TKT-SEED-22M2`) was
    gone, and the other 19 kept their order. The panel showed 20 and no save
    error.
  - Reopening the 11th entry and exporting again: still 20, that ticket moved
    to the front with its original `createdAt`, and no other entry was removed.
  - Autosave: typing into Location and reloading restored the typed text
    (`ticketa:state` unaffected).
  - 25 seeded, page load only: the panel listed 25 and storage still held 25.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4509,"specSha256":"a407c6d75260b016a68038fccf1fb881d85ab15279fd9df5491d2f882b64225f","branch":"refs/heads/fix/cap-ticket-history-at-20","head":"20f5178d38ca1f8a2ddf10438f551b35506d7ff2","baseRef":"refs/heads/main","baseCommit":"20f5178d38ca1f8a2ddf10438f551b35506d7ff2","sourceTree":"1990dd90b2fcd644d4078e9076107e6d913ab35f","landing":"local-merge","absentOptional":[]} -->

## Findings

### cap-ticket-history-at-20/F-01 [P3] closed - Reopen during an in-flight export clears the exporting state

**File:** components/generator/Generator.tsx:122
**Found:** 2026-10-09 by /audit independent (scope: current; lens: quality)
**Why it matters:** The history Reopen buttons stay enabled while an export is running. `reopenTicket` sets `exportState` to idle, which re-enables both Download buttons while the first `fetch` is still pending. A second export can then start concurrently, and whichever request settles first overwrites the other's state (buttons re-enabled while the second request runs, or a late "Couldn't create the PNG" error shown against the reopened ticket). The recorded history snapshot itself stays correct because it is captured before the fetch. Low impact; the reset is what the spec asked for, so this is an edge case of the spec'd behavior, not a contract violation.
**Suggested fix:** Smallest option: disable the Reopen buttons while `exportState.status === "exporting"` (pass an `exporting` flag to `TicketHistory`), or leave `exportState` untouched in `reopenTicket` when it is `exporting`. No current requirement would be lost.
**Resolution:** Fixed on `fix/reopen-during-export`: history Reopen buttons are disabled while an export is in flight (`TicketHistory` `exporting` prop from `Generator`), so a reopen can no longer reset the pending export state. Awaiting `/audit` re-review. Closed 2026-10-10 by /audit (scope: full; all lenses): `components/generator/TicketHistory.tsx:51` sets `disabled={exporting}` on Reopen, and `components/generator/Generator.tsx` passes `exporting={isExporting}`, so `reopenTicket` cannot run while a fetch is pending. No other caller of `reopenTicket` exists, and the repair adds no new defect.
