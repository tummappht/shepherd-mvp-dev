import { useSocketStatus } from "@/context/SocketStatusContext";
import { serviceStartRun } from "@/services/runs";
import { API_BASE } from "@/services/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Constants
const RUN_ID_STORAGE_KEY = "masRunId";
const RUN_ID_EVENT_NAME = "mas:runId";

const generateRunId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `run-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const dispatchCustomEvent = (eventName, detail) => {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch (error) {
    console.error(`Failed to dispatch custom event ${eventName}:`, error);
  }
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

export const useRuns = () => {
  const { setSocketStatus, socketStatus } = useSocketStatus();
  const [runId, setRunId] = useState(getOrCreateRunId);
  const runIdRef = useRef(runId);

  useEffect(() => {
    runIdRef.current = runId;
  }, [runId]);

  useEffect(() => {
    dispatchCustomEvent(RUN_ID_EVENT_NAME, runId);
  }, [runId]);

  const socketUrl = useMemo(() => {
    if (!runId) return null;

    try {
      const url = new URL(API_BASE);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = url.pathname.replace(/\/$/, "") + `/ws/${runId}`;
      return url.toString();
    } catch (error) {
      console.error("Failed to create WebSocket URL:", error);
      return null;
    }
  }, [runId]);

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
    dispatchCustomEvent(RUN_ID_EVENT_NAME, newRunId);
  }, []);

  // Start a new run with the provided form data
  const handleStartRun = useCallback(async (formData) => {
    try {
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
      dispatchCustomEvent(RUN_ID_EVENT_NAME, newRunId);

      // Call the API to start the run
      const response = await serviceStartRun(newRunId, formData);

      if (!response.success) {
        throw new Error(`API error: ${response.status || "Unknown error"}`);
      }

      return response.data;
    } catch (error) {
      console.error("Failed to start run:", error);
      throw error;
    }
  }, []);

  return {
    API_BASE,
    runId,
    socketUrl,
    socketStatus,
    isRenderAsMarkdown,
    handleStartRun,
    resetRunId,
    getSingletonWS: getSingletonWebSocket,
    setSocketStatus,
  };
};
