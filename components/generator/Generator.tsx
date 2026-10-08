"use client";

import { useState } from "react";

import TicketForm, { type TicketFormValues } from "@/components/generator/TicketForm";
import Ticket from "@/components/ticket/Ticket";

const EMPTY_VALUES: TicketFormValues = {
  event: { name: "", date: "", time: "", location: "", organizer: "" },
  attendee: { name: "", email: "" },
};

export default function Generator() {
  const [values, setValues] = useState(EMPTY_VALUES);

  return (
    <div className="grid h-dvh grid-rows-[52px_1fr]">
      <header className="flex items-center gap-2 border-b border-border bg-surface px-4">
        <span
          aria-hidden
          className="grid size-[22px] place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-ink"
        >
          T
        </span>
        <span className="text-base font-semibold tracking-[-0.01em]">Ticketa</span>
      </header>

      <div className="grid min-h-0 grid-cols-[380px_1fr]">
        <aside className="overflow-y-auto border-r border-border bg-surface">
          <TicketForm values={values} onChange={setValues} />
        </aside>

        <main className="grid min-h-0 place-items-center overflow-auto bg-canvas bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px] p-8">
          <Ticket event={values.event} attendee={values.attendee} />
        </main>
      </div>
    </div>
  );
}
