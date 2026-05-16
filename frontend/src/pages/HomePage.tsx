import { Link } from "react-router-dom";
import { ArrowRight, KanbanSquare, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-12 text-center">
      <div className="max-w-xl space-y-3">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Mock API live on :4000
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Mini Lead CRM</h1>
        <p className="text-muted-foreground">
          A focused workspace for moving leads through the pipeline. Built for the Superleap
          Frontend Intern assessment — three levels, one URL-state model, optimistic updates
          throughout.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/leads">
            <Users className="h-4 w-4" /> Open leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/board">
            <KanbanSquare className="h-4 w-4" /> Open board
          </Link>
        </Button>
      </div>
    </div>
  );
}
