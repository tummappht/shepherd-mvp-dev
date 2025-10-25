import { useEffect } from "react";

export const useRunCleanup = ({ runId, API_BASE, startedRef }) => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (startedRef.current && runId) {
        // Use navigator.sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(
          `${API_BASE}/runs/${runId}/cancel`,
          new Blob([JSON.stringify({ runId })], { type: "application/json" })
        );

        // Backup fetch with keepalive
        fetch(`${API_BASE}/runs/${runId}/cancel`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
          keepalive: true,
        }).catch(() => {
          console.log("Backup fetch failed (expected during reload)");
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [API_BASE, runId, startedRef]);
};
