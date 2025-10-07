"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getSocketUrl } from "@/services/utils";
import { cancelRun, saveWaitlistEmail, serviceStartRun } from "@/services/runs";

const getSingletonWS = (url) => {
  if (typeof window === "undefined") return new WebSocket(url);
  const pool = (window.__masWsPool ||= new Map());
  const existing = pool.get(url);
  if (existing && existing.readyState < 2) return existing; // 0 CONNECTING, 1 OPEN
  const ws = new WebSocket(url);
  pool.set(url, ws);
  ws.addEventListener("close", () => {
    if (pool.get(url) === ws) pool.delete(url);
  });
  return ws;
};

export function useWebSocket({ runId, onMessage, enabled = true }) {
  const socketRef = useRef(null);
  const socketUrl = useMemo(() => getSocketUrl(runId), [runId]);
  const [isConnected, setIsConnected] = useState(false);

  const startRunMutation = useMutation({
    mutationFn: (formData) => serviceStartRun(runId, formData),
  });

  const cancelRunMutation = useMutation({
    mutationFn: (runId) => cancelRun(runId),
  });

  const waitlistMutation = useMutation({
    mutationFn: saveWaitlistEmail,
  });

  return {
    socket: socketRef.current,
    isConnected,
    cancelRun: cancelRunMutation.mutate,
  };
}
