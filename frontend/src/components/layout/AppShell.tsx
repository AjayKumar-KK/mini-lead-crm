import { NavLink, Outlet } from "react-router-dom";
import {
  ChevronsRight,
  Home,
  KanbanSquare,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/leads", label: "Leads", icon: Users, end: false },
  { to: "/board", label: "Board", icon: KanbanSquare, end: false },
];

export function AppShell() {
  return (
    <div className="grid h-full grid-cols-[240px_minmax(0,1fr)] bg-zinc-50">
      <aside className="flex flex-col gap-2 border-r border-border bg-background px-3 py-4">
        <div className="flex items-center gap-2 px-2 pb-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ChevronsRight className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Superleap CRM</div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-md border border-dashed border-border/70 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Mini Lead CRM</p>
          <p className="mt-1">
            Built for the Superleap Frontend Intern assessment. Mock API on{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">:4000</code>.
          </p>
        </div>
      </aside>
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
