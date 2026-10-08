# Coding Standards

> Tuned by `/onboard` for Ticketa: Next.js 16 App Router, React 19, TypeScript,
> Tailwind v4, npm. Edit freely as real conventions emerge.

## TypeScript

- Strict mode enabled (`tsconfig.json`)
- No `any` types - use proper typing or `unknown`
- Define types for props and data models (event, attendee, ticket, template)
- Use type inference where obvious, explicit types where helpful
- Import from the project root with the `@/` alias (`@/components/...`)

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Next.js

- Next.js 16 differs from older versions. Read the relevant guide in
  `node_modules/next/dist/docs/` before using an unfamiliar API.
- `cacheComponents` and `partialPrefetching` are enabled in `next.config.ts`.
  Account for Cache Components semantics when adding data fetching or dynamic
  APIs.
- Server components by default; use `'use client'` only for interactivity,
  hooks, or browser APIs (the ticket form, live preview, and `localStorage` are
  client-side)
- v1 has no accounts or database. Add a Route Handler only when a server-side
  need is real (for example PNG/PDF rendering)

> TODO: The build plan mentions Puppeteer for PNG/PDF rendering. Settle the
> export approach (client-side vs Route Handler) in the PNG export feature spec.

## File Organization

There is no `src/` directory. The App Router lives in `app/`.

- Pages and layouts: `app/[route]/page.tsx`
- Route Handlers: `app/api/[name]/route.ts`
- Components: `components/[feature]/ComponentName.tsx`
- Types: `types/[feature].ts`
- Lib/Utils: `lib/[utility].ts`
- Static assets: `public/`

> TODO: No components exist yet. Confirm this layout with the first feature.

## Naming

- Components: PascalCase (`TicketPreview.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS v4 for all styling, loaded through the `@tailwindcss/turbopack`
  loader rule in `next.config.ts` (there is no PostCSS config)
- CSS-first config: theme tokens live in `@theme` in `app/globals.css`; there is
  no `tailwind.config.js`
- Ticket templates share theme tokens (CSS variables) so colors stay
  customizable per ticket
- No inline styles, except values that come from user customization at runtime
  (for example a chosen ticket color)
- Fonts load with `next/font` (Geist is configured in `app/layout.tsx`)

## Data and Persistence

- v1 is browser-only: settings, latest form values, and ticket history live in
  `localStorage`
- Treat stored data as untrusted: parse it defensively and fall back to defaults
  when it is missing or malformed
- Guard browser-only APIs so they never run during server rendering

## Validation and Error Handling

- Validate form input at the boundary (required fields, date/time, email
  format, uploaded logo type and size)
- Show inline, user-friendly validation messages next to the field
- Export failures should surface a clear message, never fail silently

> TODO: No validation library is installed. Add one (such as Zod) only when a
> feature needs it.

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, ticket id builders, storage parsing. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding: this TypeScript app would use Vitest, `vi.mock()` for external
dependencies, and `vi.useFakeTimers()` for time-dependent logic. No runner is
installed yet, so the test gate is off.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/tests browser`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
