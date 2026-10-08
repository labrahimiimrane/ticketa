import { useSyncExternalStore } from "react";

import { generateTicketId } from "@/lib/ticket-id";

// One ID per page load. It is created lazily in the browser because random
// values cannot run during prerender; the server snapshot is null.
let currentId: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  currentId ??= generateTicketId();
  return currentId;
}

function getServerSnapshot() {
  return null;
}

function regenerate() {
  currentId = generateTicketId();
  listeners.forEach((listener) => listener());
}

/** The current ticket ID (null until the browser has one) and a way to replace it. */
export function useTicketId() {
  const ticketId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [ticketId, regenerate] as const;
}
