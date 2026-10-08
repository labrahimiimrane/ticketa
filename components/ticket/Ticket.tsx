import { formatTicketDate } from "@/lib/format-ticket-date";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

type TicketProps = {
  event: EventInfo;
  attendee: AttendeeInfo;
};

const metaLabel =
  "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ticket-muted";
const metaValue = "mt-1 truncate text-sm font-semibold";

export default function Ticket({ event, attendee }: TicketProps) {
  return (
    <article className="relative flex h-[300px] w-[760px] shrink-0 rounded-ticket bg-ticket-paper font-sans text-ticket-ink shadow-ticket">
      <div className="w-2.5 rounded-l-ticket bg-ticket-accent" />

      <div className="flex min-w-0 flex-1 flex-col px-8 py-7">
        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-xs font-semibold text-ticket-muted">
            {event.organizer}
          </p>
          <span className="shrink-0 rounded-full bg-ticket-accent px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ticket-accent-ink">
            Admit one
          </span>
        </div>

        <h1 className="mt-5 line-clamp-2 text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
          {event.name}
        </h1>

        <dl className="mt-auto grid grid-cols-[1.1fr_0.8fr_1.4fr] gap-5 border-t border-ticket-rule pt-[18px]">
          <div className="min-w-0">
            <dt className={metaLabel}>Date</dt>
            <dd className={metaValue}>{formatTicketDate(event.date)}</dd>
          </div>
          <div className="min-w-0">
            <dt className={metaLabel}>Time</dt>
            <dd className={metaValue}>{event.time}</dd>
          </div>
          <div className="min-w-0">
            <dt className={metaLabel}>Venue</dt>
            <dd className={metaValue}>{event.location}</dd>
          </div>
        </dl>
      </div>

      <div className="relative flex w-[210px] shrink-0 flex-col items-center justify-between border-l-2 border-dashed border-ticket-rule px-[22px] py-6">
        <span
          aria-hidden
          className="absolute -top-3.5 -left-[15px] size-7 rounded-full bg-canvas"
        />
        <span
          aria-hidden
          className="absolute -bottom-3.5 -left-[15px] size-7 rounded-full bg-canvas"
        />

        <div className="w-full text-center">
          <p className={metaLabel}>Attendee</p>
          <p className="mt-1 truncate text-[15px] font-semibold">{attendee.name}</p>
        </div>

        <div
          role="img"
          aria-label="QR code placeholder"
          className="grid size-[118px] place-items-center rounded-md border-2 border-dashed border-ticket-rule font-mono text-xs text-ticket-muted"
        >
          QR
        </div>

        <p className="font-mono text-xs font-medium tracking-[0.06em] text-ticket-muted">
          TICKET ID
        </p>
      </div>
    </article>
  );
}
