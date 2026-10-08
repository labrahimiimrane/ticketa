"use client";

import { useState } from "react";
import type { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { attendeeInfoSchema, eventInfoSchema } from "@/lib/ticket-schema";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

export type TicketFormValues = { event: EventInfo; attendee: AttendeeInfo };

type Section = keyof TicketFormValues;
type FieldKey = `${Section}.${string}`;

type TicketFormProps = {
  values: TicketFormValues;
  onChange: (values: TicketFormValues) => void;
};

function firstErrors(
  section: Section,
  result: z.ZodSafeParseResult<unknown>,
): Map<FieldKey, string> {
  const errors = new Map<FieldKey, string>();
  if (result.success) return errors;
  for (const issue of result.error.issues) {
    const key: FieldKey = `${section}.${String(issue.path[0])}`;
    if (!errors.has(key)) errors.set(key, issue.message);
  }
  return errors;
}

export default function TicketForm({ values, onChange }: TicketFormProps) {
  const [touched, setTouched] = useState<Set<FieldKey>>(() => new Set());

  const errors = new Map([
    ...firstErrors("event", eventInfoSchema.safeParse(values.event)),
    ...firstErrors("attendee", attendeeInfoSchema.safeParse(values.attendee)),
  ]);

  function field<S extends Section>(
    section: S,
    name: keyof TicketFormValues[S] & string,
    label: string,
    inputProps: React.ComponentProps<typeof Input> = {},
    optional = false,
  ) {
    const key: FieldKey = `${section}.${name}`;
    const id = `field-${section}-${name}`;
    const errorId = `${id}-error`;
    const error = touched.has(key) ? errors.get(key) : undefined;
    const value = (values[section][name] as string | undefined) ?? "";

    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
          {label}
          {optional && <span className="text-faint">(optional)</span>}
        </Label>
        <Input
          id={id}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) =>
            onChange({
              ...values,
              [section]: { ...values[section], [name]: e.target.value },
            })
          }
          onBlur={() => setTouched((prev) => new Set(prev).add(key))}
          className="h-[34px] bg-bg aria-invalid:bg-danger/10 dark:bg-bg dark:aria-invalid:bg-danger/10"
          {...inputProps}
        />
        {error && (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <section aria-labelledby="form-event" className="flex flex-col gap-3 border-b border-border p-4">
        <h2 id="form-event" className={sectionTitle}>
          Event
        </h2>
        {field("event", "name", "Event name")}
        <div className="grid grid-cols-2 gap-3">
          {field("event", "date", "Date", { type: "date" })}
          {field("event", "time", "Time", { type: "time" })}
        </div>
        {field("event", "location", "Location")}
        {field("event", "organizer", "Organizer")}
      </section>

      <section aria-labelledby="form-attendee" className="flex flex-col gap-3 border-b border-border p-4">
        <h2 id="form-attendee" className={sectionTitle}>
          Attendee
        </h2>
        {field("attendee", "name", "Full name", { autoComplete: "name" })}
        {field("attendee", "email", "Email", { type: "email", autoComplete: "email" }, true)}
      </section>
    </div>
  );
}

const sectionTitle =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";
