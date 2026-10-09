# Feature: Local persistence

**From build-plan:** feature 9
**Build attempt:** 1
**Branch:** feature/local-persistence
**Status:** verified

## Goal

Reopening or reloading the generator restores the user's latest event and
attendee values, selected template, and branding (logo and accent color) from
browser `localStorage`, with no account. Missing, malformed, or unavailable
storage never breaks the generator; it falls back to today's defaults.

## In scope

- One versioned `localStorage` record holding `lastEvent`, `lastAttendee`,
  `branding`, and `selectedTemplateId` (the overview's `LocalState`, minus
  `history`).
- Defensive restore: each section is parsed independently and falls back to its
  default when missing or malformed, so a bad logo does not discard the form.
- Saving after every change to the form, template, or branding.
- Restoring without a hydration mismatch and without overwriting saved data with
  defaults during the first render.
- A non-blocking status message when saving fails (storage disabled, private
  mode, or quota exceeded).

## Out of scope

- Ticket history and the `history` field (feature 10).
- Persisting the ticket ID; each page load still gets a fresh ID.
- Persisting transient UI state: touched fields, `showAllErrors`, export status,
  logo error, typed-but-invalid hex text, and the uploaded logo's file name and
  size.
- A "clear saved data" control, cross-tab sync (`storage` events), and
  migration of other versions. Clearing site data is the reset path, per the
  overview's usage model.
- Validation messages, date formatting, and other input polish (feature 11).

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`: implement all steps below, run the checks after each, then present
one review packet for the whole feature. No checkpoint commits; `/complete`
creates the final feature commit.

## Build steps

- [x] 1. **Storage parsing and access** - Add `lib/local-state.ts` with the
  `LocalState` type, the storage key, defaults, a Zod restore schema per section
  (see Data / contracts), `parseLocalState(raw: string | null): LocalState`
  (pure, never throws), `readLocalState(): LocalState` and
  `writeLocalState(state): boolean` (both wrap every `localStorage` access in
  `try/catch`; `write` returns `false` on any failure).
  **Done when:** the module typechecks, nothing imports it yet, and
  `npx tsc --noEmit` and `npm run lint` pass.

- [x] 2. **Restore on load** - Add a client hook in
  `components/generator/use-saved-state.ts` that follows the
  `use-ticket-id.ts` pattern: `useSyncExternalStore` with a server snapshot of
  `null` and a client snapshot that calls `readLocalState()` once and caches the
  result at module level (stable reference). Make `Generator` take an
  `initialState: LocalState` and a `restored: boolean` prop and seed its
  `values`, `templateId`, and `branding` state from `initialState`. Move the
  page body into a small client wrapper (in `Generator.tsx`) that renders
  `<Generator key={saved ? "restored" : "default"} initialState={saved ?? DEFAULT_LOCAL_STATE} restored={saved !== null} />`,
  so the server render and hydration use defaults and the client remounts once
  with restored values. This remount also re-seeds `BrandingPanel`'s local
  `hexText` state, which is initialized from props only at mount.
  **Done when:** with a valid record written manually in DevTools, a reload
  shows the saved event, attendee, template, logo, and accent in both the form
  controls (including the hex text field) and the preview; with no record,
  malformed JSON, or a record with one invalid section, the page loads with
  defaults for the bad parts only; there is no hydration warning in the
  console; `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.

- [x] 3. **Save on change and failure status** - In `Generator`, add an effect
  that calls `writeLocalState` whenever `values`, `templateId`, or `branding`
  change, only when `restored` is true (so the default-state hydration render
  never overwrites saved data). Track the last write result; when it fails,
  show "Couldn't save your changes in this browser." in a polite status region
  in the header, and clear it after the next successful write. Keep it
  separate from the existing export error so neither hides the other.
  **Done when:** typing in the form, switching templates, uploading or
  removing a logo, and changing the accent all survive a reload; removing the
  logo and reloading shows no logo; with storage blocked (for example a
  DevTools override that makes `setItem` throw), editing shows the save
  message and the generator, preview, and export still work;
  `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.

## Files / areas

- `lib/local-state.ts` (new) - type, key, defaults, restore schema, parse,
  read, write.
- `components/generator/use-saved-state.ts` (new) - client restore hook, plus
  `saveState`/`useSaveFailed` so the save effect reports failures through a
  subscribed store (the React lint rule forbids `setState` inside an effect).
- `components/generator/Generator.tsx` - `initialState`/`restored` props, save
  effect, save-failure status, client wrapper that keys the remount.
- `app/page.tsx` - render the wrapper instead of `Generator` if the wrapper is
  exported under a new name.
- Reused unchanged: `lib/branding.ts` (`brandingSchema`, `DEFAULT_BRANDING`),
  `lib/ticket-templates.ts` (`TEMPLATE_IDS`, `DEFAULT_TEMPLATE_ID`),
  `components/generator/TicketForm.tsx` (`TicketFormValues`), `types/ticket.ts`.

## Data / contracts

Persisted in the browser only; no server or API change.

- **Key:** `ticketa:state`. Feature 10 stores history under its own key, so
  typing never re-serializes the history list.
- **Value:** JSON

  ```json
  {
    "version": 1,
    "lastEvent": { "name": "", "date": "", "time": "", "location": "", "organizer": "" },
    "lastAttendee": { "name": "", "email": "" },
    "branding": { "logo": null, "colors": { "accent": "#8B5CF6" } },
    "selectedTemplateId": "classic"
  }
  ```

- **Restore rules** (stored data is untrusted):
  - Missing key, unreadable storage, invalid JSON, a non-object, or
    `version !== 1` returns `DEFAULT_LOCAL_STATE`.
  - `lastEvent` and `lastAttendee` are drafts, not finished tickets: restore
    any object whose fields are strings, even when they fail
    `eventInfoSchema`/`attendeeInfoSchema`, so a half-filled form comes back as
    typed. A missing or non-string field becomes `""`. Otherwise the section
    falls back to the empty values in `Generator`'s current `EMPTY_VALUES`
    (move that constant into `lib/local-state.ts`).
  - `branding` must pass the existing `brandingSchema` (logo data URL type and
    256 KB limit, `#RRGGBB` accent); otherwise `DEFAULT_BRANDING`.
  - `selectedTemplateId` must be one of `TEMPLATE_IDS`; otherwise
    `DEFAULT_TEMPLATE_ID`.
  - Unknown extra fields are ignored and dropped on the next write.
