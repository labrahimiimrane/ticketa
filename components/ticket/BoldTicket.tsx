import {
  CutLine,
  ROUNDED_CUT_LINE,
  TicketLogo,
  TicketIdText,
  TicketQrSlot,
  metaLabel,
  metaValue,
  orPlaceholder,
  brandStyle,
  eventTitleClass,
  ticketArticle,
  wrapText,
  type TemplateProps,
} from "@/components/ticket/ticket-parts";
import { formatTicketDate } from "@/lib/format-ticket-date";

const onAccentPlaceholder = "text-ticket-accent-ink/60";

export default function BoldTicket({ event, attendee, ticketId, branding }: TemplateProps) {
  return (
    <article className={`flex flex-col ${ticketArticle}`} style={brandStyle(branding)}>
      <CutLine path={ROUNDED_CUT_LINE} />

      <header className="flex h-[128px] shrink-0 flex-col justify-between rounded-t-ticket bg-ticket-accent px-8 py-5 text-ticket-accent-ink">
        <div className="flex min-w-0 items-center gap-2">
          {branding.logo && (
            // A paper chip keeps any logo visible on any accent color.
            <span className="flex shrink-0 rounded-md bg-ticket-paper px-1.5 py-1">
              <TicketLogo logo={branding.logo} className="h-5 max-w-20" />
            </span>
          )}
          <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
            {orPlaceholder(event.organizer, "Organizer", event.organizer, onAccentPlaceholder)}
          </p>
        </div>
        <h1
          className={`line-clamp-2 leading-[1.1] font-bold tracking-[-0.03em] ${wrapText} ${eventTitleClass(event.name, "text-[28px]", "text-[24px]")}`}
        >
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
              <dd className={`mt-1 line-clamp-2 text-sm font-semibold ${wrapText}`}>
                {orPlaceholder(event.location, "Venue")}
              </dd>
            </div>
          </dl>
          <div className="min-w-0">
            <p className={metaLabel}>Attendee</p>
            <p className={`mt-1 line-clamp-2 text-[15px] font-semibold ${wrapText}`}>
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
