import TicketQr from "@/components/ticket/TicketQr";
import { TICKET_HEIGHT, TICKET_WIDTH } from "@/lib/ticket-templates";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

export type TemplateProps = {
  event: EventInfo;
  attendee: AttendeeInfo;
  ticketId: string | null;
};

/** Every template's root: a TICKET_WIDTH x TICKET_HEIGHT paper card that exports
    select by `article`. Tailwind only sees literal class names, so the size is
    spelled out here and must match those constants. */
export const ticketArticle =
  "relative h-[300px] w-[760px] shrink-0 rounded-ticket bg-ticket-paper font-sans text-ticket-ink";

export const metaLabel =
  "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ticket-muted";
export const metaValue = "mt-1 truncate text-sm font-semibold";

export function orPlaceholder(
  value: string,
  placeholder: string,
  display = value,
  placeholderClass = "text-ticket-muted",
) {
  return value.trim() ? display : <span className={placeholderClass}>{placeholder}</span>;
}

// Classic matches the ticket-notches mask in globals.css: 14px corner radius,
// 14px notches centered 209px from the right edge.
const CORNER_RADIUS = 14;
const NOTCH_RADIUS = 14;
const NOTCH_OFFSET_FROM_RIGHT = 209;

const W = TICKET_WIDTH;
const H = TICKET_HEIGHT;
const R = CORNER_RADIUS;
const notchX = W - NOTCH_OFFSET_FROM_RIGHT;
const corner = `A${R} ${R} 0 0 1`;
const notch = `A${NOTCH_RADIUS} ${NOTCH_RADIUS} 0 0 0`;

export const NOTCHED_CUT_LINE =
  `M${R} 0H${notchX - NOTCH_RADIUS}${notch} ${notchX + NOTCH_RADIUS} 0H${W - R}${corner} ${W} ${R}` +
  `V${H - R}${corner} ${W - R} ${H}H${notchX + NOTCH_RADIUS}${notch} ${notchX - NOTCH_RADIUS} ${H}` +
  `H${R}${corner} 0 ${H - R}V${R}${corner} ${R} 0Z`;
export const ROUNDED_CUT_LINE =
  `M${R} 0H${W - R}${corner} ${W} ${R}V${H - R}${corner} ${W - R} ${H}` +
  `H${R}${corner} 0 ${H - R}V${R}${corner} ${R} 0Z`;

/** Print-only trim line for the PDF; a white ticket on white paper has no visible edge. */
export function CutLine({ path }: { path: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${TICKET_WIDTH} ${TICKET_HEIGHT}`}
      className="pointer-events-none absolute inset-0 hidden size-full overflow-visible print:block"
    >
      <path d={path} fill="none" strokeWidth={0.5} className="stroke-ticket-muted" />
    </svg>
  );
}

/** QR for the ticket ID, or a dashed placeholder until the ID exists. */
export function TicketQrSlot({ ticketId, className }: { ticketId: string | null; className: string }) {
  return ticketId ? (
    <div className={className}>
      <TicketQr value={ticketId} />
    </div>
  ) : (
    <div
      role="img"
      aria-label="QR code placeholder"
      className={`grid place-items-center rounded-md border-2 border-dashed border-ticket-rule font-mono text-xs text-ticket-muted ${className}`}
    >
      QR
    </div>
  );
}

export function TicketIdText({ ticketId }: { ticketId: string | null }) {
  return (
    <p
      className={`font-mono text-xs font-medium tracking-[0.06em] ${ticketId ? "text-ticket-ink" : "text-ticket-muted"}`}
    >
      {ticketId ?? "TICKET ID"}
    </p>
  );
}
