"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import TokenRefreshHandler from "@/components/auth/TokenRefreshHandler";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      }),
  );

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        <TokenRefreshHandler />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
