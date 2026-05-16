import { STATUS_STYLES, statusLabel } from "@/lib/status";
import { STATUSES, type LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: LeadStatus[];
  onChange: (next: LeadStatus[]) => void;
}

/**
 * Pill-style multi-select. Click a pill to toggle. "All" clears the filter.
 * We use toggle pills rather than a dropdown because (a) there are only 5 values
 * and (b) the current selection is always visible at a glance.
 */
export function StatusFilter({ value, onChange }: Props) {
  const toggle = (s: LeadStatus) => {
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange([])}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
          value.length === 0
            ? "bg-primary text-primary-foreground ring-primary"
            : "bg-background text-muted-foreground ring-border hover:bg-accent",
        )}
        aria-pressed={value.length === 0}
      >
        All
      </button>
      {STATUSES.map((s) => {
        const active = value.includes(s);
        const styles = STATUS_STYLES[s];
        return (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
              active
                ? styles.badge
                : "bg-background text-muted-foreground ring-border hover:bg-accent",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} aria-hidden />
            {statusLabel(s)}
          </button>
        );
      })}
    </div>
  );
}
