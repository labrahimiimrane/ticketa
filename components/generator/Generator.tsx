"use client";

import { useState } from "react";

import TicketForm, { type TicketFormValues } from "@/components/generator/TicketForm";
import Ticket from "@/components/ticket/Ticket";
import { useTicketId } from "@/components/generator/use-ticket-id";
import { attendeeInfoSchema, eventInfoSchema } from "@/lib/ticket-schema";

type ExportFormat = "png" | "pdf";

type ExportState =
  | { status: "idle" }
  | { status: "exporting"; format: ExportFormat }
  | { status: "error"; format: ExportFormat };

const EMPTY_VALUES: TicketFormValues = {
  event: { name: "", date: "", time: "", location: "", organizer: "" },
  attendee: { name: "", email: "" },
};

export default function Generator() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [ticketId, regenerateTicketId] = useTicketId();
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });

  async function exportTicket(format: ExportFormat) {
    setExportState({ status: "idle" });
    const isValid =
      eventInfoSchema.safeParse(values.event).success &&
      attendeeInfoSchema.safeParse(values.attendee).success;
    if (!isValid || !ticketId) {
      setShowAllErrors(true);
      return;
    }

    setExportState({ status: "exporting", format });
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: values.event, attendee: values.attendee, ticketId }),
      });
      if (!response.ok) throw new Error(`${format} export failed with ${response.status}`);
      saveBlob(await response.blob(), `ticket-${ticketId}.${format}`);
      setExportState({ status: "idle" });
    } catch {
      setExportState({ status: "error", format });
    }
  }

  const isExporting = exportState.status === "exporting";

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
        <div className="ml-auto flex items-center gap-3">
          <p role="status" className="text-xs text-danger">
            {exportState.status === "error" &&
              `Couldn't create the ${exportState.format.toUpperCase()}. Try again.`}
          </p>
          <button
            type="button"
            onClick={() => exportTicket("pdf")}
            disabled={isExporting}
            aria-busy={isExporting && exportState.format === "pdf"}
            className="h-[34px] rounded-lg border border-border-strong bg-surface-raised px-4 text-sm font-medium text-text hover:border-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isExporting && exportState.format === "pdf" ? "Exporting…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => exportTicket("png")}
            disabled={isExporting}
            aria-busy={isExporting && exportState.format === "png"}
            className="h-[34px] rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isExporting && exportState.format === "png" ? "Exporting…" : "Download PNG"}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[380px_1fr]">
        <aside className="overflow-y-auto border-r border-border bg-surface">
          <TicketForm values={values} onChange={setValues} showAllErrors={showAllErrors} />
        </aside>

        <main className="grid min-h-0 place-content-center place-items-center gap-4 overflow-auto bg-canvas bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px] p-8">
          <div className="drop-shadow-ticket">
            <Ticket event={values.event} attendee={values.attendee} ticketId={ticketId} />
          </div>
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

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
