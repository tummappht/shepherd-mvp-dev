"use client";
import { SessionProvider } from "next-auth/react";
import { SocketStatusProvider } from "@/context/SocketStatusContext";

export default function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <SocketStatusProvider>{children}</SocketStatusProvider>
    </SessionProvider>
  );
}
