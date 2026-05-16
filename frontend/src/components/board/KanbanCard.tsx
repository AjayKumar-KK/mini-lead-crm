import { useDraggable } from "@dnd-kit/core";
import { formatDistanceToNow } from "date-fns";
import { GripVertical, Lock } from "lucide-react";

import { isTerminal } from "@/lib/status";
import type { Lead } from "@/lib/types";
import { avatarColorFor, cn, initialsOf } from "@/lib/utils";

interface Props {
  lead: Lead;
  onClick?: (lead: Lead) => void;
}

export function KanbanCard({ lead, onClick }: Props) {
  const locked = isTerminal(lead.status);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
    disabled: locked,
  });

  return (
    <div
      ref={setNodeRef}
      data-dragging={isDragging}
      className={cn(
        "group flex select-none flex-col gap-2 rounded-md border border-border bg-background p-3 text-sm shadow-sm transition-shadow",
        isDragging && "opacity-50",
        !locked && "hover:shadow-md",
        locked && "opacity-90",
      )}
      onClick={() => onClick?.(lead)}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white",
            avatarColorFor(lead.id),
          )}
          aria-hidden
        >
          {initialsOf(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
        </div>
        {locked ? (
          <span
            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
            title="Status is locked — terminal"
          >
            <Lock className="h-3 w-3" />
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Drag ${lead.name}`}
            className="opacity-0 transition-opacity group-hover:opacity-100 cursor-grab active:cursor-grabbing"
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{lead.source ?? "—"}</span>
        <span title={new Date(lead.updated_at).toLocaleString()}>
          {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
