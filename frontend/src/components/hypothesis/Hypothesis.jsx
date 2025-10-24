"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PropTypes from "prop-types";
import { useRuns, WEBSOCKET_CLOSE_CODES } from "@/hook/useRuns";
import {
  useWebSocketMessages,
  MESSAGE_TYPES,
  MESSAGE_PATTERNS,
  RUN_STATUS,
} from "@/hook/useWebSocketMessages";
import { TbEdit } from "react-icons/tb";
import HypothesisInput from "./HypothesisInput";
import TreeSelect from "../treeSelect/TreeSelect";

// Constants
const AUTO_FOCUS_DELAY = 100;
const CANCEL_RUN_DEFAULT_DELAY = 5000;

export default function Hypothesis({
  title,
  onMinimize,
  minimized,
  queryParamRunId,
}) {
  const {
    API_BASE,
    runId,
    getSingletonWS,
    socketUrl,
    socketStatus: contextSocketStatus,
    isRenderAsMarkdown,
    handleCancelRun,
    handleSaveWaitlistEmail,
    handleGetUserSessions,
  } = useRuns(queryParamRunId);
  const [messages, setMessages] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [runStatus, setRunStatus] = useState(RUN_STATUS.INITIALIZING);
  const [options, setOptions] = useState([]);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const startedRef = useRef(false);
  const inputRef = useRef(null);

  const router = useRouter();

  // ============================================================================
  // Message Handling
  // ============================================================================

  const addMessage = useCallback((text, type = MESSAGE_TYPES.DESCRIPTION) => {
    if (!text) return;
    setMessages((prev) => [...prev, { from: "system", text, type }]);
    setRunStatus(RUN_STATUS.STARTED);
  }, []);

  const addUserMessage = useCallback((text, type) => {
    setMessages((prev) => [...prev, { from: "user", text, type }]);
  }, []);

  const focusInput = useCallback(() => {
    setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      AUTO_FOCUS_DELAY
    );
  }, []);

  const sendSocketMessage = useCallback((data) => {
    if (!socketRef.current) {
      console.error("WebSocket not connected");
      return;
    }
    socketRef.current.send(JSON.stringify({ type: "input", data }));
  }, []);

  // ============================================================================
  // API Helpers
  // ============================================================================

  const cancelRun = useCallback(
    async (delayMs = CANCEL_RUN_DEFAULT_DELAY) => {
      try {
        await handleCancelRun(delayMs);
        setWaitingForInput(false);
        if (socketRef.current) {
          socketRef.current.close(
            WEBSOCKET_CLOSE_CODES.NORMAL,
            "Run cancelled"
          );
          socketRef.current = null;
          console.log("Closing WebSocket connection ");
        }
      } catch (error) {
        console.error("Failed to cancel run:", error);
      }
    },
    [handleCancelRun]
  );

  const saveWaitlistEmail = useCallback(
    async (email) => {
      if (!email?.trim()) return;

      try {
        await handleSaveWaitlistEmail(email);
      } catch (error) {
        // Error is already handled in the hook
        console.error("Failed to save email:", error);
      }
    },
    [handleSaveWaitlistEmail]
  );

  const isReadOnly = useMemo(() => Boolean(queryParamRunId), [queryParamRunId]);

  // Use WebSocket message processing hook
  const { processMessage } = useWebSocketMessages({
    addMessage,
    addUserMessage,
    setWaitingForInput,
    setRunStatus,
    setOptions,
    cancelRun,
    focusInput,
    isReadOnly,
  });

  // ============================================================================
  // Effects
  // ============================================================================

  // Auto-focus input when waiting for user input
  useEffect(() => {
    if (waitingForInput) {
      focusInput();
    }
  }, [waitingForInput, focusInput]);

  // cancels run if the tab closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (startedRef.current && runId) {
        // Use navigator.sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(
          `${API_BASE}/runs/${runId}/cancel`,
          new Blob([JSON.stringify({ runId })], { type: "application/json" })
        );
        // Method 2: Backup fetch with keepalive
        fetch(`${API_BASE}/runs/${runId}/cancel`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
          keepalive: true, // Keeps request alive during page unload
        }).catch(() => {
          console.log("Backup fetch failed (expected during reload)");
        });
      }
    };

    // Add event listeners for page close/reload
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [API_BASE, runId]);

  // WebSocket setup and management
  useEffect(() => {
    if (!socketUrl) return;

    if (!startedRef.current) {
      startedRef.current = true;
      console.log("Starting run for runId:", runId);
      const startRunThenSocket = async () => {
        try {
          let socketStatus = contextSocketStatus;
          const isQueryParamRunId =
            queryParamRunId && queryParamRunId.length > 0;
          let responseStatus = null;
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
              // router.push("/new-test");
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
                // router.push("/new-test");
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
            // router.push("/"); // Redirect to home page
            return;
          } else if (responseStatus !== 202) {
            setRunStatus("Error");
            console.warn("Unexpected status code:", responseStatus);
            const email = prompt(
              "Something went wrong! Enter your email to be notified when we've got a fix:"
            );
            await saveWaitlistEmail(email);
            router.push("/new-test");
            return;
          } else {
            setRunStatus("Error");
            console.warn("result status not parsed correctly");
          }
        } catch (error) {
          // ignore; if the run already exists, WS streaming should still work
          console.error("Error in startRunThenSocket:", error);
          console.error("Error details:", error.message, error.stack);
        }
      };
      startRunThenSocket();
    }
  }, [socketUrl, runId, queryParamRunId, handleGetUserSessions]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================================================
  // User Input Handling
  // ============================================================================

  const handleSend = useCallback(
    (value, type) => {
      if (!waitingForInput) return;

      const lastMessage = messages[messages.length - 1];

      // Allow empty input only for non-deployable files prompt
      const isAskingForInterfaces =
        lastMessage?.from === "system" &&
        lastMessage.text
          .toLowerCase()
          .includes(MESSAGE_PATTERNS.NON_DEPLOYABLE_FILES_PROMPT);

      if (!value.trim() && !isAskingForInterfaces) return;

      // Handle "run another MAS" prompt - cancel if user declines
      const isRunAnotherPrompt =
        lastMessage?.from === "system" &&
        lastMessage.text
          .toLowerCase()
          .includes(MESSAGE_PATTERNS.RUN_ANOTHER_MAS_PROMPT);

      if (isRunAnotherPrompt) {
        const userResponse = value.trim().toLowerCase();

        if (userResponse !== "y" && userResponse !== "yes") {
          console.log("User declined to run another MAS - canceling run");
          addUserMessage(value, type);
          sendSocketMessage(value);
          addMessage("Session has ended successfully.", MESSAGE_TYPES.END);
          cancelRun();
          setWaitingForInput(false);
          return;
        }
      }

      addUserMessage(value, type);
      sendSocketMessage(value);
      setWaitingForInput(false);
      setOptions([]);
    },
    [
      waitingForInput,
      messages,
      addUserMessage,
      sendSocketMessage,
      addMessage,
      cancelRun,
    ]
  );

  // ============================================================================
  // UI Helpers
  // ============================================================================

  const statusColor = useMemo(() => {
    switch (runStatus) {
      case RUN_STATUS.STARTED:
        return "text-text-success border-stroke-success bg-bg-success";
      case RUN_STATUS.AT_CAPACITY:
      case RUN_STATUS.ERROR:
        return "text-text-error border-stroke-error bg-bg-error";
      case RUN_STATUS.ENDED:
        return "text-text-pending border-stroke-pending bg-bg-pending";
      default:
        return "text-text-pending border-stroke-pending bg-bg-pending";
    }
  }, [runStatus]);

  const renderMessagePrefix = useCallback((msg, index, messages) => {
    const isOption = msg.type === MESSAGE_TYPES.OPTION;
    const isFromUser = msg.from === "user";

    if (isFromUser || isOption) {
      return null;
    }

    const isPrompt = msg.type === MESSAGE_TYPES.PROMPT;
    const isLastMessage = index === messages.length - 1;
    const showConnectorLine = !isLastMessage && !isPrompt;
    const circleColor = isPrompt ? "border-primary" : "border-white";

    return (
      <>
        <span
          className={`border ${circleColor} w-2 h-2 absolute top-2 left-2 rounded-full`}
        />
        {showConnectorLine && (
          <span className="border border-secondary border-dashed absolute top-6 left-[11px] h-[calc(100%-1rem)]" />
        )}
      </>
    );
  }, []);

  const renderMessage = useCallback(
    (msg) => {
      const isFromUser = msg.from === "user";

      if (isFromUser) {
        const isOption = msg.type === MESSAGE_TYPES.OPTION;

        if (isOption) {
          return <TreeSelect options={JSON.parse(msg.text)} readOnly />;
        }

        return (
          <span className="whitespace-pre-wrap bg-background-light text-white border border-stroke-light py-3 px-5 rounded-lg w-full">
            {msg.text}
          </span>
        );
      }

      const isWhiteText =
        msg.type === MESSAGE_TYPES.PROMPT || msg.type === MESSAGE_TYPES.END;
      const textColor = isWhiteText ? "text-white" : "text-secondary";

      if (isRenderAsMarkdown(msg.text)) {
        return (
          <div className={`pl-7 ${textColor}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.text}
            </ReactMarkdown>
          </div>
        );
      }

      return (
        <span className={`whitespace-pre-wrap pl-7 ${textColor}`}>
          {msg.text}
        </span>
      );
    },
    [isRenderAsMarkdown]
  );

  const renderLoadingIndicator = useCallback(() => {
    if (runStatus === RUN_STATUS.ENDED || waitingForInput) {
      return null;
    }

    return (
      <div className="flex justify-start">
        <div className="px-4 py-2 rounded-lg text-sm bg-[#141414] text-gray-300">
          <div className="flex space-x-1 items-center">
            <div className="flex space-x-1 ml-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }, [runStatus, waitingForInput]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="text-white w-full bg-surface flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-9 py-6 border-b border-stroke">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{title}</p>
          <button type="button" onClick={onMinimize} aria-label="Minimize">
            <TbEdit className="text-md text-secondary" />
          </button>
        </div>
        <div
          className={`flex items-center border ${statusColor} rounded-md h-[30px] px-4`}
        >
          <span>{runStatus}</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex flex-col flex-1 px-7 py-3 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className="flex gap-3 relative">
              {renderMessagePrefix(msg, index, messages)}
              {renderMessage(msg)}
            </div>
          ))}

          {renderLoadingIndicator()}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <HypothesisInput
        waitingForInput={waitingForInput}
        options={options}
        handleSend={handleSend}
      />
    </div>
  );
}

Hypothesis.propTypes = {
  title: PropTypes.string.isRequired,
  onMinimize: PropTypes.func.isRequired,
  minimized: PropTypes.bool,
  queryParamRunId: PropTypes.string,
};
