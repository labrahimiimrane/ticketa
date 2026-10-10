# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-02 [P2] fixed - Ticket history grows without a cap and can fill localStorage

**File:** lib/ticket-history.ts:63
**Found:** 2026-10-10 by /audit (scope: full; lens: performance)
**Why it matters:** `upsertTicket` prepends every exported ticket, and nothing ever trims the list. Each entry stores its full branding, including the logo as a base64 data URL of up to about 342 KB. `ticketa:history` and `ticketa:state` share the origin's localStorage quota. That quota is browser-dependent and was not measured here, but at about 5 million characters, roughly 15 tickets with a maximum-size logo would fill it. After that, new tickets stop being saved to history ("Couldn't save this ticket to history.") and the draft autosave also starts failing ("Couldn't save your changes in this browser."). Both failures are caught and shown, so no existing data is lost, but saving degrades permanently until the user removes entries by hand. The overview's open question on logo storage flagged this risk.
**Suggested fix:** Cap the stored list in `upsertTicket`, for example by keeping the newest 20 entries. The cap is a product decision, because it silently drops the oldest tickets. Choose the number with the user before changing shipped behavior.
**Resolution:** Fixed on `fix/cap-ticket-history-at-20` (user chose 20): `upsertTicket` in `lib/ticket-history.ts` now keeps only the newest `MAX_HISTORY_TICKETS = 20` entries, so the list is trimmed on every export. Reading is unchanged, so an existing longer list is kept until the next export. Awaiting `/audit` re-review.

### F-03 [P3] open - Duplicated panel style constants have drifted

**File:** components/generator/BrandingPanel.tsx:28
**Found:** 2026-10-10 by /audit (scope: full; lens: quality)
**Why it matters:** `sectionTitle` is defined identically in `BrandingPanel.tsx:28`, `TicketHistory.tsx:13`, and `TicketForm.tsx:147`. `smallButton` is defined in both `BrandingPanel.tsx:29` and `TicketHistory.tsx:14`, and the copies have already drifted: only the history copy includes the `focus-visible:outline` accent ring. The branding panel's logo **Remove** button therefore falls back to the browser's default focus style, unlike the history buttons beside it.
**Suggested fix:** Move `sectionTitle` and `smallButton`, including the focus-visible ring, into one shared module under `components/generator/` and import them in all three panels. No current requirement would be lost.
**Resolution:**
