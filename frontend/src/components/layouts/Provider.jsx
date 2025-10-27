"use client";
import { SessionProvider } from "next-auth/react";
import { SocketStatusProvider } from "@/context/SocketStatusContext";
import SessionMonitor from "@/components/auth/SessionMonitor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider
      refetchInterval={30 * 60} // Refetch session every 30 minutes
      refetchOnWindowFocus={true}
    >
      <QueryClientProvider client={queryClient}>
        <SessionMonitor />
        <SocketStatusProvider>{children}</SocketStatusProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
