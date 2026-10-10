"use client";

import { useEffect, useState } from "react";

import BrandingPanel from "@/components/generator/BrandingPanel";
import TemplatePicker from "@/components/generator/TemplatePicker";
import TicketHistory from "@/components/generator/TicketHistory";
import TicketForm, { formErrors, type TicketFormValues } from "@/components/generator/TicketForm";
import Ticket from "@/components/ticket/Ticket";
import { type Branding } from "@/lib/branding";
import { DEFAULT_LOCAL_STATE, type LocalState } from "@/lib/local-state";
import { saveState, useSavedState, useSaveFailed } from "@/components/generator/use-saved-state";
import { setTicketId, useTicketId } from "@/components/generator/use-ticket-id";
import { recordTicket, useHistorySaveFailed } from "@/components/generator/use-ticket-history";
import { type Ticket as TicketSnapshot } from "@/lib/ticket-history";
import { TICKET_HEIGHT, TICKET_WIDTH, type TemplateId } from "@/lib/ticket-templates";
import { useFitScale } from "@/components/generator/use-fit-scale";

type ExportFormat = "png" | "pdf";

type ExportState =
  | { status: "idle" }
  | { status: "exporting"; format: ExportFormat }
  | { status: "error"; format: ExportFormat; busy: boolean };

/**
 * Renders defaults on the server and during hydration, then remounts once with
 * the state saved in this browser so every control starts from it.
 */
export default function SavedGenerator() {
  const saved = useSavedState();
  return (
    <Generator
      key={saved ? "restored" : "default"}
      initialState={saved ?? DEFAULT_LOCAL_STATE}
      restored={saved !== null}
    />
  );
}

type GeneratorProps = {
  initialState: LocalState;
  /** False until the saved state is loaded, so defaults never overwrite it. */
  restored: boolean;
};

