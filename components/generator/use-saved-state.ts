import { useSyncExternalStore } from "react";

import { readLocalState, writeLocalState, type LocalState } from "@/lib/local-state";

// Read once per page load and cached, so every snapshot is the same object.
// Storage is browser-only; the server snapshot is null.
let savedState: LocalState | null = null;
let saveFailed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSavedState() {
  savedState ??= readLocalState();
  return savedState;
}

function getSaveFailed() {
  return saveFailed;
}

function getServerSnapshot() {
  return null;
}

/** The state saved in this browser, or null during server render and hydration. */
export function useSavedState() {
  return useSyncExternalStore(subscribe, getSavedState, getServerSnapshot);
}

/** Whether the most recent save failed, for example because storage is blocked or full. */
export function useSaveFailed() {
  return useSyncExternalStore(subscribe, getSaveFailed, () => false);
}

/** Writes the state to this browser and reports whether it worked to `useSaveFailed`. */
export function saveState(state: LocalState) {
  const failed = !writeLocalState(state);
  if (failed === saveFailed) return;
  saveFailed = failed;
  listeners.forEach((listener) => listener());
}
