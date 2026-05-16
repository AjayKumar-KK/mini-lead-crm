import type { LeadStatus } from "./types";

/**
 * The state machine, mirrored from the mock server.
 * We enforce this on the client so invalid transitions are never offered in the UI.
 */
export const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["QUALIFIED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: [],
};

export const TERMINAL_STATUSES: LeadStatus[] = ["CONVERTED", "LOST"];

export function isTerminal(status: LeadStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function nextStatusesFor(status: LeadStatus): LeadStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Intersect the valid next-statuses across a set of leads.
 * Used for bulk status changes — we only offer transitions that are legal for *every* selected lead.
 * If any selected lead is terminal, the intersection is empty (terminal leads can't move).
 */
export function intersectionOfNextStatuses(currents: LeadStatus[]): LeadStatus[] {
  if (!currents.length) return [];
  const sets = currents.map((s) => new Set(TRANSITIONS[s]));
  const first = sets[0]!;
  return Array.from(first).filter((s) => sets.every((set) => set.has(s)));
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export function statusLabel(s: LeadStatus): string {
  return STATUS_LABEL[s];
}

/**
 * Tailwind classes for badges. Kept in one place so colors are consistent
 * between the table badge, the filter pills, and the Kanban columns.
 */
export const STATUS_STYLES: Record<
  LeadStatus,
  { badge: string; dot: string; column: string }
> = {
  NEW: {
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    column: "border-sky-200",
  },
  CONTACTED: {
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    column: "border-violet-200",
  },
  QUALIFIED: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    column: "border-amber-200",
  },
  CONVERTED: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    column: "border-emerald-200",
  },
  LOST: {
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    column: "border-rose-200",
  },
};
