import { CheckCircle2, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BulkResponse, Lead } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The leads that were targeted by the bulk action — used to look up names against result.index. */
  targetLeads: Lead[];
  result: BulkResponse;
  actionLabel: string;
}

export function BulkResultDialog({
  open,
  onOpenChange,
  targetLeads,
  result,
  actionLabel,
}: Props) {
  const failures = result.results.filter((r) => !r.success);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel} result</DialogTitle>
          <DialogDescription>
            {result.successful} succeeded, {result.failed} failed out of {result.total}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {result.successful} succeeded
          </span>
          <span className="h-4 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <XCircle className="h-4 w-4" />
            {result.failed} failed
          </span>
        </div>

        {failures.length > 0 && (
          <div className="max-h-60 overflow-auto rounded-md border border-border">
            <ul className="divide-y divide-border text-sm">
              {failures.map((f) => {
                const lead = targetLeads[f.index];
                return (
                  <li key={f.index} className="flex items-start gap-3 px-3 py-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{lead?.name ?? `Lead #${f.index}`}</p>
                      <p className="text-xs text-muted-foreground">{f.error}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
