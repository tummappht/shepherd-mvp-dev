export const RUN_ID_STORAGE_KEY = "masRunId";

export const generateRunId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `run-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const getOrCreateRunId = () => {
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

const wsPool = new Map();
export function getSingletonWebSocket(url) {
  if (typeof window === "undefined") return null;

  const existing = wsPool.get(url);
  if (existing && existing.readyState < WebSocket.CLOSING) {
    return existing;
  }

  const ws = new WebSocket(url);
  wsPool.set(url, ws);

  const cleanup = () => {
    if (wsPool.get(url) === ws) wsPool.delete(url);
  };

  ws.addEventListener("close", cleanup);
  ws.addEventListener("error", cleanup);

  return ws;
}
