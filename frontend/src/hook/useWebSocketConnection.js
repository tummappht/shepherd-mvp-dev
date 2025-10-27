import { useEffect, useRef } from "react";
import { WEBSOCKET_CLOSE_CODES } from "@/hook/useRuns";

export const useWebSocketConnection = ({
  socketUrl,
  runId,
  queryParamRunId,
  contextSocketStatus,
  getSingletonWS,
  handleGetUserSessions,
  processMessage,
  saveWaitlistEmail,
  setRunStatus,
  router,
  API_BASE,
}) => {
  const socketRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!socketUrl) return;

    if (!startedRef.current) {
      startedRef.current = true;
      console.log("Starting run for runId:", runId);

      const startRunThenSocket = async () => {
        try {
          const socketStatus = contextSocketStatus;
          const isQueryParamRunId =
            queryParamRunId && queryParamRunId.length > 0;

          if (isQueryParamRunId || socketStatus === "started") {
            const socket = getSingletonWS(socketUrl);
            socketRef.current = socket;

            // Load user session when socket opens (for queryParamRunId)
            const onOpen = async () => {
              console.log("🚀 ~ WebSocket opened, loading session");
              if (queryParamRunId) {
                try {
                  await handleGetUserSessions(queryParamRunId);
                } catch (error) {
                  console.error("Failed to fetch user session:", error);
                }
              }
            };

            const onMessage = (event) => {
              const raw = event.data;
              if (raw instanceof Blob) {
                raw
                  .text()
                  .then(processMessage)
                  .catch(() => {});
              } else {
                processMessage(raw);
              }
            };

            const onError = async (e) => {
              console.error("WebSocket error:", e);
              const email = prompt(
                "Connection failed! Something went wrong on our end. Enter your email to be notified when we've got a fix:"
              );
              await saveWaitlistEmail(email);
            };

            const onClose = async (e) => {
              if (
                e.code !== WEBSOCKET_CLOSE_CODES.NORMAL &&
                e.code !== WEBSOCKET_CLOSE_CODES.GOING_AWAY
              ) {
                const email = prompt(
                  "Connection lost unexpectedly! Enter your email to be notified when we've resolved the issue:"
                );
                await saveWaitlistEmail(email);
              }
            };

            // Add event listeners
            socket.addEventListener("message", onMessage);
            socket.addEventListener("error", onError);
            socket.addEventListener("close", onClose);

            // Load session if socket is already open, otherwise wait for open event
            if (socket.readyState === WebSocket.OPEN) {
              onOpen();
            } else {
              socket.addEventListener("open", onOpen, { once: true });
            }
          } else if (
            socketStatus === "at_capacity" ||
            socketStatus === "at capacity" ||
            socketStatus === "queued"
          ) {
            setRunStatus("At capacity");
            const email = prompt(
              "Our server is at capacity! Enter your email to be notified when it's available again:"
            );
            await saveWaitlistEmail(email);
            return;
          } else {
            setRunStatus("Error");
            console.warn("result status not parsed correctly");
          }
        } catch (error) {
          console.error("Error in startRunThenSocket:", error);
          console.error("Error details:", error.message, error.stack);
        }
      };

      startRunThenSocket();
    }
  }, [
    socketUrl,
    runId,
    queryParamRunId,
    contextSocketStatus,
    getSingletonWS,
    handleGetUserSessions,
    processMessage,
    saveWaitlistEmail,
    setRunStatus,
    router,
    API_BASE,
  ]);

  return { socketRef, startedRef };
};
