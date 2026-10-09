import {
  CutLine,
  ROUNDED_CUT_LINE,
  TicketLogo,
  TicketIdText,
  TicketQrSlot,
  metaLabel,
  orPlaceholder,
  brandStyle,
  eventTitleClass,
  ticketArticle,
  wrapText,
  type TemplateProps,
} from "@/components/ticket/ticket-parts";
import { formatTicketDate } from "@/lib/format-ticket-date";

export default function MinimalTicket({ event, attendee, ticketId, branding }: TemplateProps) {
  return (
    <article className={`flex flex-col px-10 py-7 ${ticketArticle}`} style={brandStyle(branding)}>
      <CutLine path={ROUNDED_CUT_LINE} />

      <div className="flex min-w-0 items-center gap-2">
        {branding.logo && <TicketLogo logo={branding.logo} className="h-6 max-w-24" />}
        <p className="truncate text-xs font-medium text-ticket-muted">
          {orPlaceholder(event.organizer, "Organizer")}
        </p>
      </div>
      <h1
        className={`mt-3 line-clamp-2 leading-[1.05] font-bold tracking-[-0.03em] ${wrapText} ${eventTitleClass(event.name, "text-[34px]", "text-[28px]")}`}
      >
        {orPlaceholder(event.name, "Event name")}
      </h1>
      <div aria-hidden className="mt-3 h-0.5 w-12 shrink-0 bg-ticket-accent" />
      <p className="mt-4 truncate text-sm font-medium">
        {orPlaceholder(event.date, "Date", formatTicketDate(event.date))}
        <span aria-hidden className="text-ticket-muted"> · </span>
        {orPlaceholder(event.time, "Time")}
        <span aria-hidden className="text-ticket-muted"> · </span>
        {orPlaceholder(event.location, "Venue")}
      </p>

      <div className="mt-auto flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className={metaLabel}>Attendee</p>
          <p className={`mt-1 line-clamp-2 text-[15px] font-semibold ${wrapText}`}>
            {orPlaceholder(attendee.name, "Attendee name")}
          </p>
        </div>
        <div className="flex shrink-0 items-end gap-3">
          <TicketIdText ticketId={ticketId} />
          <TicketQrSlot ticketId={ticketId} className="size-[80px]" />
        </div>
      </div>
    </article>
  );
}
