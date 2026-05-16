import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatDistanceToNow } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { LeadRowActions } from "@/components/leads/LeadRowActions";
import type { SortDir, SortKey } from "@/hooks/useUrlFilters";
import type { Lead, LeadStatus } from "@/lib/types";
import { avatarColorFor, cn, initialsOf } from "@/lib/utils";

interface Props {
  leads: Lead[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onTransition: (lead: Lead, status: LeadStatus) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
}

const ROW_HEIGHT = 56;

/**
 * Virtualized leads table. We keep the <table> semantics — the rows are styled
 * <div role="row"> children that the virtualizer mounts and unmounts.
 *
 * We deliberately use a CSS grid for the rows (instead of <tr>) because table
 * rows can't be absolutely positioned in the way react-virtual needs. Roles
 * preserve screen-reader semantics: role="table" / "rowgroup" / "row" / "cell".
 *
 * The column header is a real semantic <table> — it doesn't need virtualization
 * and we want correct alignment with the body via shared grid template.
 */
export function LeadsTable({
  leads,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  onTransition,
  sortKey,
  sortDir,
  onSortChange,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const someSelected = !allSelected && leads.some((l) => selectedIds.has(l.id));

  const items = virtualizer.getVirtualItems();

  // Shared grid template for header + rows so columns line up perfectly.
  const gridTemplate = useMemo(
    () =>
      "40px minmax(0,2fr) minmax(0,2.2fr) 130px minmax(0,1fr) 140px 56px",
    [],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div
        role="rowgroup"
        className="grid items-center border-b border-border bg-muted/40 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="flex items-center justify-center py-2">
          <Checkbox
            aria-label={allSelected ? "Deselect all" : "Select all"}
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(c) => onToggleSelectAll(c === true)}
          />
        </div>
        <SortHeader label="Name" k="name" current={sortKey} dir={sortDir} onClick={onSortChange} />
        <div className="py-2">Email</div>
        <SortHeader
          label="Status"
          k="status"
          current={sortKey}
          dir={sortDir}
          onClick={onSortChange}
        />
        <div className="py-2">Source</div>
        <SortHeader
          label="Updated"
          k="updated_at"
          current={sortKey}
          dir={sortDir}
          onClick={onSortChange}
        />
        <div className="py-2 text-right pr-1">Actions</div>
      </div>

      {/* Body — virtualized */}
      <div
        ref={parentRef}
        role="table"
        aria-rowcount={leads.length}
        aria-label="Leads"
        className="relative flex-1 overflow-auto scrollbar-thin"
      >
        <div
          role="rowgroup"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {items.map((virtualRow) => {
            const lead = leads[virtualRow.index]!;
            const selected = selectedIds.has(lead.id);
            return (
              <div
                role="row"
                key={lead.id}
                data-selected={selected}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: gridTemplate,
                }}
                className={cn(
                  "grid cursor-pointer items-center border-b border-border/60 px-3 text-sm transition-colors",
                  selected ? "bg-accent/40" : "hover:bg-accent/30",
                )}
                onClick={() => onView(lead)}
              >
                <div
                  className="flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    aria-label={`Select ${lead.name}`}
                    checked={selected}
                    onCheckedChange={(c) => onToggleSelect(lead.id, c === true)}
                  />
                </div>

                <div className="flex min-w-0 items-center gap-2.5 py-2">
                  <div
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white",
                      avatarColorFor(lead.id),
                    )}
                    aria-hidden
                  >
                    {initialsOf(lead.name)}
                  </div>
                  <span className="truncate font-medium">{lead.name}</span>
                </div>

                <div className="min-w-0 truncate text-muted-foreground" title={lead.email}>
                  {lead.email}
                </div>

                <div>
                  <StatusBadge status={lead.status} />
                </div>

                <div className="truncate text-muted-foreground">{lead.source ?? "—"}</div>

                <div className="text-muted-foreground" title={new Date(lead.updated_at).toLocaleString()}>
                  {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
                </div>

                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <LeadRowActions
                    lead={lead}
                    onView={() => onView(lead)}
                    onEdit={() => onEdit(lead)}
                    onDelete={() => onDelete(lead)}
                    onTransition={(s) => onTransition(lead, s)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  k,
  current,
  dir,
  onClick,
}: {
  label: string;
  k: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = current === k;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onClick(k)}
      className={cn(
        "flex h-full items-center gap-1 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}
