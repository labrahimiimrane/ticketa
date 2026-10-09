# Fix: Reopen during export

**Type:** Fix
**Status:** verified
**Branch:** fix/reopen-during-export
**Fixes:** F-01

## The problem

The history **Reopen** buttons stay enabled while a PNG or PDF export is running.
`reopenTicket` in `components/generator/Generator.tsx` sets `exportState` back to
`idle`, which re-enables both Download buttons while the first `fetch` is still
pending. A second export can then start at the same time. Whichever request
settles first overwrites the other's state:

- the buttons are re-enabled while the second request is still running, or
- a late "Couldn't create the PNG" error appears against the reopened ticket.

The history snapshot itself stays correct, because it is captured before the
fetch.

## The fix

Disable the history **Reopen** buttons while an export is running. This is the
smallest option from the finding, and it addresses both symptoms: a reopen can't
reset the in-flight state, and a late error can't land on a different ticket.

- Pass an `exporting` boolean from `Generator` to `TicketHistory`
  (`exportState.status === "exporting"`).
- In `TicketHistory`, set `disabled={exporting}` on each Reopen button. Give the
  buttons the same disabled styling the header Download buttons use
  (`disabled:cursor-wait disabled:opacity-70`).
- Leave `reopenTicket` as it is: resetting the export state stays correct for
  reopens that happen while no export is running.

Must not break:

- **Remove** stays enabled during an export. It doesn't touch the export state.
- When no export is running, reopen behaves as before: the form, template,
  branding and ticket ID are restored, the error state is cleared, and the
  "Reopened ticket" announcement still plays.
- Reopen remains enabled again after an export finishes, whether it succeeds
  or fails.

## Build steps

1. [x] Add an `exporting` prop to `TicketHistory` and disable Reopen while it is
   true. Pass it from `Generator`.
   **Done when:** while an export is in flight, each Reopen button is disabled
   and dimmed, and Remove still works. After the export succeeds or fails,
   Reopen works again. `npm run lint` and `npm run build` pass.

## Verify

- `npm run lint` and `npm run build`. No test runner or Verify command is
  configured.
- Manual:
  1. Run `npm run dev` and make sure the history has at least one ticket.
  2. Throttle the network in DevTools (for example, Slow 3G) and click
     **Download PDF**.
  3. While it shows "Exporting…", confirm every **Reopen** button is disabled
     and **Remove** is still clickable.
  4. When the download finishes, click **Reopen** and confirm the ticket loads.
  5. Repeat with the export forced to fail (for example, offline): after the
     error appears, Reopen works and clears the error.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2766,"specSha256":"6cf0aaa1030e6e3e5a658d208fb2de9a3cf6da646779c6534325dc934c98305a","branch":"refs/heads/fix/reopen-during-export","head":"c5442cd7038079490f6662c3329d94de615634b4","baseRef":"refs/heads/main","baseCommit":"c5442cd7038079490f6662c3329d94de615634b4","sourceTree":"304fe8f083cab85e5a29cd9399b975046c6207b1","landing":"local-merge","absentOptional":[]} -->
