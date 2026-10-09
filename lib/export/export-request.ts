import { z } from "zod";

import { brandingSchema } from "@/lib/branding";
import { attendeeInfoSchema, eventInfoSchema } from "@/lib/ticket-schema";
import { TEMPLATE_IDS } from "@/lib/ticket-templates";

export const exportRequestSchema = z.object({
  event: eventInfoSchema,
  attendee: attendeeInfoSchema,
  ticketId: z.string().regex(/^TKT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/),
  templateId: z.enum(TEMPLATE_IDS),
  branding: brandingSchema,
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
