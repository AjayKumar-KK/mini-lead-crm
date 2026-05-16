import { STATUS_STYLES, statusLabel } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.badge,
        className,
      )}
      aria-label={`Status: ${statusLabel(status)}`}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {statusLabel(status)}
    </span>
  );
}
