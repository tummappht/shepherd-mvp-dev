"use client";
import { SessionProvider } from "next-auth/react";
import { SocketStatusProvider } from "@/context/SocketStatusContext";
import SessionMonitor from "@/components/auth/SessionMonitor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
      })
  );

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        {/* <SessionMonitor /> */}
        <SocketStatusProvider>{children}</SocketStatusProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
