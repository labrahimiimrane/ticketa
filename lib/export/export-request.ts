import { z } from "zod";

import { brandingSchema } from "@/lib/branding";
import { TICKET_ID_PATTERN } from "@/lib/ticket-id";
import { attendeeInfoSchema, eventInfoSchema } from "@/lib/ticket-schema";
import { TEMPLATE_IDS } from "@/lib/ticket-templates";

export const exportRequestSchema = z.object({
  event: eventInfoSchema,
  attendee: attendeeInfoSchema,
  ticketId: z.string().regex(TICKET_ID_PATTERN),
  templateId: z.enum(TEMPLATE_IDS),
  branding: brandingSchema,
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
