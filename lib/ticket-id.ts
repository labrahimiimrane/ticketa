/** No 0, O, 1, or I, so IDs read unambiguously on a printed ticket. */
export const TICKET_ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Returns an ID like "TKT-7F3K-92QD": 8 random characters, 40 bits. */
export function generateTicketId(
  randomBytes: (bytes: Uint8Array) => Uint8Array = (bytes) =>
    crypto.getRandomValues(bytes),
): string {
  // 256 is a multiple of 32, so masking to 5 bits keeps every character equally likely.
  const chars = Array.from(
    randomBytes(new Uint8Array(8)),
    (byte) => TICKET_ID_ALPHABET[byte & 31],
  ).join("");
  return `TKT-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
