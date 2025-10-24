import { useSocketStatus } from "@/context/SocketStatusContext";
import {
  serviceStartRun,
  serviceCancelRun,
  serviceSaveWaitlistEmail,
  getWebSocketUrl,
} from "@/services/runs";
import { API_BASE } from "@/services/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { serviceUserSessionByRunId } from "@/services/user";
import { useSession } from "next-auth/react";

// Constants
const RUN_ID_STORAGE_KEY = "masRunId";

export const WEBSOCKET_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
};

const generateRunId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `run-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const getOrCreateRunId = () => {
  if (typeof window === "undefined") {
    return generateRunId();
  }

  try {
    const stored = sessionStorage.getItem(RUN_ID_STORAGE_KEY);
    if (stored) return stored;

    const newId = generateRunId();
    sessionStorage.setItem(RUN_ID_STORAGE_KEY, newId);
    return newId;
  } catch (error) {
    console.error("Failed to access sessionStorage:", error);
    return generateRunId();
  }
};

const getSingletonWebSocket = (url) => {
  if (typeof window === "undefined") {
    return new WebSocket(url);
  }

  // Initialize the WebSocket pool if it doesn't exist
  const pool = (window.__masWsPool ||= new Map());

  // Check if we already have a connection to this URL
  const existing = pool.get(url);
  if (existing && existing.readyState < WebSocket.CLOSING) {
    return existing; // CONNECTING or OPEN
  }

  // Create a new connection
  const ws = new WebSocket(url);
  pool.set(url, ws);

  // Clean up when the connection closes
  ws.addEventListener("close", () => {
    if (pool.get(url) === ws) {
      pool.delete(url);
    }
  });

  return ws;
};

const isRenderAsMarkdown = (text) => {
  return Boolean(text?.includes("|"));
};

export const useRuns = (queryParamRunId = null) => {
  const { data: session } = useSession();

  const { setSocketStatus, socketStatus } = useSocketStatus();
  const [runId, setRunId] = useState(
    () => queryParamRunId || getOrCreateRunId()
  );
  const hasInitializedWithExistingId = useRef(false);

  // Update runId if queryParamRunId changes (only once on mount or when it changes)
  useEffect(() => {
    if (queryParamRunId && !hasInitializedWithExistingId.current) {
      hasInitializedWithExistingId.current = true;
      setRunId(queryParamRunId);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(RUN_ID_STORAGE_KEY, queryParamRunId);
        } catch (error) {
          console.error("Failed to update sessionStorage:", error);
        }
      }
    }
  }, [queryParamRunId]);

  const socketUrl = useMemo(() => {
    if (queryParamRunId) {
      if (session) {
        const userId = session?.user?.id || "";
        return getWebSocketUrl(`${userId}_${queryParamRunId}`);
      }
    } else {
      return getWebSocketUrl(runId);
    }

    return null;
  }, [queryParamRunId, runId, session]);

  const resetRunId = useCallback(() => {
    const newRunId = generateRunId();

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(RUN_ID_STORAGE_KEY, newRunId);
      } catch (error) {
        console.error("Failed to update sessionStorage:", error);
      }
    }

    setRunId(newRunId);
  }, []);

  // React Query mutation for starting a run
  const startRunMutation = useMutation({
    mutationFn: async (formData) => {
      // Generate a fresh runId for every run
      const newRunId = generateRunId();

      // Update session storage and dispatch event
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(RUN_ID_STORAGE_KEY, newRunId);
        } catch (error) {
          console.error("Failed to update sessionStorage:", error);
        }
      }

      setRunId(newRunId);

      // Call the API to start the run
      return await serviceStartRun(newRunId, formData);
    },
    onError: (error) => {
      console.error("Failed to start run:", error);
    },
  });

  // React Query mutation for canceling a run
  const cancelRunMutation = useMutation({
    mutationFn: async (delayMs = 0) => {
      return await serviceCancelRun(runId, delayMs);
    },
    onError: (error) => {
      console.error("Failed to cancel run:", error);
    },
  });

  // React Query mutation for saving waitlist email
  const saveWaitlistEmailMutation = useMutation({
    mutationFn: async (email) => {
      return await serviceSaveWaitlistEmail(email);
    },
    retry: false,
    onError: (error) => {
      console.error("Failed to save email:", error);
      alert("Failed to save your email. Please try again later.");
    },
  });

  // React Query mutation for getting user sessions
  const getUserSessionsMutation = useMutation({
    mutationFn: async (runId) => {
      return await serviceUserSessionByRunId(runId);
    },
    retry: false,
    onError: (error) => {
      console.error("Failed to get user sessions:", error);
      alert("Failed to get user sessions. Please try again later.");
    },
  });

  // Start a new run with the provided form data
  const handleStartRun = useCallback(
    async (formData) => {
      return startRunMutation.mutateAsync(formData);
    },
    [startRunMutation]
  );

  // Cancel the current run
  const handleCancelRun = useCallback(
    async (delayMs = 0) => {
      return cancelRunMutation.mutateAsync(delayMs);
    },
    [cancelRunMutation]
  );

  // Save waitlist email
  const handleSaveWaitlistEmail = useCallback(
    async (email) => {
      return saveWaitlistEmailMutation.mutateAsync(email);
    },
    [saveWaitlistEmailMutation]
  );

  // Get User Sessions
  const handleGetUserSessions = useCallback(
    async (runId) => {
      return getUserSessionsMutation.mutateAsync(runId);
    },
    [getUserSessionsMutation]
  );

  return {
    API_BASE,
    runId,
    socketUrl,
    socketStatus,
    isRenderAsMarkdown,
    handleStartRun,
    handleCancelRun,
    handleSaveWaitlistEmail,
    handleGetUserSessions,
    resetRunId,
    getSingletonWS: getSingletonWebSocket,
    setSocketStatus,
    // Expose mutation states for UI feedback
    isStartingRun: startRunMutation.isPending,
    isCancelingRun: cancelRunMutation.isPending,
    isSavingEmail: saveWaitlistEmailMutation.isPending,
    isGettingUserSessions: getUserSessionsMutation.isPending,
  };
};
