const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Fixed locale and UTC so server and client render the same string.
const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function parseIsoDate(isoDate: string): Date | null {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate ? date : null;
}

/** True for a "YYYY-MM-DD" string naming a real calendar date. */
export function isValidIsoDate(isoDate: string): boolean {
  return parseIsoDate(isoDate) !== null;
}

/** Formats "2026-11-14" as "Sat, 14 Nov 2026"; returns invalid input unchanged. */
export function formatTicketDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date ? formatter.format(date) : isoDate;
}

// Viewer's local time zone: only used by history, which renders after hydration.
const createdAtFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Formats an ISO datetime as "9 Oct 2026, 14:05" in local time; returns "" when unparseable. */
export function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : createdAtFormatter.format(date);
}
