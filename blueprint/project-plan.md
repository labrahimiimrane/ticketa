# Project Plan

## 1. Problem - What problem are we solving?

Creating professional event tickets often requires Canva, Photoshop, or manually editing templates for each attendee. This is slow, repetitive, and can lead to mistakes.

Ticketly turns event and attendee information into a polished, customizable event ticket in seconds, with a live preview and downloadable PNG/PDF output.

The goal of v1 is to make the complete ticket-generation flow fast, simple, and usable without requiring an account.

## 2. Users - Who is this for?

Primary users:
- Event organizers who need tickets for their events
- Workshop and conference organizers
- Meetup and community event hosts
- Small businesses organizing events

Secondary users:
- Freelancers creating tickets for clients
- Schools and training centers
- Event agencies

The initial product is designed for users who need to create a small number of professional tickets quickly without using a graphic design tool.

## 3. Features - What does the MVP need?

- Event information form with event name, date, time, location, and organizer
- Attendee information form with attendee name and optional email
- Live ticket preview that updates as the user edits the form
- Multiple ticket templates with a shared visual theme
- Logo upload and customization
- Color customization
- Automatic QR code generation with a unique ticket identifier
- High-resolution PNG export
- Print-ready PDF export
- Local ticket history stored in the browser
- Ability to reopen previously generated tickets
- Remember the user's latest event and customization values
- Responsive interface for desktop and mobile

## 4. Data - What are we storing?

No server-side database is required for v1.

Static data stored in the application:
- Ticket template definitions
- Template dimensions
- Theme variables
- Default fonts and visual assets

Data stored in browser local storage:
- Event information
- Attendee information
- Organizer information
- Logo
- Selected template
- Custom colors
- Generated ticket history
- Last-used form values

Each generated ticket contains a unique local ticket identifier used by its QR code.

Generated PNG and PDF files are created on demand and downloaded by the user rather than stored by the application.

Future product data, if Ticketly becomes a cloud product:
- Users
- Organizations
- Events
- Attendees
- Issued tickets
- Unique verification identifiers
- Ticket file URLs
- Subscription and billing information

## 5. Tech - What stack are we using?

- Next.js with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zod for input validation
- QR code generation library
- Browser local storage for v1 persistence
- Puppeteer (puppeteer-core with a serverless Chromium build in production) for high-quality PNG and PDF rendering
- Self-hosted fonts for consistent ticket rendering
- Vercel for deployment

The browser preview and exported files should use the same HTML/CSS ticket templates so the generated ticket matches the preview as closely as possible.

Future product stack, only if needed:
- PostgreSQL
- Prisma
- Authentication
- Cloud file storage
- Stripe
- CSV bulk generation

## 6. Monetize - How will this make money?

v1 is free and does not require monetization.

The initial goal is to validate the core ticket-generation experience.

If Ticketly becomes a larger product, it can use a freemium SaaS model:

Free:
- Limited ticket generation
- Built-in templates
- Basic customization

Paid:
- Unlimited tickets
- Custom branding
- Premium templates
- Bulk CSV generation
- Cloud history
- Online ticket verification
- Team/organization features

## 7. UI/UX - How should this look and feel?

The application should feel like a focused design tool rather than a complicated event-management platform.

The main generator screen should have:

- A form/customization panel on the left
- A live ticket preview on the right
- Clear Download PNG and Download PDF actions
- Template selection
- Branding/customization controls
- Ticket history accessible from the same application

The interface should be modern, clean, and minimal.

The ticket itself should look professional and event-ready, with strong typography, clear event information, attendee details, and a visually distinct QR code.

The application UI can use a modern dark-mode-first style, while the generated ticket should remain clean, bright, and print-friendly.

On mobile, the form should appear above the preview.

The main principle is:

**What you see in the preview should be what you get in the downloaded ticket.**

## 8. Deployment - Where and how will this ship?

The application will be deployed as a Next.js project on Vercel, imported from the GitHub repository.

Application type:
- Next.js project on Vercel
- Server-side rendering endpoint for PNG/PDF generation, running as a Vercel serverless function

Build:
- Next.js production build (Vercel's default)

Environment variables:
- Only add environment variables when required by the deployment or future integrations
- No database credentials are required for v1

Storage:
- Browser local storage for user data
- No server-side database
- No persistent server-side file storage

Rendering:
- Puppeteer runs inside the Vercel function for PNG and PDF generation
- Chrome must fit the serverless function size limit, so production uses puppeteer-core with a serverless Chromium build

Health check:
- Use the main application route or a dedicated health endpoint

Domain:
- Start with the Vercel-provided domain
- Add a custom domain later if the project becomes a public product

## 9. Usage model and constraints

- v1 is intended for individual users and small-scale event ticket generation
- The application is internet-facing
- v1 is local-first and does not require accounts
- Each browser/device has its own ticket history
- Clearing browser site data removes locally stored tickets and settings
- No sensitive user data should be required for the core flow
- No multi-user collaboration is required in v1
- No server-side ticket verification is required in v1
- No bulk generation is required in v1
- No billing or subscription system is required in v1