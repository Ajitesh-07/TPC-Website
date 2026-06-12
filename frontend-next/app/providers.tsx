"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleProvider } from "@/components/providers/RoleProvider";
import type { Role } from "@/lib/roles";

export default function Providers({
  initialRole,
  children,
}: {
  initialRole?: Role;
  children: ReactNode;
}) {
  // Create the client once per browser session (lazy initial state).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider initialRole={initialRole}>{children}</RoleProvider>
    </QueryClientProvider>
  );
}
