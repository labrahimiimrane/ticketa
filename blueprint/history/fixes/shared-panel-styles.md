# Fix: Shared panel styles

**Type:** Fix
**Status:** verified
**Branch:** fix/shared-panel-styles
**Fixes:** F-03

## The problem

Two Tailwind class-string constants are copied across the generator panels, and
the copies have already drifted:

| Constant | Defined in | Difference |
| --- | --- | --- |
| `sectionTitle` | `BrandingPanel.tsx:28`, `TicketHistory.tsx:13`, `TicketForm.tsx:147` | Identical |
| `smallButton` | `BrandingPanel.tsx:29`, `TicketHistory.tsx:14` | Only the history copy has `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent` |

Because of the drift, the branding panel's logo **Remove** button
(`BrandingPanel.tsx:138`) shows the browser's default keyboard focus style, while
the history panel's Reopen and Remove buttons show the app's accent focus ring.
See F-03 in `blueprint/context/findings.md`.

## The fix

- Add `components/generator/panel-styles.ts` exporting `sectionTitle` and
  `smallButton`. Use the history panel's `smallButton`, which includes the
  focus-visible accent ring.
- In `BrandingPanel.tsx`, `TicketHistory.tsx`, and `TicketForm.tsx`, delete the
  local constants and import the shared ones. Usage sites keep their existing
  extra classes unchanged:
  - BrandingPanel's upload `<label>` keeps its `has-focus-visible:outline-2
    has-focus-visible:outline-accent`. A `<label>` is not focusable, so the
    added `focus-visible:` classes never apply to it.
  - The history Reopen button keeps `disabled:cursor-wait disabled:opacity-70`.

Must not break:
- Every section heading and small button renders with the same classes as
  today. The one intended change is the focus ring on the branding **Remove**
  button.
- No behavior, markup, or accessibility attributes change.

Out of scope: TemplatePicker's `legend` heading (it has its own layout classes)
and the header Download and "New ticket ID" buttons.

## Build steps

- [x] 1. **Extract the shared constants.** Create
  `components/generator/panel-styles.ts` and switch the three panels to it.
  **Done when:**
  - `grep` finds `const sectionTitle` and `const smallButton` only in
    `panel-styles.ts`.
  - `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
  - On local production (`npm run start`, restarted after the build), in
    headless Chrome with a saved logo and one history ticket:
    - The Event, Attendee, Branding, and History headings have the same class
      list as before.
    - Tabbing to the branding **Remove** button gives it a computed
      `outline-style: solid` with the accent color, matching the history
      Remove button.
    - The upload label and Reopen button keep their extra classes.

## Verify

1. Upload a logo, then press Tab until the logo's **Remove** button is focused.
   It shows the same purple focus ring as the History buttons.
2. The sidebar headings and small buttons look unchanged.

No test runner is configured. This is a styling-only change, so verification is
the static checks plus a headless-browser check of classes and computed focus
styles.

## Verification log

- `grep -rn "const sectionTitle\|const smallButton" components` matched only
  `components/generator/panel-styles.ts`.
- `npm run lint` passed and `npm run build` passed (12:04:41). After the build,
  `npx tsc --noEmit` passed.
- Local production (`npm run start` restarted at 12:05:06), headless Chrome via
  the `puppeteer` dev package, with a saved 1×1 PNG logo and one history ticket:
  - The Event, Attendee, Branding, and History `h2` class lists equal the old
    literal `sectionTitle` string.
  - Keyboard Tab to the branding **Remove** button: `:focus-visible` matched,
    with `outline: solid 2px rgb(139, 92, 246)` and `outline-offset: 2px`. This
    is identical to the history **Remove** button reached the same way.
  - The upload label still has `has-focus-visible:outline-2
    has-focus-visible:outline-accent`. Reopen still ends with
    `disabled:cursor-wait disabled:opacity-70` on the unchanged base string.
    The history Remove class equals the old history `smallButton` exactly.
  - Browser console: no warnings or errors.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":4132,"specSha256":"a5518abb4ee79255235ed1d1a639397bdcf0aeb60004730fdbb9fc995a715738","branch":"refs/heads/fix/shared-panel-styles","head":"e5e5b5f881e9ab7dc79486f6d030b4623f654fea","baseRef":"refs/heads/main","baseCommit":"e5e5b5f881e9ab7dc79486f6d030b4623f654fea","sourceTree":"703abcafe7624448ba6eb5210d93e37cd3721ea4","landing":"local-merge","absentOptional":[]} -->
