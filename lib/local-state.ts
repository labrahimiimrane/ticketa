import { z } from "zod";

import { brandingSchema, DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, type TemplateId } from "@/lib/ticket-templates";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

export type LocalState = {
  lastEvent: EventInfo;
  lastAttendee: AttendeeInfo;
  branding: Branding;
  selectedTemplateId: TemplateId;
};

export const LOCAL_STATE_KEY = "ticketa:state";
const LOCAL_STATE_VERSION = 1;

export const DEFAULT_LOCAL_STATE: LocalState = {
  lastEvent: { name: "", date: "", time: "", location: "", organizer: "" },
  lastAttendee: { name: "", email: "" },
  branding: DEFAULT_BRANDING,
  selectedTemplateId: DEFAULT_TEMPLATE_ID,
};

// Drafts come back as typed, so these only check shape, not validity.
const draftText = z.string().catch("");

const draftEventSchema = z.object({
  name: draftText,
  date: draftText,
  time: draftText,
  location: draftText,
  organizer: draftText,
});

const draftAttendeeSchema = z.object({
  name: draftText,
  email: draftText,
});

const recordSchema = z.object({ version: z.literal(LOCAL_STATE_VERSION) });

/** Parses a stored record. Each section falls back to its default on its own. */
export function parseLocalState(raw: string | null): LocalState {
  if (raw === null) return DEFAULT_LOCAL_STATE;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_LOCAL_STATE;
  }
  if (!recordSchema.safeParse(data).success) return DEFAULT_LOCAL_STATE;
  const record = data as Record<string, unknown>;

  const lastEvent = draftEventSchema.safeParse(record.lastEvent);
  const lastAttendee = draftAttendeeSchema.safeParse(record.lastAttendee);
  const branding = brandingSchema.safeParse(record.branding);
  const selectedTemplateId = z.enum(TEMPLATE_IDS).safeParse(record.selectedTemplateId);

  return {
    lastEvent: lastEvent.success ? lastEvent.data : DEFAULT_LOCAL_STATE.lastEvent,
    lastAttendee: lastAttendee.success ? lastAttendee.data : DEFAULT_LOCAL_STATE.lastAttendee,
    branding: branding.success ? branding.data : DEFAULT_LOCAL_STATE.branding,
    selectedTemplateId: selectedTemplateId.success
      ? selectedTemplateId.data
      : DEFAULT_LOCAL_STATE.selectedTemplateId,
  };
}

/** Browser only. Unavailable storage reads as the defaults. */
export function readLocalState(): LocalState {
  try {
    return parseLocalState(localStorage.getItem(LOCAL_STATE_KEY));
  } catch {
    return DEFAULT_LOCAL_STATE;
  }
}

/** Browser only. Returns false when storage is unavailable or full. */
export function writeLocalState(state: LocalState): boolean {
  try {
    localStorage.setItem(
      LOCAL_STATE_KEY,
      JSON.stringify({ version: LOCAL_STATE_VERSION, ...state }),
    );
    return true;
  } catch {
    return false;
  }
}
