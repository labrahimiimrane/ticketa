"use client";

import { useState } from "react";

import TicketForm, { type TicketFormValues } from "@/components/generator/TicketForm";
import Ticket from "@/components/ticket/Ticket";
import { useTicketId } from "@/components/generator/use-ticket-id";

const EMPTY_VALUES: TicketFormValues = {
  event: { name: "", date: "", time: "", location: "", organizer: "" },
  attendee: { name: "", email: "" },
};

export default function Generator() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [ticketId, regenerateTicketId] = useTicketId();

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

        <main className="grid min-h-0 place-content-center place-items-center gap-4 overflow-auto bg-canvas bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px] p-8">
          <Ticket event={values.event} attendee={values.attendee} ticketId={ticketId} />
          <button
            type="button"
            onClick={regenerateTicketId}
            className="h-8 rounded-lg border border-border-strong bg-surface-raised px-3 text-sm font-medium text-text hover:border-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            New ticket ID
          </button>
        </main>
      </div>
    </div>
  );
}
