import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { StatusFilter } from "@/components/leads/StatusFilter";
import { SearchBox } from "@/components/leads/SearchBox";
import { LeadFormDialog } from "@/components/leads/LeadFormDialog";
import { ConfirmDialog } from "@/components/leads/ConfirmDialog";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { BulkActionBar } from "@/components/leads/BulkActionBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback/States";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  useDeleteLead,
  useLeadsQuery,
  useTransitionLead,
} from "@/hooks/useLeads";

import type { Lead, LeadStatus } from "@/lib/types";

type Mode =
  | { kind: "none" }
  | { kind: "view"; lead: Lead }
  | { kind: "create" }
  | { kind: "edit"; lead: Lead }
  | { kind: "delete"; lead: Lead };

/**
 * The list view. Owns:
 *  - filtering, sorting, search (all driven from URL params via useUrlFilters)
 *  - row selection (local state — selection is a UI concern, not URL-worthy)
 *  - dialog mode (create / view / edit / delete) so only one dialog is open at a time
 *
 * Routing: nested routes /leads/:id, /leads/:id/edit, /leads/new pre-open the right
 * dialog when the user lands on the URL directly. See routes/router.tsx.
 */
export function LeadsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const { filters, setFilters } = useUrlFilters();
  const debouncedQ = useDebouncedValue(filters.q, 150);

  const { data: leads, isLoading, isError, error, refetch, isFetching } = useLeadsQuery();

  const deleteMutation = useDeleteLead();
  const transitionMutation = useTransitionLead();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>({ kind: "none" });

  /* ----------------- Open dialogs from the URL on first paint ---------------- */
  // The nested routes (/leads/:id, /leads/:id/edit, /leads/new) exist only to make
  // the dialogs deep-linkable. We read the URL and open the appropriate dialog —
  // we do NOT use <Outlet />, the LeadsPage renders the dialogs itself.

  useEffect(() => {
    if (!leads) return;
    if (params.id) {
      const lead = leads.find((l) => l.id === params.id);
      if (!lead) return;
      if (location.pathname.endsWith("/edit")) setMode({ kind: "edit", lead });
      else setMode({ kind: "view", lead });
    } else if (location.pathname === "/leads/new") {
      setMode({ kind: "create" });
    }
  }, [leads, params.id, location.pathname]);

  /* ------------------- Derive the filtered / sorted view --------------------- */

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
    // Sort
    const dir = filters.sortDir === "asc" ? 1 : -1;
    const key = filters.sortKey;
    out = [...out].sort((a, b) => {
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return out;
  }, [leads, filters.status, debouncedQ, filters.sortKey, filters.sortDir]);

  const selectedLeads = useMemo(
    () => visibleLeads.filter((l) => selectedIds.has(l.id)),
    [visibleLeads, selectedIds],
  );

  /* ------------------------------ Handlers --------------------------------- */

  const handleCloseDialog = () => {
    setMode({ kind: "none" });
    navigate(`/leads${location.search}`, { replace: true });
  };

  const handleEdit = (lead: Lead) => {
    setMode({ kind: "edit", lead });
    navigate(`/leads/${lead.id}/edit${location.search}`);
  };

  const handleView = (lead: Lead) => {
    setMode({ kind: "view", lead });
    navigate(`/leads/${lead.id}${location.search}`);
  };

  const handleDelete = (lead: Lead) => setMode({ kind: "delete", lead });

  const handleTransition = (lead: Lead, status: LeadStatus) => {
    transitionMutation.mutate({ id: lead.id, status });
  };

  const confirmDelete = async () => {
    if (mode.kind !== "delete") return;
    const id = mode.lead.id;
    await deleteMutation.mutateAsync(id);
    setSelectedIds((curr) => {
      const next = new Set(curr);
      next.delete(id);
      return next;
    });
    handleCloseDialog();
  };

  /* --------------------------------- UI ------------------------------------ */

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Browse, search, and move leads through your pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh leads"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setMode({ kind: "create" })}>
            <Plus className="h-3.5 w-3.5" /> New lead
          </Button>
        </div>
      </header>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
        <SearchBox value={filters.q} onChange={(v) => setFilters({ q: v })} />
        <StatusFilter value={filters.status} onChange={(s) => setFilters({ status: s })} />
      </div>

      {/* Counts */}
      {leads && (
        <div className="-mt-1 text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{visibleLeads.length}</span> of{" "}
          {leads.length} leads
          {filters.status.length > 0 && (
            <>
              {" "}
              · filtered by{" "}
              <span className="font-medium text-foreground">
                {filters.status.join(", ")}
              </span>
            </>
          )}
        </div>
      )}

      {/* Table area */}
      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <LoadingState label="Loading leads…" />
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
            title={leads && leads.length === 0 ? "No leads yet" : "No matching leads"}
            description={
              leads && leads.length === 0
                ? "Create your first lead to get started."
                : "Try clearing the search or adjusting the status filter."
            }
            action={
              leads && leads.length === 0 ? (
                <Button onClick={() => setMode({ kind: "create" })}>
                  <Sparkles className="h-4 w-4" /> Create lead
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ q: "", status: [] })}
                >
                  Reset filters
                </Button>
              )
            }
          />
        ) : (
          <LeadsTable
            leads={visibleLeads}
            selectedIds={selectedIds}
            onToggleSelect={(id, checked) =>
              setSelectedIds((curr) => {
                const next = new Set(curr);
                if (checked) next.add(id);
                else next.delete(id);
                return next;
              })
            }
            onToggleSelectAll={(checked) =>
              setSelectedIds((curr) => {
                const next = new Set(curr);
                if (checked) visibleLeads.forEach((l) => next.add(l.id));
                else visibleLeads.forEach((l) => next.delete(l.id));
                return next;
              })
            }
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTransition={handleTransition}
            sortKey={filters.sortKey}
            sortDir={filters.sortDir}
            onSortChange={(k) =>
              setFilters({
                sortKey: k,
                sortDir: filters.sortKey === k && filters.sortDir === "desc" ? "asc" : "desc",
              })
            }
          />
        )}
      </div>

      {/* Bulk action bar (floats above the table) */}
      <BulkActionBar
        selectedLeads={selectedLeads}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Dialogs */}
      {mode.kind === "create" && (
        <LeadFormDialog
          open
          onOpenChange={(o) => !o && handleCloseDialog()}
        />
      )}
      {mode.kind === "edit" && (
        <LeadFormDialog
          open
          lead={mode.lead}
          onOpenChange={(o) => !o && handleCloseDialog()}
        />
      )}
      {mode.kind === "view" && (
        <LeadDetailDialog
          open
          lead={mode.lead}
          onOpenChange={(o) => !o && handleCloseDialog()}
        />
      )}
      {mode.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setMode({ kind: "none" })}
          title={`Delete ${mode.lead.name}?`}
          description="This cannot be undone. The lead will be removed from the pipeline."
          confirmLabel="Delete"
          confirmVariant="destructive"
          busy={deleteMutation.isPending}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
