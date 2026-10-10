"use client";

import { sectionTitle, smallButton } from "@/components/generator/panel-styles";
import { removeHistoryTicket, useTicketHistory } from "@/components/generator/use-ticket-history";
import { formatCreatedAt, formatTicketDate } from "@/lib/format-ticket-date";
import { type Ticket } from "@/lib/ticket-history";

type TicketHistoryProps = {
  onReopen: (ticket: Ticket) => void;
  /** Reopen would reset the in-flight export's state, so it waits for the export. */
  exporting: boolean;
};

export default function TicketHistory({ onReopen, exporting }: TicketHistoryProps) {
  const history = useTicketHistory();

  return (
    <section aria-labelledby="form-history" className="flex flex-col gap-3 border-b border-border p-4">
      <h2 id="form-history" className={sectionTitle}>
        History
      </h2>

      {history?.length === 0 && (
        <p className="text-xs text-faint">No tickets yet. Downloaded tickets appear here.</p>
      )}

      {history && history.length > 0 && (
        <ul className="flex flex-col gap-2">
          {history.map((ticket) => {
            const label = `ticket ${ticket.id} for ${ticket.attendee.name}`;
            return (
              <li
                key={ticket.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{ticket.attendee.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{ticket.event.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTicketDate(ticket.event.date)}</p>
                  <p className="font-mono text-[11px] text-faint">
                    {ticket.id} ·{" "}
                    <time dateTime={ticket.createdAt}>Created {formatCreatedAt(ticket.createdAt)}</time>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onReopen(ticket)}
                  disabled={exporting}
                  aria-label={`Reopen ${label}`}
                  className={`${smallButton} disabled:cursor-wait disabled:opacity-70`}
                >
                  Reopen
                </button>
                <button
                  type="button"
                  onClick={() => removeHistoryTicket(ticket.id)}
                  aria-label={`Remove ${label}`}
                  className={smallButton}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
