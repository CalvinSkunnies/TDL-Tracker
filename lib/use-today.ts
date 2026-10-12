"use client";

import { useSyncExternalStore } from "react";
import { toDateString } from "./tasks";

function subscribe(onChange: () => void) {
  // Re-check every minute so "overdue" flips at midnight without a reload.
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

const getSnapshot = () => toDateString(new Date());
const getServerSnapshot = () => "";

/** Today's local date as "YYYY-MM-DD" ("" during server rendering). */
export function useToday(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
