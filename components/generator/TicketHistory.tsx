"use client";

import { removeHistoryTicket, useTicketHistory } from "@/components/generator/use-ticket-history";
import { formatCreatedAt, formatTicketDate } from "@/lib/format-ticket-date";
import { type Ticket } from "@/lib/ticket-history";

type TicketHistoryProps = {
  onReopen: (ticket: Ticket) => void;
};

const sectionTitle = "text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const smallButton =
  "inline-flex h-7 cursor-pointer items-center rounded-md border border-border-strong bg-surface-raised px-2.5 text-xs font-medium text-text hover:border-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function TicketHistory({ onReopen }: TicketHistoryProps) {
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
                <button type="button" onClick={() => onReopen(ticket)} aria-label={`Reopen ${label}`} className={smallButton}>
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
