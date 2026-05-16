import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/pages/HomePage";
import { LeadsPage } from "@/pages/LeadsPage";
import { BoardPage } from "@/pages/BoardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Routing notes:
 *  - /leads is the list view. It also handles /leads/new, /leads/:id, and
 *    /leads/:id/edit by reading the URL and pre-opening the relevant dialog.
 *    This keeps every view deep-linkable AND avoids an extra page-load for
 *    what is essentially a modal interaction.
 *  - /board is the Kanban view. Filters and search live in the query string
 *    so they're preserved when the user switches between /leads and /board.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "leads",
        element: <LeadsPage />,
        children: [
          { path: "new", element: null },
          { path: ":id", element: null },
          { path: ":id/edit", element: null },
        ],
      },
      { path: "board", element: <BoardPage /> },
      { path: "404", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
