const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Fixed locale and UTC so server and client render the same string.
const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats "2026-11-14" as "Sat, 14 Nov 2026"; returns invalid input unchanged. */
export function formatTicketDate(isoDate: string): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return isoDate;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate ? formatter.format(date) : isoDate;
}
