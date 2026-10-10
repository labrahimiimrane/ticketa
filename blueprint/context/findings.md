# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-04 [P3] fixed - README overstates ticket history after the 20-ticket cap

**File:** README.md:42
**Found:** 2026-10-10 by /audit (scope: full; lens: quality)
**Why it matters:** The Features list says "Every exported ticket is saved locally, so you can reopen it, edit it, and export it again." Since `fix: cap ticket history at 20`, `upsertTicket` keeps only the newest 20 (`MAX_HISTORY_TICKETS` in `lib/ticket-history.ts:23`) and silently drops older ones. A reader of the README would expect unlimited history.
**Suggested fix:** Change the bullet to say the 20 most recent exported tickets are saved locally, with the oldest removed when a new one is added. This is a docs-only change, and no current requirement would be lost.
**Resolution:** Fixed on `fix/readme-history-wording`: `README.md:42` now says the 20 most recent exported tickets are saved and the oldest is removed when a new one is added. Awaiting `/audit` re-review.
