# Ticketa - Project Overview

<!-- blueprint:source-hash f9ac73623eab51dfbf64c8797381d291b483ca6833375bffbd48f38fdefddbb8 -->

> Turn event and attendee details into a polished, customizable event ticket in
> seconds, with a live preview and PNG/PDF export. No account required.

## Problem

Making professional event tickets usually means Canva, Photoshop, or hand-editing
a template per attendee: slow, repetitive, and error-prone. Ticketa generates a
print-ready ticket from a short form. v1 goal: make the full generation flow fast,
simple, and usable without an account.

## Users

- **Primary** - event organizers, workshop and conference organizers, meetup and
  community hosts, small businesses running events.
- **Secondary** - freelancers making tickets for clients, schools and training
  centers, event agencies.
- Typical need: a small number of professional tickets, quickly, without a design
  tool. Single access tier: anonymous, no accounts in v1.

## Usage model

- Individual users, small-scale generation. No bulk generation in v1.
- Internet-facing, local-first, no accounts.
- Each browser/device keeps its own history; clearing site data removes all
  saved tickets and settings.
- No sensitive data required for the core flow.
- Not required in v1: multi-user collaboration, server-side ticket verification,
  bulk generation.

## Features

In build-plan order. Headline feature: **3. Live ticket preview** with
**5/6. PNG and PDF export** (what you see is what you download).

1. **Ticket template** - first professional, themeable template with event,
   attendee, organizer, and QR placeholders.
2. **Event and attendee form** - inputs for event details and attendee info, with
   validation.
3. **Live ticket preview** - form data bound to the template, updating instantly.
4. **QR code generation** - unique ticket identifier rendered as a QR code on the
   ticket.
5. **PNG export** - high-resolution PNG download.
6. **PDF export** - print-ready PDF with correct dimensions and margins.
7. **Template system** - multiple designs sharing one theme system, plus a
   template picker.
8. **Brand customization** - logo upload, organizer information, custom colors.
9. **Local persistence** - settings, latest form values, and selected template in
   `localStorage`.
10. **Ticket history** - store generated tickets locally; reopen and regenerate.
11. **Input polish** - date/time formatting, validation messages, long-name
    handling, empty states, other UX polish.
12. **Responsive UI** - generator, preview, customization, and history tuned for
    mobile and desktop.
13. **Production deployment** - deploy to Render and verify PNG/PDF rendering in
    production.
14. **Production hardening** - Puppeteer memory, rendering concurrency, error
    handling, production config.

**Later (not v1):** user accounts, ticket verification pages, CSV bulk
generation, cloud storage, teams/organizations, Stripe billing.

## Data model

No server database in v1. Static data ships with the app; user data lives in
browser `localStorage`. Exported PNG/PDF files are generated on demand and
downloaded, never stored.

### EventInfo (feature 2)

- `name` (string, required)
- `date` (string, ISO date, required)
- `time` (string, `HH:mm`, required)
- `location` (string, required)
- `organizer` (string, required)

### AttendeeInfo (feature 2)

- `name` (string, required)
- `email` (string, optional, validated when present)

### Branding (feature 8)

- `logo` (string | null) - uploaded image, stored locally (data URL)
- `organizerName` (string) - see Open questions on overlap with `EventInfo.organizer`
- `colors` (object) - customizable ticket colors, at minimum an accent

### TicketTemplate (static, features 1 and 7)

- `id` (string) - stable key, referenced by saved tickets
- `name` (string) - shown in the picker
- `width`, `height` (number) - ticket dimensions used by preview and export
- Shares the theme variables defined in `prototypes/theme.css`

### Ticket (features 4 and 10)

- `id` (string) - unique local ticket identifier, encoded in the QR code
- `createdAt` (string, ISO datetime)
- `templateId` (string) -> `TicketTemplate.id`
- `event` (EventInfo), `attendee` (AttendeeInfo), `branding` (Branding) -
  snapshots, so a history entry regenerates exactly as it was

### LocalState (feature 9, `localStorage`)

- `lastEvent` (EventInfo), `lastAttendee` (AttendeeInfo)
- `branding` (Branding), `selectedTemplateId` (string)
- `history` (Ticket[]) - feature 10

> Lock `Ticket` and `TicketTemplate.id` once feature 4 ships; history (10) and
> export (5, 6) depend on them. Treat stored data as untrusted: parse defensively
> and fall back to defaults.

## Tech stack

- **Next.js 16 (App Router), React 19, TypeScript** - app and render endpoint.
- **Tailwind CSS v4** - styling, via the Turbopack loader; theme in `@theme`.
- **shadcn/ui** - UI components (planned, not yet installed).
- **Zod** - input validation (planned, not yet installed).
- **QR code library** - QR generation (> TODO: choose one in feature 4).
- **Browser `localStorage`** - all v1 persistence.
- **Puppeteer** - server-side PNG and PDF rendering from the same HTML/CSS
  templates as the preview.
- **Self-hosted fonts** - consistent rendering between preview and export.
- **Render** - hosting.

Preview and export must use the same ticket templates so the download matches
the preview.

## Monetization

None in v1; the goal is to validate the core experience. Possible later freemium
model: free tier with limited tickets, built-in templates, and basic
customization; paid tier with unlimited tickets, custom branding, premium
templates, CSV bulk, cloud history, verification, and teams.

## UI/UX

A focused design tool, not an event-management platform. Modern, clean, minimal.
The app UI is dark-mode-first; the ticket stays bright and print-friendly with
strong typography, clear event and attendee details, and a distinct QR code.
Principle: **what you see in the preview is what you get in the download.**

- `/` - generator: form and customization panel on the left, live ticket preview
  on the right, Download PNG and Download PDF actions, template selection,
  branding controls, and access to ticket history.
- Ticket history - reachable from the same app (> TODO: separate route or panel).
- Mobile: form stacked above the preview.
- Design reference: `prototypes/generator.html` and `prototypes/theme.css`
  (dark editor shell, violet accent, Geist + Geist Mono).

## Deployment

- **Host:** Render, Next.js web service, Render-provided domain first.
- **Build:** `npm run build`. **Start:** `npm run start`.
- **Server rendering:** a server-side endpoint runs Puppeteer for PNG/PDF; Chrome
  must be installed or bundled correctly on Render.
- **Storage:** none server-side (no database, no persistent files).
- **Env vars:** none required for v1; add only when needed.
- **Health check:** the main route or a dedicated health endpoint.

## Open questions

> Resolve in the plans, then re-run `/overview`.

- **Product name:** the project plan says "Ticketly"; the repo and onboarding use
  "Ticketa".
- **Organizer overlap:** feature 2's event form includes organizer, and feature 8
  adds "organizer information" again. Which fields belong to each?
- **Validation overlap:** feature 2 adds validation; feature 11 adds validation
  messages. Where is the line?
- **Ticket ID and QR content:** format of the unique identifier, and whether the
  QR encodes only the ID (no verification in v1).
- **Ticket and PDF dimensions:** ticket size, PDF page size, and margins are not
  specified.
- **Render endpoint:** route name and input contract for the Puppeteer endpoint;
  it is internet-facing, so feature 14 should cover input limits and concurrency.
- **Logo storage:** large logos stored as data URLs can hit `localStorage` size
  limits, especially across many history entries.
- **History route:** separate page or panel in the generator.
