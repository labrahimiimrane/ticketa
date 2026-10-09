import {
  CutLine,
  NOTCHED_CUT_LINE,
  TicketLogo,
  TicketIdText,
  TicketQrSlot,
  metaLabel,
  metaValue,
  orPlaceholder,
  brandStyle,
  ticketArticle,
  type TemplateProps,
} from "@/components/ticket/ticket-parts";
import { formatTicketDate } from "@/lib/format-ticket-date";

export default function ClassicTicket({ event, attendee, ticketId, branding }: TemplateProps) {
  return (
    <article className={`ticket-notches flex ${ticketArticle}`} style={brandStyle(branding)}>
      <CutLine path={NOTCHED_CUT_LINE} />
      <div className="w-2.5 rounded-l-ticket bg-ticket-accent" />

      <div className="flex min-w-0 flex-1 flex-col px-8 py-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            {branding.logo && <TicketLogo logo={branding.logo} className="h-6 max-w-24" />}
            <p className="truncate text-xs font-semibold text-ticket-muted">
              {orPlaceholder(event.organizer, "Organizer")}
            </p>
          </div>
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
          <p className="mt-1 truncate text-[15px] font-semibold">
            {orPlaceholder(attendee.name, "Attendee name")}
          </p>
        </div>

        <TicketQrSlot ticketId={ticketId} className="size-[118px]" />
        <TicketIdText ticketId={ticketId} />
      </div>
    </article>
  );
}
