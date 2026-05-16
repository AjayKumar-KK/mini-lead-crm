import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="text-muted-foreground">That route doesn't exist.</p>
      <Button asChild variant="outline">
        <Link to="/leads">Back to leads</Link>
      </Button>
    </div>
  );
}
