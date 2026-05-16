import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { STATUSES, type LeadStatus } from "@/lib/types";

export type SortKey = "updated_at" | "created_at" | "name" | "status";
export type SortDir = "asc" | "desc";

export interface UrlFilters {
  q: string;
  status: LeadStatus[];
  sortKey: SortKey;
  sortDir: SortDir;
}

const VALID_SORT_KEYS: SortKey[] = ["updated_at", "created_at", "name", "status"];

/**
 * Read & write the filter/search/sort state from the URL. We deliberately
 * keep these in the query string so every filtered view is shareable —
 * and so /leads and /board read from the same source of truth, which is
 * how filters "persist" when the user switches views.
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: UrlFilters = useMemo(() => {
    const rawStatus = searchParams.get("status") ?? "";
    const status = rawStatus
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is LeadStatus => STATUSES.includes(s as LeadStatus));

    const sortKey = (searchParams.get("sort") as SortKey) || "updated_at";
    const sortDir = (searchParams.get("dir") as SortDir) || "desc";

    return {
      q: searchParams.get("q") ?? "",
      status,
      sortKey: VALID_SORT_KEYS.includes(sortKey) ? sortKey : "updated_at",
      sortDir: sortDir === "asc" ? "asc" : "desc",
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<UrlFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          if ("q" in patch) {
            if (patch.q) next.set("q", patch.q);
            else next.delete("q");
          }
          if ("status" in patch) {
            if (patch.status && patch.status.length) next.set("status", patch.status.join(","));
            else next.delete("status");
          }
          if ("sortKey" in patch && patch.sortKey) next.set("sort", patch.sortKey);
          if ("sortDir" in patch && patch.sortDir) next.set("dir", patch.sortDir);

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
