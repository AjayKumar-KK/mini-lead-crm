import { ChevronDown, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isTerminal, nextStatusesFor, statusLabel, STATUS_STYLES } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  current: LeadStatus;
  onSelect: (next: LeadStatus) => void;
  disabled?: boolean;
  size?: "sm" | "default";
}

/**
 * The single source of truth for the "change status" UI on a single lead.
 * Only renders the valid next statuses — terminal states render a Lock pill instead.
 * Used in the table row dropdown AND on the detail page.
 */
export function StatusTransitionMenu({ current, onSelect, disabled, size = "sm" }: Props) {
  const options = nextStatusesFor(current);

  if (isTerminal(current)) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground"
        title={`Status is locked — ${statusLabel(current)} is terminal`}
      >
        <Lock className="h-3 w-3" />
        Locked
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} disabled={disabled}>
          Move to <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Next status</DropdownMenuLabel>
        {options.map((s) => {
          const styles = STATUS_STYLES[s];
          return (
            <DropdownMenuItem key={s} onSelect={() => onSelect(s)}>
              <span
                className={cn("inline-block h-2 w-2 rounded-full", styles.dot)}
                aria-hidden
              />
              {statusLabel(s)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
