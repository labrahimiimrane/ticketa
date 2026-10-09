import { z } from "zod";

import { brandingSchema, type Branding } from "@/lib/branding";
import { TICKET_ID_PATTERN } from "@/lib/ticket-id";
import { attendeeInfoSchema, eventInfoSchema } from "@/lib/ticket-schema";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/ticket-templates";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

/** A generated ticket, snapshotted so it regenerates exactly as it was. */
export type Ticket = {
  id: string;
  /** ISO datetime of the first time this ticket was generated. */
  createdAt: string;
  templateId: TemplateId;
  event: EventInfo;
  attendee: AttendeeInfo;
  branding: Branding;
};

export const TICKET_HISTORY_KEY = "ticketa:history";
const TICKET_HISTORY_VERSION = 1;

// The same rules the export endpoint enforces, so every restored entry exports.
const ticketSchema = z.object({
  id: z.string().regex(TICKET_ID_PATTERN),
  createdAt: z.iso.datetime(),
  templateId: z.enum(TEMPLATE_IDS),
  event: eventInfoSchema,
  attendee: attendeeInfoSchema,
  branding: brandingSchema,
}) satisfies z.ZodType<Ticket>;

const recordSchema = z.object({
  version: z.literal(TICKET_HISTORY_VERSION),
  tickets: z.array(z.unknown()),
});

/** Parses a stored record, newest first. Invalid or duplicate entries are dropped one by one. */
export function parseTicketHistory(raw: string | null): Ticket[] {
  if (raw === null) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const record = recordSchema.safeParse(data);
  if (!record.success) return [];

  const seen = new Set<string>();
  const tickets: Ticket[] = [];
  for (const entry of record.data.tickets) {
    const ticket = ticketSchema.safeParse(entry);
    if (!ticket.success || seen.has(ticket.data.id)) continue;
    seen.add(ticket.data.id);
    tickets.push(ticket.data);
  }
  return tickets;
}

/** Puts the ticket first, replacing any entry with its ID but keeping that entry's `createdAt`. */
export function upsertTicket(history: Ticket[], ticket: Ticket): Ticket[] {
  const existing = history.find((entry) => entry.id === ticket.id);
  return [
    existing ? { ...ticket, createdAt: existing.createdAt } : ticket,
    ...history.filter((entry) => entry.id !== ticket.id),
  ];
}

export function removeTicket(history: Ticket[], id: string): Ticket[] {
  return history.filter((entry) => entry.id !== id);
}

/** Browser only. Unavailable storage reads as an empty history. */
export function readTicketHistory(): Ticket[] {
  try {
    return parseTicketHistory(localStorage.getItem(TICKET_HISTORY_KEY));
  } catch {
    return [];
  }
}

/** Browser only. Returns false when storage is unavailable or full. */
export function writeTicketHistory(history: Ticket[]): boolean {
  try {
    localStorage.setItem(
      TICKET_HISTORY_KEY,
      JSON.stringify({ version: TICKET_HISTORY_VERSION, tickets: history }),
    );
    return true;
  } catch {
    return false;
  }
}
