import type {
  BulkResponse,
  Lead,
  LeadCreateInput,
  LeadStatus,
  LeadUpdateInput,
} from "./types";

/**
 * Base URL for the mock CRM API.
 * In dev, Vite proxies /api -> http://localhost:4000 (see vite.config.ts),
 * so we can build URLs as /api/leads regardless of where the server runs.
 * If you'd rather hit the mock directly, set VITE_API_BASE in a .env.local.
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

export class ApiError extends Error {
  status: number;
  /** Human-friendly message extracted from the server response, if any. */
  serverMessage?: string;
  constructor(message: string, status: number, serverMessage?: string) {
    super(message);
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { parseAs?: "json" | "void" },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let serverMessage: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      serverMessage = body?.error;
    } catch {
      // Some responses (204) or non-JSON errors. Fine — leave undefined.
    }
    throw new ApiError(
      serverMessage ?? `Request failed (${res.status})`,
      res.status,
      serverMessage,
    );
  }

  if (init?.parseAs === "void" || res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/* -------------------------------------------------------------------------- */
/*                                Leads API                                   */
/* -------------------------------------------------------------------------- */

export interface ListLeadsParams {
  status?: LeadStatus[];
  q?: string;
}

export const leadsApi = {
  list(params: ListLeadsParams = {}, signal?: AbortSignal): Promise<Lead[]> {
    const search = new URLSearchParams();
    if (params.status?.length) search.set("status", params.status.join(","));
    if (params.q) search.set("q", params.q);
    const qs = search.toString();
    return request<Lead[]>(`/leads${qs ? `?${qs}` : ""}`, { signal });
  },

  get(id: string, signal?: AbortSignal): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, { signal });
  },

  create(input: LeadCreateInput): Promise<Lead> {
    return request<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: LeadUpdateInput): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/leads/${id}`, { method: "DELETE", parseAs: "void" });
  },

  transition(id: string, status: LeadStatus): Promise<Lead> {
    return request<Lead>(`/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Note: the mock's PUT /leads/bulk does NOT change status (intentional, to match PUT /leads/:id).
  // For bulk status changes we issue parallel PATCHes and aggregate the result, which lets us
  // surface per-lead errors with the same shape the UI uses elsewhere.
  bulkTransition(ids: string[], status: LeadStatus): Promise<BulkResponse> {
    return Promise.allSettled(ids.map((id) => leadsApi.transition(id, status))).then(
      (settled): BulkResponse => {
        const results = settled.map((r, index) =>
          r.status === "fulfilled"
            ? { index, success: true, lead: r.value }
            : {
                index,
                success: false,
                error:
                  r.reason instanceof ApiError
                    ? r.reason.serverMessage ?? r.reason.message
                    : "Unknown error",
              },
        );
        return {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        };
      },
    );
  },

  bulkDelete(ids: string[]): Promise<BulkResponse> {
    return Promise.allSettled(ids.map((id) => leadsApi.remove(id))).then(
      (settled): BulkResponse => {
        const results = settled.map((r, index) =>
          r.status === "fulfilled"
            ? { index, success: true }
            : {
                index,
                success: false,
                error:
                  r.reason instanceof ApiError
                    ? r.reason.serverMessage ?? r.reason.message
                    : "Unknown error",
              },
        );
        return {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        };
      },
    );
  },
};
