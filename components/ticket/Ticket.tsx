import TicketQr from "@/components/ticket/TicketQr";
import { formatTicketDate } from "@/lib/format-ticket-date";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

type TicketProps = {
  event: EventInfo;
  attendee: AttendeeInfo;
  ticketId: string | null;
};

// Matches the ticket-notches mask in globals.css: 760 x 300 ticket, 14px corner
// radius, 14px notches centered 209px from the right edge.
const CUT_LINE =
  "M14 0H537A14 14 0 0 0 565 0H746A14 14 0 0 1 760 14V286A14 14 0 0 1 746 300" +
  "H565A14 14 0 0 0 537 300H14A14 14 0 0 1 0 286V14A14 14 0 0 1 14 0Z";

const metaLabel =
  "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ticket-muted";
const metaValue = "mt-1 truncate text-sm font-semibold";

function orPlaceholder(value: string, placeholder: string, display = value) {
  return value.trim() ? (
    display
  ) : (
    <span className="text-ticket-muted">{placeholder}</span>
  );
}

export default function Ticket({ event, attendee, ticketId }: TicketProps) {
  return (
    <article className="ticket-notches relative flex h-[300px] w-[760px] shrink-0 rounded-ticket bg-ticket-paper font-sans text-ticket-ink">
      <svg
        aria-hidden
        viewBox="0 0 760 300"
        className="pointer-events-none absolute inset-0 hidden size-full overflow-visible print:block"
      >
        <path d={CUT_LINE} fill="none" strokeWidth={0.5} className="stroke-ticket-muted" />
      </svg>
      <div className="w-2.5 rounded-l-ticket bg-ticket-accent" />

      <div className="flex min-w-0 flex-1 flex-col px-8 py-7">
        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-xs font-semibold text-ticket-muted">
            {orPlaceholder(event.organizer, "Organizer")}
          </p>
          <span className="shrink-0 rounded-full bg-ticket-accent px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ticket-accent-ink">
            Admit one
          </span>
        </div>

        <h1 className="mt-5 line-clamp-2 text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
          {orPlaceholder(event.name, "Event name")}
        </h1>

        <dl className="mt-auto grid grid-cols-[1.1fr_0.8fr_1.4fr] gap-5 border-t border-ticket-rule pt-[18px]">
          <div className="min-w-0">
            <dt className={metaLabel}>Date</dt>
            <dd className={metaValue}>{orPlaceholder(event.date, "Date", formatTicketDate(event.date))}</dd>
          </div>
          <div className="min-w-0">
            <dt className={metaLabel}>Time</dt>
            <dd className={metaValue}>{orPlaceholder(event.time, "Time")}</dd>
          </div>
          <div className="min-w-0">
            <dt className={metaLabel}>Venue</dt>
            <dd className={metaValue}>{orPlaceholder(event.location, "Venue")}</dd>
          </div>
        </dl>
      </div>

      <div className="flex w-[210px] shrink-0 flex-col items-center justify-between border-l-2 border-dashed border-ticket-rule px-[22px] py-6">
        <div className="w-full text-center">
          <p className={metaLabel}>Attendee</p>
          <p className="mt-1 truncate text-[15px] font-semibold">{orPlaceholder(attendee.name, "Attendee name")}</p>
        </div>

        {ticketId ? (
          <div className="size-[118px]">
            <TicketQr value={ticketId} />
          </div>
        ) : (
          <div
            role="img"
            aria-label="QR code placeholder"
            className="grid size-[118px] place-items-center rounded-md border-2 border-dashed border-ticket-rule font-mono text-xs text-ticket-muted"
          >
            QR
          </div>
        )}

        <p
          className={`font-mono text-xs font-medium tracking-[0.06em] ${ticketId ? "text-ticket-ink" : "text-ticket-muted"}`}
        >
          {ticketId ?? "TICKET ID"}
        </p>
      </div>
    </article>
  );
}
