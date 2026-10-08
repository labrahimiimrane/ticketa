import {
  CutLine,
  ROUNDED_CUT_LINE,
  TicketIdText,
  TicketQrSlot,
  metaLabel,
  metaValue,
  orPlaceholder,
  ticketArticle,
  type TemplateProps,
} from "@/components/ticket/ticket-parts";
import { formatTicketDate } from "@/lib/format-ticket-date";

const onAccentPlaceholder = "text-ticket-accent-ink/60";

export default function BoldTicket({ event, attendee, ticketId }: TemplateProps) {
  return (
    <article className={`flex flex-col ${ticketArticle}`}>
      <CutLine path={ROUNDED_CUT_LINE} />

      <header className="flex h-[128px] shrink-0 flex-col justify-between rounded-t-ticket bg-ticket-accent px-8 py-5 text-ticket-accent-ink">
        <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
          {orPlaceholder(event.organizer, "Organizer", event.organizer, onAccentPlaceholder)}
        </p>
        <h1 className="line-clamp-2 text-[28px] leading-[1.1] font-bold tracking-[-0.03em]">
          {orPlaceholder(event.name, "Event name", event.name, onAccentPlaceholder)}
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 gap-6 px-8 py-5">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <dl className="grid grid-cols-[1.1fr_0.8fr_1.4fr] gap-5">
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
          <div className="min-w-0">
            <p className={metaLabel}>Attendee</p>
            <p className="mt-1 truncate text-[15px] font-semibold">
              {orPlaceholder(attendee.name, "Attendee name")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-2">
          <TicketQrSlot ticketId={ticketId} className="size-[96px]" />
          <TicketIdText ticketId={ticketId} />
        </div>
      </div>
    </article>
  );
}
