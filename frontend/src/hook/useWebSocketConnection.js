import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { WEBSOCKET_CLOSE_CODES } from "@/hook/useRuns";
import { RUN_STATUS } from "./useWebSocketMessages";
import { serviceGetRunStatus } from "@/services/runs";
// import { mockResultsHypothesis } from "@/mocks/mockHypothesis";

export const useWebSocketConnection = ({
  socketUrl,
  runId,
  queryParamRunId,
  getSingletonWS,
  handleGetUserSessions,
  processMessage,
  saveWaitlistEmail,
  setSessionName,
  setRunStatus,
  router,
  API_BASE,
}) => {
  const socketRef = useRef(null);
  const startedRef = useRef(false);

  // Fetch run status using react-query
  const { data: runStatusData, isSuccess: isRunStatusSuccess } = useQuery({
    queryKey: ["runStatus", runId],
    queryFn: () => {
      return serviceGetRunStatus(runId);
    },
    enabled: false,
  });

  useEffect(() => {
    if (!socketUrl) return;
    if (!isRunStatusSuccess) return;

    if (!startedRef.current) {
      startedRef.current = true;
      console.log("Starting run for runId:", runId);

      const startRunThenSocket = async () => {
        try {
          const isQueryParamRunId =
            queryParamRunId && queryParamRunId.length > 0;

          // Use runStatus from react-query if available
          const socketStatus = runStatusData?.status || "";

          if (
            isQueryParamRunId ||
            socketStatus === "started" ||
            socketStatus === "running"
          ) {
            const socket = getSingletonWS(socketUrl);
            socketRef.current = socket;

            // Load user session when socket opens (for queryParamRunId)
            const onOpen = async () => {
              console.log("🚀 ~ WebSocket opened, loading session");
              if (queryParamRunId) {
                try {
                  const userSession = await handleGetUserSessions(
                    queryParamRunId
                  );
                  setSessionName(userSession?.session?.session_name || "");
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
            setRunStatus(RUN_STATUS.AT_CAPACITY);
            const email = prompt(
              "Our server is at capacity! Enter your email to be notified when it's available again:"
            );
            await saveWaitlistEmail(email);
            return;
          } else {
            setRunStatus(RUN_STATUS.ERROR);
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
    getSingletonWS,
    handleGetUserSessions,
    processMessage,
    saveWaitlistEmail,
    setSessionName,
    setRunStatus,
    router,
    API_BASE,
    runStatusData,
    isRunStatusSuccess,
  ]);

  return { socketRef, startedRef };
};
