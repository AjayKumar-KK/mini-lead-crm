import * as React from "react";

import { cn } from "@/lib/utils";

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-separate border-spacing-0", className)}
      {...props}
    />
  ),
);
Table.displayName = "Table";

export const THead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-muted/40 sticky top-0 z-10", className)}
    {...props}
  />
));
THead.displayName = "THead";

export const TBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props} />
));
TBody.displayName = "TBody";

export const Tr = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition-colors hover:bg-accent/30 data-[selected=true]:bg-accent/40",
        className,
      )}
      {...props}
    />
  ),
);
Tr.displayName = "Tr";

export const Th = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    scope="col"
    className={cn(
      "h-10 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border",
      className,
    )}
    {...props}
  />
));
Th.displayName = "Th";

export const Td = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-3 py-3 align-middle border-b border-border/60 text-sm", className)}
    {...props}
  />
));
Td.displayName = "Td";
