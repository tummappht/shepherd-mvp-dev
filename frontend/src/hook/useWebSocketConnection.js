import { useEffect, useRef } from "react";
import { WEBSOCKET_CLOSE_CODES } from "@/hook/useRuns";
import { RUN_STATUS } from "@/constants/session";
import { getSingletonWebSocket } from "@/lib/wsPool";

export const useWebSocketConnection = ({
  socketUrl,
  runId,
  queryParamRunId,
  handleGetUserSessions,
  processMessage,
  handleSaveWaitlistEmail,
  setSessionName,
  setRunStatus,
  runStatusData,
  isRunStatusSuccess,
}) => {
  const socketRef = useRef(null);
  const startedRef = useRef(false);

  // Store latest callbacks in refs to avoid stale closures
  const processMessageRef = useRef(processMessage);
  const handleGetUserSessionsRef = useRef(handleGetUserSessions);
  const handleSaveWaitlistEmailRef = useRef(handleSaveWaitlistEmail);
  const setSessionNameRef = useRef(setSessionName);
  const setRunStatusRef = useRef(setRunStatus);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    processMessageRef.current = processMessage;
    handleGetUserSessionsRef.current = handleGetUserSessions;
    handleSaveWaitlistEmailRef.current = handleSaveWaitlistEmail;
    setSessionNameRef.current = setSessionName;
    setRunStatusRef.current = setRunStatus;
  });

  // useEffect(() => {
  //   mockResultsHypothesis.forEach((x) => {
  //     processMessage(x.data);
  //   });
  // }, []);

  useEffect(() => {
    if (!socketUrl) return;
    if (startedRef.current) return;
    startedRef.current = true;

    if (!queryParamRunId) {
      if (!isRunStatusSuccess) return;

      let status = runStatusData?.status || "";
      if (!["started", "running"].includes(status) && !queryParamRunId) {
        if (["at_capacity", "queued", "at capacity"].includes(status)) {
          setRunStatusRef.current(RUN_STATUS.AT_CAPACITY);
          const email = prompt(
            "Server is at capacity. Enter email to get notified:"
          );
          handleSaveWaitlistEmailRef.current(email);
        } else {
          setRunStatusRef.current(RUN_STATUS.ERROR);
        }
        return;
      }
    }

    console.log("🚀 ~ useWebSocketConnection ~ socketUrl:", socketUrl);
    const ws = getSingletonWebSocket(socketUrl);
    socketRef.current = ws;

    // --- event handlers ---
    const onOpen = async () => {
      if (queryParamRunId) {
        console.log("🚀 ~ onOpen ~ queryParamRunId:", queryParamRunId);
        try {
          const userSession = await handleGetUserSessionsRef.current(
            queryParamRunId
          );
          setSessionNameRef.current(userSession?.session?.session_name || "");
        } catch (err) {
          console.error("Failed to fetch user session:", err);
        }
      }
    };

    const onMessage = (event) => {
      const raw = event.data;
      console.log("🚀 ~ onMessage ~ raw:", raw);
      if (raw instanceof Blob) {
        raw.text().then((text) => processMessageRef.current(text));
      } else {
        processMessageRef.current(raw);
      }
    };

    const onError = async () => {
      const email = prompt(
        "Connection error. Enter your email to get notified when fixed:"
      );
      await handleSaveWaitlistEmailRef.current(email);
    };

    const onClose = async (e) => {
      const code = e.code;

      if (
        code !== WEBSOCKET_CLOSE_CODES.NORMAL &&
        code !== WEBSOCKET_CLOSE_CODES.GOING_AWAY
      ) {
        const email = prompt(
          "Connection unexpectedly lost. Enter your email to be notified:"
        );
        await handleSaveWaitlistEmailRef.current(email);
      }
    };

    // --- attach listeners (ONE TIME only) ---
    ws.addEventListener("open", onOpen);
    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", onError);
    ws.addEventListener("close", onClose);

    // If already open, call open function manually
    if (ws.readyState === WebSocket.OPEN) {
      onOpen();
    }

    // --- cleanup on unmount ---
    return () => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("error", onError);
      ws.removeEventListener("close", onClose);
    };
  }, [socketUrl, runId, queryParamRunId, runStatusData, isRunStatusSuccess]);

  return { socketRef };
};
