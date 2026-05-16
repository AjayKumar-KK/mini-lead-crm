import { useDroppable } from "@dnd-kit/core";
import { Lock } from "lucide-react";

import { KanbanCard } from "@/components/board/KanbanCard";
import { isTerminal, statusLabel, STATUS_STYLES } from "@/lib/status";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  status: LeadStatus;
  leads: Lead[];
  activeStatus: LeadStatus | null;
  /** Whether the column is a valid drop target for the currently-dragged card. */
  isValidTarget: boolean;
  onCardClick?: (lead: Lead) => void;
}

/**
 * A single Kanban column. The droppable area covers the full column body so
 * users can drop anywhere — but we visually highlight whether the drop is
 * valid or rejected based on `isValidTarget` (computed by the parent from the
 * dragged card's status + the column's status).
 */
export function KanbanColumn({
  status,
  leads,
  activeStatus,
  isValidTarget,
  onCardClick,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const locked = isTerminal(status);
  const styles = STATUS_STYLES[status];

  const beingDragged = activeStatus !== null;
  const showInvalidHint = beingDragged && isOver && !isValidTarget;
  const showValidHint = beingDragged && isOver && isValidTarget;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${statusLabel(status)} column`}
      className={cn(
        "flex h-full min-w-[260px] flex-col rounded-lg border bg-background transition-colors",
        styles.column,
        showValidHint && "ring-2 ring-emerald-400/70",
        showInvalidHint && "ring-2 ring-destructive/70",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between border-b border-border px-3 py-2",
          locked && "bg-muted/40",
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden />
          <h2 className="text-sm font-semibold">{statusLabel(status)}</h2>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {leads.length}
          </span>
          {locked && (
            <span
              className="ml-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
              title="Terminal status — cards cannot move out"
            >
              <Lock className="h-3 w-3" />
              Locked
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 space-y-2 overflow-auto p-2 scrollbar-thin">
        {leads.length === 0 ? (
          <div className="grid h-24 place-items-center rounded border border-dashed border-border/70 text-xs text-muted-foreground">
            No leads
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onClick={onCardClick} />
          ))
        )}
      </div>
    </section>
  );
}