- **Write:** the whole record, `JSON.stringify` of the current state with
  `version: 1`. Any thrown error (including `QuotaExceededError` and
  `SecurityError`) is caught and reported as a failed write.
- **Rendering:** restored strings render through the existing React text
  bindings and inputs; the logo renders through the existing `next/image`
  `src` only after passing `brandingSchema`. No `dangerouslySetInnerHTML`.

## Testing

No test runner is configured, so there are no automated logic tests in this
feature. `parseLocalState` is kept pure so it can get unit tests once `/tests`
adds a runner.

Per step: `npx tsc --noEmit` and `npm run lint`; `npm run build` for steps 2
and 3. Behavior is proven manually in the running app (or later by `/check`):
restore of every field, defaults for each malformed section, no hydration
warning, save-failure message with storage blocked, and PNG/PDF export still
working after a restore. Do not claim browser evidence that was not run.

## Notes for the AI

- Baseline at spec time: `npx tsc --noEmit` and `npm run lint` pass. No
  `Verify` command exists.
- Never touch `localStorage` during render on the server. All access goes
  through `readLocalState`/`writeLocalState`, which only run in the client
  snapshot and in effects.
- The `useSyncExternalStore` client snapshot must return the same object
  reference on every call, or React re-renders forever; cache it like
  `use-ticket-id.ts` does. `subscribe` can be a no-op that returns a no-op
  cleanup.
- Keep the restore schema separate from the export schema: export still
  requires fully valid fields and rejects drafts.
- A restored logo shows the panel's generic "PNG, JPEG, WebP, or SVG up to
  256 KB" hint instead of a file name; that is expected, since the file name is
  not stored.
- The brief default-to-restored remount happens once, right after hydration,
  before the user can interact. Do not add a loading screen for it.
- Check `node_modules/next/dist/docs/` if the client wrapper interacts with
  Cache Components prerendering of `/` (it should not, since all storage
  access is client-only).


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9134,"specSha256":"4103a8a0cb093e0716d8b5c7ba6407ba0358aca680232f8271d79ea57661c6b0","branch":"refs/heads/feature/local-persistence","head":"1989f48c4e4148817b1b04ab0ac05012e78a9161","baseRef":"refs/heads/main","baseCommit":"dd8139ab4389f67e9b1062d83df29ee8852cac88","sourceTree":"c4be52924de05c9b967617121342c87d98afb4bf","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 1989f48c4e4148817b1b04ab0ac05012e78a9161
**Base commit:** dd8139ab4389f67e9b1062d83df29ee8852cac88
**Base ref:** refs/heads/main
**Spec hash:** 4103a8a0cb093e0716d8b5c7ba6407ba0358aca680232f8271d79ea57661c6b0
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-09T22:47:23Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-09T22:48:23Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm run build`: pass (`/` prerendered as static)
- Test command: unavailable (no test runner configured)
- Verify command: unavailable (not defined)

### Evidence

- Freshness: `HEAD` equals Target commit; merge base of `refs/heads/main` and target equals Base commit; spec SHA-256 matches; only `blueprint/context/review.md` differed from the target; spec is tracked, so no snapshot applies.
- Delta reviewed in full: `lib/local-state.ts`, `components/generator/use-saved-state.ts`, `components/generator/Generator.tsx`, and `blueprint/context/current-feature.md`; context read from `lib/branding.ts`, `types/ticket.ts`, `lib/ticket-templates.ts`, `components/generator/use-ticket-id.ts`, `components/generator/BrandingPanel.tsx`, and `app/page.tsx`.
- Spec contract: key `ticketa:state`, version 1 gate, per-section fallback, draft strings coerced to `""`, `brandingSchema` and `TEMPLATE_IDS` validation, and `try/catch` around every storage access all match the Data / contracts section.
- Hydration: server snapshot `null` renders defaults; the cached client snapshot keeps a stable reference; the `key` remount re-seeds `BrandingPanel` hex text; the save effect is gated on `restored`, so defaults never overwrite saved data.
- Security: restored text renders through React bindings; the restored logo reaches `next/image` only after the existing data-URL type and 256 KB check; no `dangerouslySetInnerHTML` and no server or API change.

### Findings

- None

### Remaining risk

- No test runner or Verify command exists, so `parseLocalState` has no automated unit tests.
- Browser behavior (restore, malformed-section fallback, no hydration warning, save-failure message with storage blocked, export after restore) was not exercised in this review; Check was not required.
- Unverified performance note: every keystroke synchronously re-serializes and writes the whole record, including a logo data URL of up to about 350 KB; not profiled.
- A stored record with a different `version` is replaced by defaults on the first save, as the spec's out-of-scope migration rule implies.
