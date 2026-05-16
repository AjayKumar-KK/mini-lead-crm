export const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
export type LeadStatus = (typeof STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadCreateInput = {
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
};

export type LeadUpdateInput = Partial<LeadCreateInput>;

export interface BulkResultItem {
  index: number;
  success: boolean;
  error?: string;
  lead?: Lead;
}

export interface BulkResponse {
  total: number;
  successful: number;
  failed: number;
  results: BulkResultItem[];
}
