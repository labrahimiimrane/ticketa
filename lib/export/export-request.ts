import { z } from "zod";

import { attendeeInfoSchema, eventInfoSchema } from "@/lib/ticket-schema";

export const exportRequestSchema = z.object({
  event: eventInfoSchema,
  attendee: attendeeInfoSchema,
  ticketId: z.string().regex(/^TKT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
