import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { router } from "@/routes/router";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // We're working against a mock; aggressive refetch isn't useful and is noisy.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  </React.StrictMode>,
);