function Generator({ initialState, restored }: GeneratorProps) {
  const [values, setValues] = useState<TicketFormValues>({
    event: initialState.lastEvent,
    attendee: initialState.lastAttendee,
  });
  const [ticketId, regenerateTicketId] = useTicketId();
  const [templateId, setTemplateId] = useState<TemplateId>(initialState.selectedTemplateId);
  const [branding, setBranding] = useState<Branding>(initialState.branding);
  const [blockedAttempts, setBlockedAttempts] = useState(0);
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });
  const saveFailed = useSaveFailed();
  const historySaveFailed = useHistorySaveFailed();
  // Remounts the form and branding panels on reopen so their local state starts fresh.
  const [reopenCount, setReopenCount] = useState(0);
  const [reopenedId, setReopenedId] = useState<string | null>(null);
  const [previewRef, previewScale] = useFitScale<HTMLDivElement>(TICKET_WIDTH);

  useEffect(() => {
    if (!restored) return;
    saveState({
      lastEvent: values.event,
      lastAttendee: values.attendee,
      branding,
      selectedTemplateId: templateId,
    });
  }, [restored, values, branding, templateId]);

  async function exportTicket(format: ExportFormat) {
    setExportState({ status: "idle" });
    if (formErrors(values).size > 0 || !ticketId) {
      setBlockedAttempts((count) => count + 1);
      return;
    }

    // Taken now, so edits made while the export runs stay out of this ticket.
    const snapshot: TicketSnapshot = {
      id: ticketId,
      createdAt: new Date().toISOString(),
      templateId,
      event: values.event,
      attendee: values.attendee,
      branding,
    };

    setExportState({ status: "exporting", format });
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: snapshot.event,
          attendee: snapshot.attendee,
          ticketId: snapshot.id,
          templateId: snapshot.templateId,
          branding: snapshot.branding,
        }),
      });
      if (response.status === 503) {
        setExportState({ status: "error", format, busy: true });
        return;
      }
      if (!response.ok) throw new Error(`${format} export failed with ${response.status}`);
      saveBlob(await response.blob(), `ticket-${snapshot.id}.${format}`);
      setExportState({ status: "idle" });
    } catch {
      setExportState({ status: "error", format, busy: false });
      return;
    }
    recordTicket(snapshot);
  }

  function reopenTicket(ticket: TicketSnapshot) {
    setValues({ event: ticket.event, attendee: ticket.attendee });
    setTemplateId(ticket.templateId);
    setBranding(ticket.branding);
    setTicketId(ticket.id);
    setBlockedAttempts(0);
    setExportState({ status: "idle" });
    setReopenCount((count) => count + 1);
    setReopenedId(ticket.id);
  }

  const isExporting = exportState.status === "exporting";
  const invalidCount = formErrors(values).size;
  const isBlank = [...Object.values(values.event), ...Object.values(values.attendee)].every(
    (value) => !value?.trim(),
  );

  return (
    // Below lg: one scrolling column with a sticky header, controls above the preview.
    <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-rows-[52px_1fr]">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 border-b border-border bg-surface px-4 py-2.5 lg:static lg:flex-nowrap lg:py-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-[22px] place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-ink"
          >
            T
          </span>
          <span className="text-base font-semibold tracking-[-0.01em]">Ticketa</span>
        </div>
        {/* Messages take their own row below lg; the regions stay mounted so they still announce. */}
        <div className="order-last flex basis-full flex-wrap items-center gap-x-3 max-lg:has-[p:not(:empty)]:mt-1.5 lg:order-0 lg:ml-auto lg:basis-auto">
          <p role="status" className="text-xs text-muted-foreground">
            {saveFailed && "Couldn't save your changes in this browser."}
          </p>
          <p role="status" className="sr-only">
            {reopenedId && `Reopened ticket ${reopenedId}`}
          </p>
          <p role="status" className="text-xs text-muted-foreground">
            {historySaveFailed && "Couldn't save this ticket to history."}
          </p>
          <p role="alert" className="text-xs text-danger">
            {blockedAttempts > 0 &&
              invalidCount > 0 &&
              `Fix ${invalidCount} ${invalidCount === 1 ? "field" : "fields"} before downloading.`}
          </p>
          <p role="status" className="text-xs text-danger">
            {exportState.status === "error" &&
              (exportState.busy
                ? "Export is busy right now. Try again in a few seconds."
                : `Couldn't create the ${exportState.format.toUpperCase()}. Try again.`)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3">
          <button
            type="button"
            onClick={() => exportTicket("pdf")}
            disabled={isExporting}
            aria-busy={isExporting && exportState.format === "pdf"}
            className="h-[34px] rounded-lg border border-border-strong bg-surface-raised px-4 text-sm font-medium text-text hover:border-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isExporting && exportState.format === "pdf" ? "Exporting…" : <DownloadLabel format="PDF" />}
          </button>
          <button
            type="button"
            onClick={() => exportTicket("png")}
            disabled={isExporting}
            aria-busy={isExporting && exportState.format === "png"}
            className="h-[34px] rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isExporting && exportState.format === "png" ? "Exporting…" : <DownloadLabel format="PNG" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[380px_1fr]">
        <aside className="border-b border-border bg-surface lg:overflow-y-auto lg:border-r lg:border-b-0">
          <TicketForm key={`form-${reopenCount}`} values={values} onChange={setValues} blockedAttempts={blockedAttempts} />
          <TemplatePicker value={templateId} onChange={setTemplateId} />
          <BrandingPanel
            key={`branding-${reopenCount}`}
            value={branding}
            onLogoChange={(logo) => setBranding((current) => ({ ...current, logo }))}
            onAccentChange={(accent) =>
              setBranding((current) => ({ ...current, colors: { ...current.colors, accent } }))
            }
          />
          <TicketHistory onReopen={reopenTicket} exporting={isExporting} />
        </aside>

        <main className="grid flex-1 grid-cols-1 content-center justify-items-center gap-4 bg-canvas bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px] px-4 py-8 sm:p-8 lg:min-h-0 lg:overflow-auto">
          <div ref={previewRef} className="flex w-full justify-center">
            {/* The ticket keeps its true size for export; the preview scales it to fit.
                The scale is measured at runtime, so it is set inline. Until then the box
                is clipped to the pane rather than widening the page. */}
            <div
              className="max-w-full overflow-hidden drop-shadow-ticket"
              style={
                previewScale === null
                  ? undefined
                  : { width: TICKET_WIDTH * previewScale, height: TICKET_HEIGHT * previewScale }
              }
            >
              <div
                className="origin-top-left"
                style={previewScale === null ? undefined : { transform: `scale(${previewScale})` }}
              >
                <Ticket templateId={templateId} event={values.event} attendee={values.attendee} ticketId={ticketId} branding={branding} />
              </div>
            </div>
          </div>
          {isBlank && (
            <p className="text-sm text-muted-foreground">Fill in the event details to build your ticket.</p>
          )}
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

/** Shortens to the format below sm; the accessible name stays "Download <format>". */
function DownloadLabel({ format }: { format: string }) {
  return (
    <>
      <span className="max-sm:sr-only">Download </span>
      {format}
    </>
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
