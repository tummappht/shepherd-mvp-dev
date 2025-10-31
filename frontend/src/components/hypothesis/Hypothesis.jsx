"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import MessageRenderer from "./MessageRenderer";
import MessagePrefix from "./MessagePrefix";
import LoadingIndicator from "./LoadingIndicator";
import { useWebSocketConnection } from "@/hook/useWebSocketConnection";
import { useRunCleanup } from "@/hook/useRunCleanup";
import EditSessionNameModal from "@/components/modals/EditSessionNameModal";
import { useQueryClient } from "@tanstack/react-query";

// Constants
const AUTO_FOCUS_DELAY = 100;
const CANCEL_RUN_DEFAULT_DELAY = 5000;

export default function Hypothesis({ queryParamRunId, queryParamSessionName }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Hooks
  const {
    API_BASE,
    runId,
    getSingletonWS,
    socketUrl,
    socketStatus: contextSocketStatus,
    handleCancelRun,
    handleSaveWaitlistEmail,
    handleGetUserSessions,
  } = useRuns(queryParamRunId);

  // State
  const [sessionName, setSessionName] = useState(
    queryParamSessionName || "Loading..."
  );
  const [messages, setMessages] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [runStatus, setRunStatus] = useState(RUN_STATUS.INITIALIZING);
  const [extraInput, setExtraInput] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // WebSocket message processing hook
  const { processMessage } = useWebSocketMessages({
    addMessage,
    addUserMessage,
    setWaitingForInput,
    setRunStatus,
    setExtraInput,
    cancelRun,
    focusInput,
    isReadOnly,
  });

  // WebSocket connection management
  const { socketRef, startedRef } = useWebSocketConnection({
    socketUrl,
    runId,
    queryParamRunId,
    contextSocketStatus,
    getSingletonWS,
    handleGetUserSessions,
    processMessage,
    saveWaitlistEmail,
    setSessionName,
    setRunStatus,
    router,
    API_BASE,
  });

  // Run cleanup on page unload
  useRunCleanup({ runId, API_BASE, startedRef });

  // Auto-focus input when waiting for user input
  useEffect(() => {
    if (waitingForInput) {
      focusInput();
    }
  }, [waitingForInput, focusInput]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (value, type) => {
      if (!waitingForInput) return;

      const lastMessage = messages[messages.length - 1];
      const lastMessageText = lastMessage?.text?.toLowerCase() || "";
      const isSystemMessage = lastMessage?.from === "system";

      const isAskingForInterfaces =
        isSystemMessage &&
        lastMessageText.includes(
          MESSAGE_PATTERNS.NON_DEPLOYABLE_FILES_PROMPT.toLowerCase()
        );
      if (!value?.trim() && !isAskingForInterfaces) {
        return;
      }

      const isRunAnotherPrompt =
        isSystemMessage &&
        lastMessageText.includes(
          MESSAGE_PATTERNS.RUN_ANOTHER_MAS_PROMPT.toLowerCase()
        );

      // Handle "run another MAS" prompt
      if (isRunAnotherPrompt) {
        const userChoice = value === "yes" ? "y" : "n";

        addUserMessage(value, type);
        sendSocketMessage(userChoice);

        if (userChoice === "n") {
          addMessage("Session has ended successfully.", MESSAGE_TYPES.END);
          cancelRun();
        }

        setWaitingForInput(false);
        setExtraInput(null);
        return;
      }

      // Handle regular input
      addUserMessage(value, type);
      sendSocketMessage(value);
      setWaitingForInput(false);
      setExtraInput(null);
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

  const statusColor = useMemo(() => {
    const statusMap = {
      [RUN_STATUS.STARTED]:
        "text-text-success border-stroke-success bg-bg-success",
      [RUN_STATUS.AT_CAPACITY]:
        "text-text-error border-stroke-error bg-bg-error",
      [RUN_STATUS.ERROR]: "text-text-error border-stroke-error bg-bg-error",
      [RUN_STATUS.ENDED]:
        "text-text-pending border-stroke-pending bg-bg-pending",
    };
    return (
      statusMap[runStatus] ||
      "text-text-pending border-stroke-pending bg-bg-pending"
    );
  }, [runStatus]);

  const shouldShowLoading = useMemo(
    () => runStatus !== RUN_STATUS.ENDED && !waitingForInput,
    [runStatus, waitingForInput]
  );

  const handleEditSession = useCallback(() => {
    setCurrentSession({
      run_id: runId,
      session_name: sessionName,
    });
    setIsEditModalOpen(true);
  }, [runId, sessionName]);

  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTimeout(() => setCurrentSession(null), 300);
  }, []);

  // Update session name when query cache changes
  useEffect(() => {
    if (!runId) return;

    const updateSessionName = () => {
      const cachedData = queryClient.getQueryData(["userSessions"]);
      if (cachedData?.pages) {
        for (const page of cachedData.pages) {
          const session = page.sessions?.find((s) => s.run_id === runId);
          if (session?.session_name) {
            setSessionName(session.session_name);
            break;
          }
        }
      }
    };

    // Subscribe to query changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.query?.queryKey?.[0] === "userSessions" &&
        event?.type === "updated"
      ) {
        updateSessionName();
      }
    });

    return () => unsubscribe();
  }, [runId, queryClient]);

  return (
    <div className="text-white w-full bg-surface flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-9 py-6 border-b border-stroke">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{sessionName}</p>
          {isReadOnly && (
            <button
              type="button"
              onClick={handleEditSession}
              className="text-secondary hover:text-white transition-colors p-1 hover:bg-background rounded"
              aria-label="Edit session name"
            >
              <TbEdit className="text-md" />
            </button>
          )}
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
              <MessagePrefix msg={msg} index={index} messages={messages} />
              <MessageRenderer msg={msg} />
            </div>
          ))}

          {shouldShowLoading && <LoadingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <HypothesisInput
        waitingForInput={waitingForInput}
        extraInput={extraInput}
        handleSend={handleSend}
      />

      {/* Edit Session Name Modal */}
      <EditSessionNameModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        session={currentSession}
        setSessionName={setSessionName}
      />
    </div>
  );
}

Hypothesis.propTypes = {
  queryParamRunId: PropTypes.string,
  queryParamSessionName: PropTypes.string,
};
