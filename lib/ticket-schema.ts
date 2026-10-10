import { z } from "zod";

import { isValidIsoDate } from "@/lib/format-ticket-date";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MAX_TEXT_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 254;

const tooLong = (max: number) => ({ message: `Use ${max} characters or fewer` });

// Checks the trimmed value but keeps the input exactly as typed.
const requiredText = (message: string, limited: boolean) =>
  (limited ? z.string().max(MAX_TEXT_LENGTH, tooLong(MAX_TEXT_LENGTH)) : z.string()).refine(
    (value) => value.trim().length > 0,
    { message },
  );

function eventInfo(limited: boolean) {
  return z.object({
    name: requiredText("Enter the event name", limited),
    date: z.string().refine(isValidIsoDate, { message: "Choose a valid date" }),
    time: z.string().regex(TIME_24H, { message: "Choose a valid time" }),
    location: requiredText("Enter the location", limited),
    organizer: requiredText("Enter the organizer", limited),
  }) satisfies z.ZodType<EventInfo>;
}

function attendeeInfo(limited: boolean) {
  return z.object({
    name: requiredText("Enter the attendee's name", limited),
    email: (limited ? z.string().max(MAX_EMAIL_LENGTH, tooLong(MAX_EMAIL_LENGTH)) : z.string())
      .refine((value) => value === "" || z.email().safeParse(value).success, {
        message: "Enter a complete email, like name@example.com",
      })
      .optional(),
  }) satisfies z.ZodType<AttendeeInfo>;
}

/** Form and export rules, including length limits. */
export const eventInfoSchema = eventInfo(true);
export const attendeeInfoSchema = attendeeInfo(true);

// Tickets saved before the length limits existed stay in history; reopening one
// shows the inline length error so it can be shortened before exporting.
export const storedEventInfoSchema = eventInfo(false);
export const storedAttendeeInfoSchema = attendeeInfo(false);
