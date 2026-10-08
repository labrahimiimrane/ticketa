import { z } from "zod";

import { isValidIsoDate } from "@/lib/format-ticket-date";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

// Checks the trimmed value but keeps the input exactly as typed.
const requiredText = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, { message });

export const eventInfoSchema = z.object({
  name: requiredText("Enter the event name"),
  date: z.string().refine(isValidIsoDate, { message: "Choose a valid date" }),
  time: z.string().regex(TIME_24H, { message: "Choose a valid time" }),
  location: requiredText("Enter the location"),
  organizer: requiredText("Enter the organizer"),
}) satisfies z.ZodType<EventInfo>;

export const attendeeInfoSchema = z.object({
  name: requiredText("Enter the attendee's name"),
  email: z
    .string()
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a complete email, like name@example.com",
    })
    .optional(),
}) satisfies z.ZodType<AttendeeInfo>;
