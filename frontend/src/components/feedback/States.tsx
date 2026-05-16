import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex h-full min-h-[240px] max-w-md flex-col items-center justify-center gap-3 text-center"
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full min-h-[240px] max-w-md flex-col items-center justify-center gap-3 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
