import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { KanbanCard } from "@/components/board/KanbanCard";
import { KanbanColumn } from "@/components/board/KanbanColumn";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { SearchBox } from "@/components/leads/SearchBox";
import { StatusFilter } from "@/components/leads/StatusFilter";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback/States";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useLeadsQuery, useTransitionLead } from "@/hooks/useLeads";
import { canTransition, statusLabel, TRANSITIONS } from "@/lib/status";
import { STATUSES, type Lead, type LeadStatus } from "@/lib/types";

/**
 * Kanban /board view.
 *
 * Filter + search state is shared with /leads via URL params — switching between
 * the two views preserves what the user is looking at.
 *
 * Drag behavior:
 *  - We compute "valid target" for the active card vs each column on every render.
 *    Invalid columns get a red ring; valid ones get a green ring.
 *  - On drop, we re-check `canTransition` locally and, if invalid, surface a toast
 *    and skip the API call entirely — exactly what the brief asks for.
 *  - Valid drops fire `useTransitionLead`, which already does optimistic update + rollback.
 */
export function BoardPage() {
  const { filters, setFilters } = useUrlFilters();
  const debouncedQ = useDebouncedValue(filters.q, 150);

  const { data: leads, isLoading, isError, error, refetch, isFetching } = useLeadsQuery();
  const transition = useTransitionLead();

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [openDetail, setOpenDetail] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  /* ------------------------ Derived: filtered leads ------------------------- */

  const visibleLeads = useMemo(() => {
    if (!leads) return [];
    const q = debouncedQ.trim().toLowerCase();
    let out = leads;

    if (filters.status.length) {
      const set = new Set(filters.status);
      out = out.filter((l) => set.has(l.status));
    }
    if (q) {
      out = out.filter(
        (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q),
      );
    }
    return out;
  }, [leads, filters.status, debouncedQ]);

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      CONVERTED: [],
      LOST: [],
    };
    for (const l of visibleLeads) map[l.status].push(l);
    return map;
  }, [visibleLeads]);

  /* --------------------------------- DnD ----------------------------------- */

  const onDragStart = (e: DragStartEvent) => {
    const lead = (e.active.data.current as { lead?: Lead } | undefined)?.lead;
    if (lead) setActiveLead(lead);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveLead(null);
    if (!e.over) return;

    const lead = (e.active.data.current as { lead?: Lead } | undefined)?.lead;
    const targetStatus = (e.over.data.current as { status?: LeadStatus } | undefined)?.status;
    if (!lead || !targetStatus) return;
    if (lead.status === targetStatus) return; // dropped on its own column

    if (!canTransition(lead.status, targetStatus)) {
      // No API call — surface why the move was rejected.
      const allowed = TRANSITIONS[lead.status]
        .map((s) => statusLabel(s))
        .join(" or ");
      toast.error(
        `Can't move ${lead.name} → ${statusLabel(targetStatus)}.`,
        {
          description: allowed
            ? `From ${statusLabel(lead.status)} you can only move to ${allowed}.`
            : `${statusLabel(lead.status)} is a terminal state.`,
        },
      );
      return;
    }

    transition.mutate({ id: lead.id, status: targetStatus });
  };

  /* --------------------------------- UI ------------------------------------ */

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline board</h1>
          <p className="text-sm text-muted-foreground">
            Drag a lead between columns to move it through the pipeline.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
        <SearchBox value={filters.q} onChange={(v) => setFilters({ q: v })} />
        <StatusFilter value={filters.status} onChange={(s) => setFilters({ status: s })} />
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <LoadingState label="Loading board…" />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Could not reach the mock API. Is it running on :4000?"
            }
            onRetry={() => refetch()}
          />
        ) : visibleLeads.length === 0 ? (
          <EmptyState
            title="No leads to show"
            description="Adjust filters or create a lead from the Leads view."
          />
        ) : (
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="grid h-full min-h-0 grid-cols-5 gap-3">
              {STATUSES.map((s) => (
                <KanbanColumn
                  key={s}
                  status={s}
                  leads={leadsByStatus[s]}
                  activeStatus={activeLead?.status ?? null}
                  isValidTarget={
                    !!activeLead && canTransition(activeLead.status, s)
                  }
                  onCardClick={setOpenDetail}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? <KanbanCard lead={activeLead} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {openDetail && (
        <LeadDetailDialog
          open
          lead={openDetail}
          onOpenChange={(o) => !o && setOpenDetail(null)}
        />
      )}
    </div>
  );
}
