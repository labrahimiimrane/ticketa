# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] fixed - Reopen during an in-flight export clears the exporting state

**File:** components/generator/Generator.tsx:122
**Found:** 2026-10-09 by /audit independent (scope: current; lens: quality)
**Why it matters:** The history Reopen buttons stay enabled while an export is running. `reopenTicket` sets `exportState` to idle, which re-enables both Download buttons while the first `fetch` is still pending. A second export can then start concurrently, and whichever request settles first overwrites the other's state (buttons re-enabled while the second request runs, or a late "Couldn't create the PNG" error shown against the reopened ticket). The recorded history snapshot itself stays correct because it is captured before the fetch. Low impact; the reset is what the spec asked for, so this is an edge case of the spec'd behavior, not a contract violation.
**Suggested fix:** Smallest option: disable the Reopen buttons while `exportState.status === "exporting"` (pass an `exporting` flag to `TicketHistory`), or leave `exportState` untouched in `reopenTicket` when it is `exporting`. No current requirement would be lost.
**Resolution:** Fixed on `fix/reopen-during-export`: history Reopen buttons are disabled while an export is in flight (`TicketHistory` `exporting` prop from `Generator`), so a reopen can no longer reset the pending export state. Awaiting `/audit` re-review.
