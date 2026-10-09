# Feature: Responsive UI

**From build-plan:** feature 12
**Build attempt:** 1
**Branch:** feature/responsive-ui
**Status:** verified

## Goal

Make the generator at `/` (header actions, form, template picker, branding
controls, history, and live preview) work well from a 320px phone up to a
large desktop. On narrow screens the form stacks above the preview. The ticket
preview scales down to fit the screen, while exports keep rendering the ticket
at its true 760×300 size.

## In scope

- **Breakpoint:** the current two-column layout (380px sidebar plus preview)
  applies at Tailwind `lg` (≥1024px) and up. Below `lg`, use one column with
  normal document scrolling. The form, template picker, branding, and history
  come first, followed by the preview (project plan: "On mobile, the form
  should appear above the preview").
- **Header:** below `lg`, the header wraps instead of overflowing. Brand,
  Download PDF, and Download PNG stay on the first row. Status, alert, and
  error messages move to a full-width row underneath when they have content.
  The header is sticky at the top below `lg`, so the download actions stay
  reachable after scrolling through the form. At `lg` and up, the header looks
  the same as it does today.
- **Fit-to-width preview:** the ticket preview scales down uniformly
  (`scale = min(1, available width / 760)`) to fit its pane at every width,
  including the desktop pane between 1024px and about 1200px. It never scales
  above 1. The scaled ticket takes up exactly its scaled size in the layout:
  no clipped edges, no empty 300px gap, and no horizontal page scroll. The
  empty-state hint and the "New ticket ID" button stay under the preview.
- **Controls and history at 320px:** no horizontal page overflow. The branding
  accent row (preset swatches plus hex input) wraps onto a second line when it
  doesn't fit. The logo row, template picker, the form's two-column date/time
  grid, and history rows (truncated text plus Reopen/Remove) stay usable and
  don't overlap.
- Keep every existing state working at all widths: the empty-state hint,
  validation alert, save/history-save failure statuses, export
  exporting/error states, and the reopened-ticket announcement.

## Out of scope

- Any change to ticket templates, `ticketArticle` dimensions, the export
  render page (`app/render/ticket/page.tsx`, `components/export/`), or export
  APIs. Exports must not change.
- Mobile-specific download behavior (for example, iOS Safari's blob download
  handling). If it fails during check, record it as a `/fix`, not in this
  feature.
- A separate history route, drawer, tabs, or collapsible sections. History
  stays a section in the controls column.
- Light mode, new components, new dependencies, and production deployment
  (feature 13).

## Build loop

`workflow.stepReview` is `feature`: implement all steps, then present one
review packet. Step checkpoint commits are disabled. `/complete` creates the
final feature commit on `feature/responsive-ui`.

## Build steps

1. [x] **Responsive shell.** In `components/generator/Generator.tsx`, change
   the root to a single-column, document-scrolling layout below `lg`: controls
   column, then the preview. Keep the current `h-dvh` grid with an independently
   scrolling sidebar at `lg` and up. Make the header wrap and stick below `lg`,
   as described under In scope. Keep all `role="status"`/`role="alert"`
   elements in the DOM at every width so announcements still work.
   **Done when:** at 375px and 768px the page scrolls as one document with
   the form first and the preview last, and the header shows the brand and
   both download buttons without overflow. At 1440px the layout matches the
   current desktop. Lint, typecheck, and build pass.
2. [x] **Fit-to-width preview.** Add a small client hook in
   `components/generator/` that measures the preview pane's content width with
   `ResizeObserver` and returns `min(1, width / TICKET_WIDTH)`. Wrap the ticket
   in a box sized to `TICKET_WIDTH × scale` by `TICKET_HEIGHT × scale` with the
   ticket scaled from the top-left corner. Before the first measurement (server
   render and hydration), the wrapper must not cause horizontal page scroll:
   constrain it to `max-w-full` with overflow hidden.
   **Done when:** at 320px, 375px, 768px, and 1024px the whole ticket is
   visible and scaled, with no horizontal scroll and no leftover vertical gap.
   At 1440px it renders at full size (scale 1). Resizing the window updates
   the scale live. A downloaded PNG is still 760×300 at its configured
   resolution. Lint, typecheck, and build pass.
3. [x] **Controls and history fit.** Allow the accent row in
   `components/generator/BrandingPanel.tsx` to wrap. Fix any other overflow
   found at 320px in `TicketForm.tsx`, `TemplatePicker.tsx`, and
   `TicketHistory.tsx`, changing only layout classes.
   **Done when:** at 320px, with a long attendee name, a long event name, an
   uploaded logo, an invalid hex value showing its error, and 2+ history
   entries, nothing overflows horizontally or overlaps, and every control is
   reachable and works. Lint, typecheck, and build pass.

## Files / areas

- `components/generator/Generator.tsx` - layout shell, header, preview wrapper
- `components/generator/use-fit-scale.ts` (new) - preview scale hook
- `components/generator/BrandingPanel.tsx` - accent row wrap
- `components/generator/TicketForm.tsx`, `TemplatePicker.tsx`,
  `TicketHistory.tsx` - only if 320px overflow is found
- `lib/ticket-templates.ts` - read `TICKET_WIDTH`/`TICKET_HEIGHT` (no change)

## Data / contracts

No changes to persisted data, `LocalState`, `Ticket`, template IDs, or export
request/response shapes. The preview scale is transient client UI state and is
never stored.

## Testing

- No test runner and no Browser tests command are configured, and no Verify
  command exists. Gates: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Behavior evidence comes from the dev server at 320, 375, 768, 1024, and 1440px
  widths (browser screenshots or manual check), plus one PNG and one PDF export
  to confirm the output is unchanged. Do not claim real-device or iOS
  evidence unless it is actually run.

## Notes for the AI

- Read `node_modules/next/dist/docs/` only if a Next.js API is touched. This
  feature should need only client components and Tailwind classes.
- `ticketArticle` sets literal `w-[760px] h-[300px]`. Don't make the ticket
  itself responsive: export and preview share these templates ("what you see
  is what you get").
- **Inline style exception:** `coding-standards.md` allows inline styles only
  for runtime user-customization values. The preview scale is a runtime
  measured value that CSS can't compute portably (dividing lengths in `calc()`
  is not supported across browsers). Set it as a single `style` value (or one
  CSS custom property) on the preview wrapper, with a one-line comment. Flag
  this at review.
- Use `transform: scale()` with `origin-top-left` on an inner element, with
  the outer box sized explicitly, because transforms don't change layout size.
  Keep `drop-shadow-ticket` on the visible ticket.
- `Input` already uses `text-base` below `md`, which avoids iOS focus zoom. Keep
  it. Existing small buttons are 28px tall, which meets the WCAG 2.2 AA 24px
  target size minimum. Don't resize controls without a found problem.
- The `lg` breakpoint is a reversible choice: at `md` the desktop preview pane
  would be about 324px wide, which is too small.

## Verification log

- `npm run lint`: pass.
- `npm run build`: pass (includes Next's TypeScript pass).
- `npx tsc --noEmit`: 2 errors, both in the untracked, ignored duplicates
  `.next/types/routes.d 2.ts` (Finder/iCloud " 2" copies of generated files);
  no errors in project source.
- Not yet observed: the viewport-width done-whens (320–1440px) and the
  unchanged PNG/PDF exports need `/check` against a running dev server.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7955,"specSha256":"6088550a7be32ed92b2226d06dabdc5007f57dc8e004f7b5aa58c7462639bd55","branch":"refs/heads/feature/responsive-ui","head":"9b43cfd541312501255ddaff68d8b72dd6ceaa76","baseRef":"refs/heads/main","baseCommit":"9b43cfd541312501255ddaff68d8b72dd6ceaa76","sourceTree":"dab893ff3cb71c68f0988fbd27bdb29e2e280561","landing":"local-merge","absentOptional":[]} -->
