# Build Plan

- [x] 1. **Ticket template** - Create the first professional, themeable ticket template with event, attendee, organizer, and QR code placeholders
- [x] 2. **Event and attendee form** - Add inputs for event details and attendee information with validation
- [x] 3. **Live ticket preview** - Bind the form data to the ticket template and update the preview instantly
- [x] 4. **QR code generation** - Generate a unique ticket identifier and display its QR code inside the ticket
- [x] 5. **PNG export** - Render the ticket at high resolution and allow the user to download it as a PNG
- [x] 6. **PDF export** - Render the same ticket as a print-ready PDF with the correct dimensions and margins
- [x] 7. **Template system** - Add multiple ticket designs with a shared theme system and a template picker
- [x] 8. **Brand customization** - Add logo upload, organizer information, and customizable colors
- [x] 9. **Local persistence** - Save the user's settings, latest form values, and selected template in local storage
- [x] 10. **Ticket history** - Store generated tickets locally and allow users to reopen and regenerate them
- [x] 11. **Input polish** - Add date/time formatting, validation messages, long-name handling, empty states, and other UX improvements
- [ ] 12. **Responsive UI** - Optimize the generator, preview, customization controls, and history for mobile and desktop
- [ ] 13. **Production deployment** - Deploy the application to Render and verify PNG/PDF rendering in production
- [ ] 14. **Production hardening** - Check Puppeteer memory usage, rendering concurrency, error handling, and production configuration

## Later - Not v1

- [ ] **Future: User accounts** - Add authentication and cloud-saved tickets
- [ ] **Future: Ticket verification** - Add public verification pages using unique ticket IDs
- [ ] **Future: Bulk generation** - Upload a CSV and generate multiple tickets at once
- [ ] **Future: Cloud storage** - Store generated tickets and event data remotely
- [ ] **Future: Teams and organizations** - Allow multiple users to manage the same events
- [ ] **Future: Billing** - Add free and paid plans with Stripe