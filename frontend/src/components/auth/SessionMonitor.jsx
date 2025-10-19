"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { clearAuthToken } from "@/services/utils";

export default function SessionMonitor() {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      // Check if token is close to expiry and trigger refresh
      const checkTokenRefresh = async () => {
        if (session.customTokenExpiry) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = session.customTokenExpiry - now;
          const refreshThreshold = 7 * 24 * 60 * 60; // 7 days

          // If less than 7 days remaining, trigger session update to refresh token
          if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
            // Clear old token before refresh
            clearAuthToken();
            await update();
          }
        }
      };

      // Check immediately
      checkTokenRefresh();

      // Check every hour
      const interval = setInterval(checkTokenRefresh, 60 * 60 * 1000);

      return () => clearInterval(interval);
    } else if (status === "unauthenticated") {
      // Clear token cache when user is not authenticated
      clearAuthToken();
    }
  }, [session, status, update]);

  return null;
}
