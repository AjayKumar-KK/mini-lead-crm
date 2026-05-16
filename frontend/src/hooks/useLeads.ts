import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, leadsApi } from "@/lib/api";
import type {
  BulkResponse,
  Lead,
  LeadCreateInput,
  LeadStatus,
  LeadUpdateInput,
} from "@/lib/types";

/**
 * Query keys live here so cache invalidation stays consistent.
 * `leadKeys.list()` returns the SAME key for any filter combination — we
 * always fetch the full list and filter/search/sort client-side. That makes
 * search instantaneous, optimistic updates simple, and the cache trivial.
 */
export const leadKeys = {
  all: ["leads"] as const,
  list: () => [...leadKeys.all, "list"] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};

export function useLeadsQuery() {
  return useQuery({
    queryKey: leadKeys.list(),
    queryFn: ({ signal }) => leadsApi.list({}, signal),
  });
}

export function useLeadQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? leadKeys.detail(id) : ["leads", "detail", "noop"],
    queryFn: ({ signal }) => leadsApi.get(id!, signal),
    enabled: !!id,
  });
}

/* -------------------------------------------------------------------------- */
/*                                Mutations                                   */
/* -------------------------------------------------------------------------- */

function explainError(err: unknown): string {
  if (err instanceof ApiError) return err.serverMessage ?? err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function useCreateLead(
  options?: UseMutationOptions<Lead, unknown, LeadCreateInput>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (input: LeadCreateInput) => leadsApi.create(input),
    // Compose with caller-provided callbacks instead of letting options overwrite them.
    onSuccess: (lead, vars, ctx) => {
      qc.setQueryData<Lead[] | undefined>(leadKeys.list(), (prev) =>
        prev ? [lead, ...prev] : [lead],
      );
      toast.success("Lead created");
      options?.onSuccess?.(lead, vars, ctx);
    },
    onError: (err, vars, ctx) => {
      toast.error(explainError(err));
      options?.onError?.(err, vars, ctx);
    },
  });
}

export function useUpdateLead(
  options?: UseMutationOptions<Lead, unknown, { id: string; input: LeadUpdateInput }>,
) {
  const qc = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, input }) => leadsApi.update(id, input),
    onSuccess: (lead, vars, ctx) => {
      qc.setQueryData<Lead[] | undefined>(leadKeys.list(), (prev) =>
        prev ? prev.map((l) => (l.id === lead.id ? lead : l)) : prev,
      );
      qc.setQueryData(leadKeys.detail(lead.id), lead);
      toast.success("Lead updated");
      options?.onSuccess?.(lead, vars, ctx);
    },
    onError: (err, vars, ctx) => {
      toast.error(explainError(err));
      options?.onError?.(err, vars, ctx);
    },
  });
}

/**
 * Optimistic delete: we remove the lead from the cache immediately, and
 * roll back from a snapshot if the API rejects the request.
 */
export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: leadKeys.list() });
      const prev = qc.getQueryData<Lead[]>(leadKeys.list());
      qc.setQueryData<Lead[] | undefined>(leadKeys.list(), (curr) =>
        curr ? curr.filter((l) => l.id !== id) : curr,
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(leadKeys.list(), ctx.prev);
      toast.error(explainError(err));
    },
    onSuccess: () => toast.success("Lead deleted"),
  });
}

/**
 * Optimistic status transition. Two callers use this — the row-level dropdown
 * and the Kanban DnD handler — so the optimistic patch lives here, not in either UI.
 */
export function useTransitionLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      leadsApi.transition(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: leadKeys.list() });
      const prev = qc.getQueryData<Lead[]>(leadKeys.list());
      const now = new Date().toISOString();
      qc.setQueryData<Lead[] | undefined>(leadKeys.list(), (curr) =>
        curr
          ? curr.map((l) => (l.id === id ? { ...l, status, updated_at: now } : l))
          : curr,
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(leadKeys.list(), ctx.prev);
      toast.error(explainError(err));
    },
    onSuccess: (lead) => {
      qc.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

/* ------------------------------- Bulk ------------------------------------- */

export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => leadsApi.bulkDelete(ids),
    onSuccess: (res: BulkResponse, ids) => {
      // Drop the successfully-deleted ones from the cache. Failures stay so the UI
      // can show "X succeeded, Y failed" without a refetch round-trip.
      const failedIdx = new Set(res.results.filter((r) => !r.success).map((r) => r.index));
      const stillPresent = new Set<string>();
      ids.forEach((id, i) => {
        if (failedIdx.has(i)) stillPresent.add(id);
      });
      qc.setQueryData<Lead[] | undefined>(leadKeys.list(), (curr) =>
        curr ? curr.filter((l) => stillPresent.has(l.id) || !ids.includes(l.id)) : curr,
      );
    },
    onError: (err) => toast.error(explainError(err)),
  });
}

export function useBulkTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: LeadStatus }) =>
      leadsApi.bulkTransition(ids, status),
    onSuccess: (res: BulkResponse) => {
      // Each successful result returns the fresh lead — patch them into the cache.
      const updates = new Map<string, Lead>();
      for (const r of res.results) {
        if (r.success && r.lead) updates.set(r.lead.id, r.lead);
      }
      qc.setQueryData<Lead[] | undefined>(leadKeys.list(), (curr) =>
        curr ? curr.map((l) => updates.get(l.id) ?? l) : curr,
      );
    },
    onError: (err) => toast.error(explainError(err)),
  });
}
