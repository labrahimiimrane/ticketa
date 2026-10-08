# Feature: QR code generation

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/qr-code-generation
**Status:** verified

## Goal

Generate a unique ticket identifier in the browser and show it on the ticket stub
as monospace text and as a scannable QR code that encodes exactly that ID. The ID
is created once after the page loads, survives form edits, and can be replaced
with a "New ticket ID" control.

## In scope

- Add the `qrcode` dependency and `@types/qrcode` dev dependency.
- `lib/ticket-id.ts`: ID generator with an injectable random source.
- `components/ticket/TicketQr.tsx`: renders a QR code for a string as inline SVG
  built from the library's module matrix.
- `Ticket` gains a `ticketId` prop. With an ID it shows the QR and ID text; with
  `null` it keeps the current dashed QR placeholder and "TICKET ID" text.
- `Generator` owns the ID: generates it after mount and offers a "New ticket ID"
  button in the stage, below the ticket.

## Out of scope

- Saving the ID or freezing it per exported ticket (5, 6, 9, 10).
- Any verification URL, page, or server lookup (later, not v1).
- Uniqueness checks against stored tickets. There is no store yet (10).
- Restyling the stub beyond replacing the placeholder contents.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits:
"disabled"`. Implement and verify each step, then present one feature-level
review packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] 1. **Dependencies and ID generator.** `npm install qrcode` and
  `npm install -D @types/qrcode`. Add `lib/ticket-id.ts` per Data / contracts.
  **Done when:** `npx tsc --noEmit` passes, and a one-off script (scratchpad, not
  committed, run with `node --experimental-strip-types`) shows:
  - 10,000 generated IDs all match the format regex;
  - no ID contains `0`, `O`, `1`, or `I`;
  - all 10,000 are distinct;
  - an injected fixed byte source yields the expected fixed ID.
- [x] 2. **QR rendering in the ticket.** Add `TicketQr` and the `ticketId` prop
  on `Ticket`.
  **Done when:** typecheck and `npm run lint` pass.
- [x] 3. **Generate and regenerate in `Generator`.** Hold `ticketId: string |
  null` (initially `null`), set it after mount, and add the "New ticket ID"
  button.
  **Done when:** lint, typecheck, and `npm run build` pass, and `/` is still
  prerendered as static (`○`). On the running app, checked with headless Chrome:
  - the stub shows an ID matching the format;
  - the QR, decoded in the page with the browser's `BarcodeDetector`
    (`qr_code`), equals the displayed ID;
  - typing in form fields keeps the same ID;
  - clicking "New ticket ID" changes both the text and the decoded QR to a new
    valid ID;
  - reloading produces a different ID;
  - no hydration or console errors are logged.
  If `BarcodeDetector` is unavailable in headless Chrome, record that and list a
  phone-scan check in the manual try path instead of claiming decode evidence.

## Files / areas

- `package.json`, `package-lock.json` - `qrcode`, `@types/qrcode`
- `lib/ticket-id.ts` - new
- `components/ticket/TicketQr.tsx` - new
- `components/ticket/Ticket.tsx` - `ticketId` prop, QR and ID in the stub
- `components/generator/Generator.tsx` - ID state, mount generation, button

## Data / contracts

Ticket ID format: `TKT-XXXX-XXXX`.

- Each `X` comes from the 32-character alphabet
  `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no `0`, `O`, `1`, `I`).
- 8 random characters give 40 bits.
- Regex: `^TKT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$`.

```ts
// lib/ticket-id.ts
export const TICKET_ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateTicketId(
  randomBytes: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b),
): string;
// Draws 8 bytes and maps each byte & 31 to the alphabet. Since 256 is a
// multiple of 32 there is no modulo bias. Returns "TKT-" + 4 chars + "-" + 4 chars.
```

- Uses `crypto.getRandomValues`, which works in insecure contexts; not
  `randomUUID`.
- Uniqueness is probabilistic (40 bits). No collision check, because no store
  exists yet. Feature 10 may add one.
- QR payload: exactly the ID string, nothing else. Error correction level `M`.
- `TicketQr` props: `{ value: string }`. Build the SVG from `QRCode.create(value,
  { errorCorrectionLevel: "M" }).modules` (`size` plus `get(row, col)`) as one
  `<path>` of 1x1 module squares in a `viewBox` with a 4-module quiet zone. Fill
  with `ticket-ink` and use `shape-rendering="crispEdges"`. Give it
  `role="img"` and `aria-label="QR code for ticket <id>"`. No
  `dangerouslySetInnerHTML`.
- `Ticket` props: `{ event: EventInfo; attendee: AttendeeInfo; ticketId: string
  | null }`. With an ID, the QR fills the existing 118px box (no dashed border)
  and the ID text replaces "TICKET ID" in the same monospace style, in
  `ticket-ink`. With `null`, the current placeholder renders unchanged.
- "New ticket ID" is a native `<button type="button">` styled with theme tokens
  (no new shadcn component). It sets a freshly generated ID. The ID is unrelated
  to form validity.

## Testing

No test command is configured, so there is no unit-test gate. `generateTicketId`
is logic; its evidence is the step 1 script. Once `/tests` adds a runner, it is
the first candidate for a unit test, through the `randomBytes` seam.

UI evidence: headless Chrome through the DevTools protocol (focus emulation on)
against a production server, either the user's current server or a temporary
`next start` on a spare port that is stopped afterward. Screenshots of the
placeholder-free stub with a real QR. Console errors are captured with
`Runtime.consoleAPICalled` and `Runtime.exceptionThrown`.

## Notes for the AI

- Next.js 16 with `cacheComponents`: random values must not run during
  prerender. Generate the ID only after mount. Read `node_modules/next/dist/docs/`
  for the current guidance on randomness in client components before choosing
  the pattern.
  - If `react-hooks` lint flags a synchronous `setState` in an effect, use the
    documented alternative rather than disabling the rule.
  - Keep `/` static.
- `Ticket` stays free of client-only APIs. Rendering the QR from a given `value`
  is pure, so the same markup renders in the export path.
- Check that `QRCode.create` is typed in `@types/qrcode`. If it is missing, add a
  minimal local type for the used members (`modules.size`, `modules.get`) in
  `TicketQr.tsx` rather than using `any`.
- Do not touch the untracked empty `components/ticket 2/` directory.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":6572,"specSha256":"393f09a36f8e68867afdb2ebed36c8b1069c55bd805f6977f1a287f0f609b199","branch":"refs/heads/feature/qr-code-generation","head":"daf21164bd92cb7321f6f4ae9660c69ef0a2a8da","baseRef":"refs/heads/main","baseCommit":"daf21164bd92cb7321f6f4ae9660c69ef0a2a8da","sourceTree":"6ec0c270fa959cc922c788e7295398f010a7387d","landing":"local-merge","absentOptional":[]} -->
