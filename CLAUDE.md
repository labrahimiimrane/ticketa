# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Agent instructions for this project live in **AGENTS.md** (shared across AI coding
tools). Blueprint skills load planning context, coding standards, and the active
spec only when the current command needs them.

## Stack notes

- Next.js 16 App Router (`app/`), React 19, TypeScript, no test runner yet.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`; account for
  Cache Components semantics when adding data fetching or dynamic APIs.
- Tailwind v4 is loaded through a Turbopack CSS loader rule in `next.config.ts`
  (`@tailwindcss/turbopack`), not PostCSS. There is no `postcss.config`.

@AGENTS.md
