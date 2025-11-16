import {
  CONTENT_TYPES,
  MESSAGE_PATTERNS,
  MESSAGE_TYPES,
  RUN_STATUS,
} from "@/constants/session";
import { useCallback, useMemo } from "react";

export const useWebSocketMessages = ({
  addMessage,
  addUserMessage,
  setWaitingForInput,
  setRunStatus,
  setExtraInput,
  cancelRun,
  focusInput,
  isReadOnly = false,
}) => {
  // ============================================================================
  // Message Type Handlers
  // ============================================================================

  const handlePromptMessage = useCallback(
    (msg) => {
      if (isReadOnly) return;

      let promptText = msg.data?.prompt || "";
      const isOptionsCase = promptText.includes(
        MESSAGE_PATTERNS.CONTRACT_SELECTION_PROMPT
      );
      const isChoice = promptText.includes(
        MESSAGE_PATTERNS.WHAT_WOULD_YOU_LIKE_TO_DO_NEXT_PROMPT
      );
      if (isOptionsCase) {
        try {
          const promptMsg = JSON.parse(promptText || "{}");
          promptText = promptMsg?.prompt || promptText;
          const options = promptMsg?.options || [];
          setExtraInput({ type: CONTENT_TYPES.OPTION, options });
        } catch {
          return;
        }
      }

      if (isChoice) {
        try {
          const promptMsg = JSON.parse(promptText || "{}");
          promptText = promptMsg?.prompt || promptText;
          const options = promptMsg?.choices || [];
          setExtraInput({ type: CONTENT_TYPES.CHOICE, options });
        } catch {
          return;
        }
      }

      const isRunAnotherMasPrompt = promptText
        .toLowerCase()
        .includes(MESSAGE_PATTERNS.RUN_ANOTHER_MAS_PROMPT);
      if (isRunAnotherMasPrompt) {
        setExtraInput({ type: CONTENT_TYPES.RADIO });
      }

      addMessage(promptText, MESSAGE_TYPES.PROMPT);
      setWaitingForInput(true);
      focusInput();
    },
    [addMessage, focusInput, setWaitingForInput, setExtraInput, isReadOnly]
  );

  const handleUserInputMessage = useCallback(
    (msg) => {
      if (!isReadOnly) return;

      let promptText = msg.data?.prompt || "";
      const value = msg.data?.value;

      // Start System message handling
      const isContractSelectionCase = promptText.includes(
        MESSAGE_PATTERNS.CONTRACT_SELECTION_PROMPT
      );
      if (isContractSelectionCase) {
        const promptMsg = JSON.parse(promptText || "{}");
        promptText = promptMsg?.prompt || promptText;
        addMessage(promptText, MESSAGE_TYPES.PROMPT);
        return;
      }

      const isSystemMessage = Boolean(
        msg.data?.value === null || msg.data?.value === undefined
      );
      if (isSystemMessage) {
        addMessage(promptText, MESSAGE_TYPES.PROMPT);
        return;
      }

      // Start User input message handling
      const isUpdatedChunkMapCase = promptText.includes(
        MESSAGE_PATTERNS.UPDATED_CHUNK_MAP_PROMPT
      );
      if (isUpdatedChunkMapCase) {
        addUserMessage(value, CONTENT_TYPES.OPTION);
        return;
      }

      const isRunAnotherMasPrompt = promptText
        .toLowerCase()
        .includes(MESSAGE_PATTERNS.RUN_ANOTHER_MAS_PROMPT);
      if (isRunAnotherMasPrompt) {
        var radioValue = value.includes("y") ? "yes" : "no";
        addUserMessage(radioValue, CONTENT_TYPES.RADIO);
        return;
      }

      addUserMessage(msg.data?.value || "", CONTENT_TYPES.INPUT);
      return;
    },
    [addMessage, addUserMessage, isReadOnly]
  );

  const handleDescriptionMessage = useCallback(
    (msg) => {
      addMessage(
        msg.data?.message || msg.data || "",
        MESSAGE_TYPES.DESCRIPTION
      );

      if (msg.data?.message === MESSAGE_PATTERNS.ENDING_RUN_MESSAGE) {
        setRunStatus(RUN_STATUS.ENDED);
      }
    },
    [addMessage, setRunStatus]
  );

  const handlePlannerStepMessage = useCallback(
    (msg) => {
      addMessage(
        msg.data?.content || msg.data || "",
        MESSAGE_TYPES.PLANNER_STEP
      );
    },
    [addMessage]
  );

  const handleExecutorToolCallMessage = useCallback(
    (msg) => {
      const toolName = msg.data?.tool_name || "Unknown Tool";
      addMessage(`Calling tool ${toolName}`, MESSAGE_TYPES.EXECUTOR_TOOL_CALL);
    },
    [addMessage]
  );

  const handleExecutorToolResultMessage = useCallback(
    (msg) => {
      const toolName = msg.data?.tool_name || "Tool";
      const status = msg.data?.status || "unknown";
      const output = msg.data?.tool_output || "";
      const errorType = msg.data?.error_type;
      const reason = msg.data?.reason;

      if (status === "error" || errorType) {
        addMessage(
          `${toolName}: ERROR - ${errorType || reason || "Unknown error"}`,
          MESSAGE_TYPES.EXECUTOR_TOOL_RESULT
        );
      } else {
        addMessage(
          `${toolName}: ${status} - ${output}`,
          MESSAGE_TYPES.EXECUTOR_TOOL_RESULT
        );
      }
    },
    [addMessage]
  );

  const handleAgentMessage = useCallback(
    (msg) => {
      const agentType = msg.data?.agent_type || "Unknown";
      const content = msg.data?.content || msg.data || "";
      const isArrayContent = Array.isArray(content);

      if (isArrayContent) {
        content.forEach((item) => {
          if (item.type === CONTENT_TYPES.TABLE) {
            addMessage(item, CONTENT_TYPES.TABLE);
          } else {
            addMessage(item.content, item.type);
          }
        });
        return;
      }

      addMessage(`${agentType} agent:\n${content}`, MESSAGE_TYPES.AGENT);
    },
    [addMessage]
  );

  const handleOutputMessage = useCallback(
    (msg) => {
      const message =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "";
      addMessage(message, MESSAGE_TYPES.OUTPUT);
    },
    [addMessage]
  );

  const handleIdleTimeoutMessage = useCallback(
    (msg) => {
      const message =
        String(msg.data?.message) ||
        "This run has been canceled due to inactivity";
      alert(message);
      cancelRun(502);
    },
    [cancelRun]
  );

  const handleCompleteMessage = useCallback(() => {
    console.log("Run complete");
    cancelRun();
  }, [cancelRun]);

  const handleStderrMessage = useCallback(
    (msg) => {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      addMessage(`Error: ${errorMsg}`, MESSAGE_TYPES.STDERR);
      cancelRun(503);
    },
    [addMessage, cancelRun]
  );

  const handleErrorMessage = useCallback(
    (msg) => {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      addMessage(`Error: ${errorMsg}`, MESSAGE_TYPES.ERROR);
      cancelRun(504);
      setRunStatus(RUN_STATUS.ERROR);
      setWaitingForInput(true);
    },
    [addMessage, cancelRun, setRunStatus, setWaitingForInput]
  );

  // Message type router
  const messageHandlers = useMemo(() => {
    const map = {
      [MESSAGE_TYPES.PROMPT.toLowerCase()]: handlePromptMessage,
      [MESSAGE_TYPES.USER_INPUT.toLowerCase()]: handleUserInputMessage,
      [MESSAGE_TYPES.DESCRIPTION.toLowerCase()]: handleDescriptionMessage,
      [MESSAGE_TYPES.PLANNER_STEP.toLowerCase()]: handlePlannerStepMessage,
      [MESSAGE_TYPES.EXECUTOR_TOOL_CALL.toLowerCase()]:
        handleExecutorToolCallMessage,
      [MESSAGE_TYPES.EXECUTOR_TOOL_RESULT.toLowerCase()]:
        handleExecutorToolResultMessage,
      [MESSAGE_TYPES.AGENT.toLowerCase()]: handleAgentMessage,
      [MESSAGE_TYPES.OUTPUT.toLowerCase()]: handleOutputMessage,
      [MESSAGE_TYPES.STDOUT.toLowerCase()]: handleOutputMessage,
      [MESSAGE_TYPES.LOG.toLowerCase()]: handleOutputMessage,
      [MESSAGE_TYPES.IDLE_TIMEOUT.toLowerCase()]: handleIdleTimeoutMessage,
      [MESSAGE_TYPES.COMPLETE.toLowerCase()]: handleCompleteMessage,
      [MESSAGE_TYPES.STDERR.toLowerCase()]: handleStderrMessage,
      [MESSAGE_TYPES.ERROR.toLowerCase()]: handleErrorMessage,
    };
    return map;
  }, [
    handlePromptMessage,
    handleUserInputMessage,
    handleDescriptionMessage,
    handlePlannerStepMessage,
    handleExecutorToolCallMessage,
    handleExecutorToolResultMessage,
    handleAgentMessage,
    handleOutputMessage,
    handleIdleTimeoutMessage,
    handleCompleteMessage,
    handleStderrMessage,
    handleErrorMessage,
  ]);

  // ============================================================================
  // Message Processing
  // ============================================================================

  const handleTaggedEnvelope = useCallback(
    (raw) => {
      const match = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
      if (!match) return false;

      const [, tag, content] = match;
      let inner = {};

      try {
        inner = JSON.parse(content);
      } catch {
        // Invalid JSON in envelope
      }

      const tagLower = (inner?.tag_type || tag || "").toString().toLowerCase();

      if (tagLower === MESSAGE_TYPES.DESCRIPTION) {
        addMessage(
          inner?.message || inner?.text || "",
          MESSAGE_TYPES.DESCRIPTION
        );
        cancelRun(501);
        return true;
      }

      if (tagLower === MESSAGE_TYPES.PROMPT) {
        const text = inner?.prompt || inner?.message || "";
        if (text) addMessage(text, MESSAGE_TYPES.PROMPT);
        setWaitingForInput(true);
        focusInput();
        return true;
      }

      return false;
    },
    [addMessage, cancelRun, focusInput, setWaitingForInput]
  );

  const processMessage = useCallback(
    async (raw) => {
      console.log("🚀 ~ raw:", raw);
      try {
        // if it's a Blob, convert to text
        if (typeof Blob !== "undefined" && raw instanceof Blob) {
          raw = await raw.text();
        }

        // handle tagged envelopes (string only)
        if (typeof raw === "string" && handleTaggedEnvelope(raw)) return;

        // if it's already an object, use it; otherwise parse
        let msg;
        if (typeof raw === "object") {
          msg = raw;
        } else {
          try {
            msg = JSON.parse(raw || "{}");
          } catch (err) {
            // invalid JSON — ignore or log
            if (process.env.NODE_ENV === "development") {
              console.warn("Invalid JSON message:", raw);
            }
            return;
          }
        }

        if (!msg?.type) return;

        const messageType = String(msg.type).toLowerCase();
        const handler = messageHandlers[messageType];
        if (handler) {
          handler(msg);
        }
      } catch (err) {
        console.error("processMessage error:", err);
      }
    },
    [handleTaggedEnvelope, messageHandlers]
  );

  return {
    processMessage,
    MESSAGE_TYPES,
    MESSAGE_PATTERNS,
    RUN_STATUS,
  };
};
