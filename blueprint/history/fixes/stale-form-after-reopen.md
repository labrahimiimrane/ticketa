# Fix: Stale form after reopen

**Type:** Fix
**Status:** verified
**Branch:** fix/stale-form-after-reopen

## The problem

After **Reopen** on a history ticket, a stale second copy of the ticket form
stays on the page above the reopened one. The page then holds duplicate field IDs
(`#field-event-name` and the rest), so labels, `aria-describedby`, and the
"focus the first invalid field" behavior can target the stale copy.

Cause: in `components/generator/Generator.tsx`, `TicketForm` and `BrandingPanel`
are siblings in the same `<aside>`, and both use `key={reopenCount}`. Sibling
keys must be unique. With duplicate keys, React cannot reconcile the remount that
the key change is meant to trigger, so it leaves an old instance behind.

Seen on 2026-10-10 while verifying feature 14 (headless Chrome against local
production). After one Reopen, `document.querySelectorAll("#field-event-name")`
returned 2 elements. The same code was already on `main` before feature 14.

## The fix

Give the two siblings distinct keys that still change on every reopen, for
example `key={`form-${reopenCount}`}` and `key={`branding-${reopenCount}`}`.
Each panel still remounts fresh on reopen, which is what the existing comment
("Remounts the form and branding panels on reopen so their local state starts
fresh") intends.

Must not break:
- Reopen still loads the ticket's event, attendee, template, branding, and ID.
- Form touched state and the branding panel's local state (logo error, color
  draft) reset on reopen.
- Reopen stays disabled during an in-flight export (fix `reopen-during-export`).

No new abstraction, dependency, or state.

## Build steps

- [x] 1. **Unique sibling keys.** Change the two `key` props in
  `components/generator/Generator.tsx` as above. **Done when:** on local
  production (`npm run build`, then the user's `npm run start`), reopening a
  history ticket twice leaves exactly one `#field-event-name` and one branding
  panel. The form shows the reopened ticket's values, the browser console
  has no "Encountered two children with the same key" warning, and
  `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.

## Verify

1. Export one ticket so it appears in History, change the event name, then click
   **Reopen** on the history entry, and do it a second time.
2. Expect one Event section and one Attendee section in the sidebar, with the
   reopened ticket's values, and one Branding section.
3. Clear a required field and click Download PNG: focus moves to that visible
   field and its error shows next to it.
4. Start an export and confirm Reopen is disabled until it finishes.

No test runner is configured, so this is verified with the build plus a headless
browser check of the DOM and console. This is a UI-only change.

## Verification log

- `npx tsc --noEmit` passed, `npm run lint` passed, `npm run build` passed.
- Local production (the user restarted `npm run start` after the build), headless
  Chrome via the `puppeteer` dev package, with one seeded history ticket
  (`TKT-QLDX-2345`, "History Event", attendee "Old Guest"):
  - Initial load: 1 `#field-event-name`; sidebar sections Event, Attendee,
    Branding, History.
  - After typing into Event name, then Reopen twice: still exactly 1
    `#field-event-name` and one Branding section each time; the form showed
    "History Event" / "Old Guest".
  - Clearing Attendee name and clicking Download PNG: "Fix 1 field before
    downloading.", focus moved to `field-attendee-name`, `aria-invalid="true"`,
    `aria-describedby` pointed to "Enter the attendee's name".
  - Browser console: no warnings or errors (no duplicate-key warning).
- Not re-run: Reopen staying disabled during an export (Verify item 4). That code
  path is unchanged by this diff.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":3767,"specSha256":"8cccaf4c9771c765e7533a74138cbb7d8b48f2c3c37d80b0aa13dfa216d595b6","branch":"refs/heads/fix/stale-form-after-reopen","head":"333867d55281f759be9eed1817d853ddf155e705","baseRef":"refs/heads/main","baseCommit":"333867d55281f759be9eed1817d853ddf155e705","sourceTree":"9fa13e05c5a9a6a8e28cfbc563c473006477c3d5","landing":"local-merge","absentOptional":[]} -->
