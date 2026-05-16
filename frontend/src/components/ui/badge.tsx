import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Adds a subtle ring + background. */
  tone?: "neutral" | "outline";
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone === "outline"
          ? "bg-transparent text-foreground/70 ring-border"
          : "bg-secondary text-secondary-foreground ring-transparent",
        className,
      )}
      {...props}
    />
  );
}
