import { useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/leads/ConfirmDialog";
import { BulkResultDialog } from "@/components/leads/BulkResultDialog";
import { useBulkDelete, useBulkTransition } from "@/hooks/useLeads";
import {
  intersectionOfNextStatuses,
  STATUS_STYLES,
  statusLabel,
} from "@/lib/status";
import type { BulkResponse, Lead, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  selectedLeads: Lead[];
  onClear: () => void;
}

export function BulkActionBar({ selectedLeads, onClear }: Props) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [result, setResult] = useState<{
    actionLabel: string;
    response: BulkResponse;
    targets: Lead[];
  } | null>(null);

  const bulkDelete = useBulkDelete();
  const bulkTransition = useBulkTransition();

  /**
   * Only offer bulk transitions that are legal for *every* selected lead.
   * If any selected lead is terminal (CONVERTED/LOST), the intersection is empty
   * and we show a tooltip-style explanation instead of an enabled menu.
   */
  const sharedNextStatuses: LeadStatus[] = useMemo(
    () => intersectionOfNextStatuses(selectedLeads.map((l) => l.status)),
    [selectedLeads],
  );

  const hasTerminal = selectedLeads.some(
    (l) => l.status === "CONVERTED" || l.status === "LOST",
  );

  if (selectedLeads.length === 0) return null;

  const handleBulkDelete = async () => {
    const targets = [...selectedLeads];
    const res = await bulkDelete.mutateAsync(targets.map((l) => l.id));
    setConfirmDeleteOpen(false);
    setResult({ actionLabel: "Delete", response: res, targets });
    if (res.failed === 0) onClear();
  };

  const handleBulkTransition = async (status: LeadStatus) => {
    const targets = [...selectedLeads];
    const res = await bulkTransition.mutateAsync({
      ids: targets.map((l) => l.id),
      status,
    });
    setResult({ actionLabel: `Move to ${statusLabel(status)}`, response: res, targets });
    if (res.failed === 0) onClear();
  };

  return (
    <>
      <div
        role="region"
        aria-label="Bulk actions"
        className="sticky bottom-4 z-20 mx-auto flex w-fit min-w-[420px] max-w-2xl items-center gap-3 rounded-full border border-border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur"
      >
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
          {selectedLeads.length}
        </span>
        <span className="text-sm text-foreground">
          {selectedLeads.length === 1 ? "lead selected" : "leads selected"}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={sharedNextStatuses.length === 0}
                title={
                  sharedNextStatuses.length === 0
                    ? hasTerminal
                      ? "Selection contains a CONVERTED or LOST lead — no transitions are valid"
                      : "No shared next-status across the selection"
                    : undefined
                }
              >
                Change status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Valid for all selected</DropdownMenuLabel>
              {sharedNextStatuses.map((s) => {
                const styles = STATUS_STYLES[s];
                return (
                  <DropdownMenuItem key={s} onSelect={() => handleBulkTransition(s)}>
                    <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden />
                    {statusLabel(s)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={bulkDelete.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear selection">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete ${selectedLeads.length} lead${selectedLeads.length === 1 ? "" : "s"}?`}
        description="This cannot be undone. The leads will be permanently removed from the pipeline."
        confirmLabel="Delete"
        confirmVariant="destructive"
        busy={bulkDelete.isPending}
        onConfirm={handleBulkDelete}
      />

      {result && (
        <BulkResultDialog
          open={!!result}
          onOpenChange={(o) => !o && setResult(null)}
          targetLeads={result.targets}
          result={result.response}
          actionLabel={result.actionLabel}
        />
      )}
    </>
  );
}
