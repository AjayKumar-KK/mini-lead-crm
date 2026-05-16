import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nextStatusesFor, isTerminal, statusLabel, STATUS_STYLES } from "@/lib/status";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  lead: Lead;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTransition: (status: LeadStatus) => void;
}

export function LeadRowActions({ lead, onView, onEdit, onDelete, onTransition }: Props) {
  const nexts = nextStatusesFor(lead.status);
  const locked = isTerminal(lead.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${lead.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="h-4 w-4" /> View
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {locked ? (
          <DropdownMenuItem disabled>Status locked</DropdownMenuItem>
        ) : (
          nexts.map((s) => {
            const styles = STATUS_STYLES[s];
            return (
              <DropdownMenuItem key={s} onSelect={() => onTransition(s)}>
                <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden />
                Move to {statusLabel(s)}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
