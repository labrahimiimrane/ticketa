import { useSyncExternalStore } from "react";

import {
  readTicketHistory,
  removeTicket,
  upsertTicket,
  writeTicketHistory,
  type Ticket,
} from "@/lib/ticket-history";

// Read once per page load and cached, so every snapshot is the same object.
// Storage is browser-only; the server snapshot is null.
let history: Ticket[] | null = null;
let saveFailed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getHistory() {
  history ??= readTicketHistory();
  return history;
}

function getSaveFailed() {
  return saveFailed;
}

function getServerSnapshot() {
  return null;
}

/** Writes the next list. The cache only changes when the write works, so it always matches storage. */
function commit(next: Ticket[]) {
  saveFailed = !writeTicketHistory(next);
  if (!saveFailed) history = next;
  listeners.forEach((listener) => listener());
}

/** Tickets saved in this browser, newest first, or null during server render and hydration. */
export function useTicketHistory() {
  return useSyncExternalStore(subscribe, getHistory, getServerSnapshot);
}

/** Whether the most recent history write failed, for example because storage is full. */
export function useHistorySaveFailed() {
  return useSyncExternalStore(subscribe, getSaveFailed, () => false);
}

export function recordTicket(ticket: Ticket) {
  commit(upsertTicket(getHistory(), ticket));
}

export function removeHistoryTicket(id: string) {
  commit(removeTicket(getHistory(), id));
}
