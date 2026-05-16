import { formatDistanceToNow } from "date-fns";
import { Mail, Phone, Tag, Calendar, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { StatusTransitionMenu } from "@/components/leads/StatusTransitionMenu";
import { useTransitionLead } from "@/hooks/useLeads";
import type { Lead } from "@/lib/types";
import { avatarColorFor, cn, initialsOf } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function LeadDetailDialog({ open, onOpenChange, lead }: Props) {
  const transition = useTransitionLead();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lead details</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-3 pb-2">
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white",
              avatarColorFor(lead.id),
            )}
            aria-hidden
          >
            {initialsOf(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{lead.name}</p>
            <p className="truncate text-sm text-muted-foreground">{lead.email}</p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <dl className="grid grid-cols-1 gap-2.5 border-t border-border pt-3 text-sm">
          <DetailRow icon={Mail} label="Email" value={lead.email} />
          {lead.phone && <DetailRow icon={Phone} label="Phone" value={lead.phone} />}
          {lead.source && <DetailRow icon={Tag} label="Source" value={lead.source} />}
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(lead.created_at).toLocaleString()}
          />
          <DetailRow
            icon={Clock}
            label="Updated"
            value={`${formatDistanceToNow(new Date(lead.updated_at))} ago`}
          />
        </dl>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <StatusTransitionMenu
            current={lead.status}
            onSelect={(next) => transition.mutate({ id: lead.id, status: next })}
            disabled={transition.isPending}
            size="default"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_80px_minmax(0,1fr)] items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value}</dd>
    </div>
  );
}
