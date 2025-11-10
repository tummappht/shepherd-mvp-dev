"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function TokenRefreshHandler() {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (!session?.customTokenExpiry) return;

    const checkAndRefresh = async () => {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = session.customTokenExpiry - now;
      const refreshThreshold = 5 * 60; // Refresh 5 minutes before expiry

      if (timeUntilExpiry < refreshThreshold) {
        console.log("Token expiring soon, refreshing session...");
        await update();
      }
    };

    // Check immediately
    checkAndRefresh();

    // Check every minute
    const interval = setInterval(checkAndRefresh, 60 * 1000);

    return () => clearInterval(interval);
  }, [session, update]);

  return null;
}
