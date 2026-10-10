# Fix: README history wording

**Type:** Fix
**Status:** verified
**Branch:** fix/readme-history-wording
**Fixes:** F-04

## The problem

`README.md:42` says:

> **Ticket history.** Every exported ticket is saved locally, so you can reopen
> it, edit it, and export it again.

Since `fix: cap ticket history at 20` (`e5e5b5f`), `upsertTicket` keeps only the
newest `MAX_HISTORY_TICKETS = 20` (`lib/ticket-history.ts:23`) and removes the
oldest when a new ticket is added. The README promises unlimited history. See
F-04 in `blueprint/context/findings.md`.

No other README line describes how much history is kept: line 203 (Privacy)
only says history is stored in `localStorage`, which is still accurate.

## The fix

Replace only that bullet with:

> **Ticket history.** Your 20 most recent exported tickets are saved locally, so
> you can reopen them, edit them, and export them again. The oldest is removed
> when a new one is added.

Must not break: no other README content, no code, and no links or formatting
elsewhere in the file.

## Build steps

- [x] 1. **Update the history bullet.** Edit `README.md:42` only. **Done when:**
  - `git diff` shows a single changed line in `README.md`.
  - The new text says 20, matching `MAX_HISTORY_TICKETS` in
    `lib/ticket-history.ts`.
  - The README still renders as a list item. A local Markdown render shows the
    Features list with the same number of bullets.

## Verify

1. Open `README.md` and read the Features list. The Ticket history bullet
   mentions the 20 most recent tickets.
2. Confirm `MAX_HISTORY_TICKETS` is still `20` in `lib/ticket-history.ts`.

A docs-only change, so no build or browser check is needed beyond the render
check.

## Verification log

- `git diff --numstat README.md`: `1 1`, so line 42 was the only line changed.
- The new bullet says "20 most recent", matching
  `export const MAX_HISTORY_TICKETS = 20;` at `lib/ticket-history.ts:23`.
- Rendered with `marked` 12.0.2: the Features list has 11 bullets before and
  after, and the bullet renders as `<li><strong>Ticket history.</strong> Your 20
  most recent …`.
- Final gate: `npm run lint` passed, `npm run build` passed, and
  `npx tsc --noEmit` passed.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2196,"specSha256":"6fe844a34f6ece77b0c49e063d8a31448d4581a4ac773b8955d3f2e5d8df8617","branch":"refs/heads/fix/readme-history-wording","head":"7cb629d07ea9ed64549b6190d2f6e734a0279e60","baseRef":"refs/heads/main","baseCommit":"7cb629d07ea9ed64549b6190d2f6e734a0279e60","sourceTree":"b8a338363c9fd4b8b16f1db7e7678a34a791bd86","landing":"local-merge","absentOptional":[]} -->

## Findings

### readme-history-wording/F-02 [P2] closed - Ticket history grows without a cap and can fill localStorage

**File:** lib/ticket-history.ts:63
**Found:** 2026-10-10 by /audit (scope: full; lens: performance)
**Why it matters:** `upsertTicket` prepends every exported ticket, and nothing ever trims the list. Each entry stores its full branding, including the logo as a base64 data URL of up to about 342 KB. `ticketa:history` and `ticketa:state` share the origin's localStorage quota. That quota is browser-dependent and was not measured here, but at about 5 million characters, roughly 15 tickets with a maximum-size logo would fill it. After that, new tickets stop being saved to history ("Couldn't save this ticket to history.") and the draft autosave also starts failing ("Couldn't save your changes in this browser."). Both failures are caught and shown, so no existing data is lost, but saving degrades permanently until the user removes entries by hand. The overview's open question on logo storage flagged this risk.
**Suggested fix:** Cap the stored list in `upsertTicket`, for example by keeping the newest 20 entries. The cap is a product decision, because it silently drops the oldest tickets. Choose the number with the user before changing shipped behavior.
**Resolution:** Fixed on `fix/cap-ticket-history-at-20` (user chose 20): `upsertTicket` in `lib/ticket-history.ts` now keeps only the newest `MAX_HISTORY_TICKETS = 20` entries, so the list is trimmed on every export. Reading is unchanged, so an existing longer list is kept until the next export. Awaiting `/audit` re-review. Closed 2026-10-10 by /audit (scope: full; all lenses): `upsertTicket` (`lib/ticket-history.ts:66-72`) now ends with `.slice(0, MAX_HISTORY_TICKETS)`, and its only caller is `recordTicket` (`components/generator/use-ticket-history.ts`), so every history write from an export is capped at 20. `removeTicket` only shrinks the list, and `commit` still updates the cache only after a successful write. Re-reading confirmed the defect is gone with no new one: the newly recorded ticket is always at index 0, so the trim can never drop it.

### readme-history-wording/F-03 [P3] closed - Duplicated panel style constants have drifted

**File:** components/generator/BrandingPanel.tsx:28
**Found:** 2026-10-10 by /audit (scope: full; lens: quality)
**Why it matters:** `sectionTitle` is defined identically in `BrandingPanel.tsx:28`, `TicketHistory.tsx:13`, and `TicketForm.tsx:147`. `smallButton` is defined in both `BrandingPanel.tsx:29` and `TicketHistory.tsx:14`, and the copies have already drifted: only the history copy includes the `focus-visible:outline` accent ring. The branding panel's logo **Remove** button therefore falls back to the browser's default focus style, unlike the history buttons beside it.
**Suggested fix:** Move `sectionTitle` and `smallButton`, including the focus-visible ring, into one shared module under `components/generator/` and import them in all three panels. No current requirement would be lost.
**Resolution:** Fixed on `fix/shared-panel-styles`: `sectionTitle` and `smallButton` now live only in `components/generator/panel-styles.ts`, using the history copy with the focus-visible accent ring, and `BrandingPanel`, `TicketHistory`, and `TicketForm` import them. Awaiting `/audit` re-review. Closed 2026-10-10 by /audit (scope: full; all lenses): `sectionTitle` and `smallButton` are defined only in `components/generator/panel-styles.ts`, which uses the copy with the focus-visible accent ring. `BrandingPanel.tsx`, `TicketHistory.tsx`, and `TicketForm.tsx` import them, and every usage keeps its extra classes. Lint reports no unused imports. The defect is gone, and the repair adds no new one.
