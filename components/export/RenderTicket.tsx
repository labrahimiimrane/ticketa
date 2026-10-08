"use client";

import { useEffect, useState } from "react";

import Ticket from "@/components/ticket/Ticket";
import type { ExportRequest } from "@/lib/export/export-request";

declare global {
  interface Window {
    __renderTicket?: (data: ExportRequest) => void;
  }
}

/** Export-only view: Puppeteer injects the ticket data and waits for data-ready. */
export default function RenderTicket() {
  const [data, setData] = useState<ExportRequest | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.__renderTicket = (next) => {
      setReady(false);
      setData(next);
    };
    return () => {
      delete window.__renderTicket;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [data]);

  return (
    <div data-render-root data-ready={ready ? "true" : undefined} className="inline-block p-0">
      {data && <Ticket event={data.event} attendee={data.attendee} ticketId={data.ticketId} />}
    </div>
  );
}
