"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getSocketUrl } from "@/services/utils";
import { cancelRun, saveWaitlistEmail, startRun } from "@/services/runs";

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
    mutationFn: (formData) => startRun(runId, formData),
  });

  const cancelRunMutation = useMutation({
    mutationFn: (runId) => cancelRun(runId),
  });

  const waitlistMutation = useMutation({
    mutationFn: saveWaitlistEmail,
  });

  // Message type handlers
  const MESSAGE_HANDLERS = {
    description: (msg, { applyMessage, cancelRun }) => {
      applyMessage(msg.data?.message || msg.data || "");
      cancelRun(501);
    },

    prompt: (
      msg,
      { applyMessage, setWaitingForInput, inputRef, repoUrl, socketRef }
    ) => {
      const promptText = msg.data?.prompt || "";

      // Auto-respond to GitHub URL prompts
      if (promptText.includes("Please enter a GitHub URL")) {
        console.log("🔗 Auto-responding to GitHub URL prompt with:", repoUrl);

        if (repoUrl && socketRef.current) {
          socketRef.current.send(
            JSON.stringify({ type: "input", data: repoUrl })
          );
          console.log("Auto-sent repo URL:", repoUrl);
        } else {
          console.error("No repo URL available or WebSocket not connected");
          applyMessage("Error: No repository URL available");
          MESSAGE_HANDLERS._showPrompt(msg, {
            applyMessage,
            setWaitingForInput,
            inputRef,
          });
        }
        return;
      }

      MESSAGE_HANDLERS._showPrompt(msg, {
        applyMessage,
        setWaitingForInput,
        inputRef,
      });
    },

    _showPrompt: (msg, { applyMessage, setWaitingForInput, inputRef }) => {
      applyMessage(msg.data?.prompt || msg.data?.message || "");
      setWaitingForInput(true);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    },

    "planner-step": (msg, { applyMessage }) => {
      applyMessage(msg.data?.content || msg.data || "");
    },

    "executor-tool-call": (msg, { applyMessage }) => {
      applyMessage(`Calling tool ${msg.data?.tool_name || "Unknown Tool"}`);
    },

    "executor-tool-result": (msg, { applyMessage }) => {
      const {
        tool_name: toolName = "Tool",
        status = "unknown",
        tool_output: output = "",
        error_type: errorType,
        reason,
      } = msg.data || {};

      if (status === "error" || errorType) {
        applyMessage(
          `${toolName}: ERROR - ${errorType || reason || "Unknown error"}`
        );
      } else {
        applyMessage(`${toolName}: ${status} - ${output}`);
      }
    },

    agent: (msg, { applyMessage }) => {
      const agentType = msg.data?.agent_type || "Unknown";
      const content = msg.data?.content || msg.data || "";
      applyMessage(`${agentType} agent:\n${content}`);
    },

    output: (msg, { applyMessage }) => {
      const message =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "";
      applyMessage(message);
    },

    idle_timeout: (msg, { cancelRun }) => {
      alert(
        String(msg.data?.message) ||
          "This run has been canceled due to inactivity"
      );
      cancelRun(502);
    },

    complete: (msg, { cancelRun }) => {
      console.log("user entered N");
      cancelRun();
    },

    stderr: (msg, { applyMessage, cancelRun }) => {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      applyMessage(`Error: ${errorMsg}`);
      cancelRun(503);
    },

    error: (
      msg,
      { applyMessage, cancelRun, setRunStatus, setWaitingForInput }
    ) => {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      applyMessage(`Error: ${errorMsg}`);
      cancelRun(504);
      setRunStatus("Error");
      setWaitingForInput(true);
    },
  };

  // Alias handlers
  MESSAGE_HANDLERS.stdout = MESSAGE_HANDLERS.output;
  MESSAGE_HANDLERS.log = MESSAGE_HANDLERS.output;

  const processRaw = (raw, context) => {
    console.log(raw);

    // 1) Handle tagged envelopes like <<<DESCRIPTION>>>{json}<<<END_DESCRIPTION>>>
    if (typeof raw === "string") {
      const match = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
      if (match) {
        const [, tag, content] = match;
        let inner = {};

        try {
          inner = JSON.parse(content);
        } catch (e) {
          console.error("Failed to parse tagged message:", e);
        }

        const tagLower = (inner?.tag_type || tag || "")
          .toString()
          .toLowerCase();
        const handler = MESSAGE_HANDLERS[tagLower];

        if (handler) {
          handler({ data: inner }, context);
          return;
        }
      }
    }

    // 2) Handle JSON payloads { type, data }
    let msg;
    try {
      msg = JSON.parse(raw || "{}");
    } catch (e) {
      console.error("Failed to parse JSON message:", e);
      return;
    }

    if (!msg?.type) return;

    const messageType = String(msg.type).toLowerCase();
    const handler = MESSAGE_HANDLERS[messageType];

    if (handler) {
      handler(msg, context);
    } else {
      console.warn("Unknown message type:", messageType, msg);
    }
  };

  useEffect(() => {
    if (!socketUrl || !enabled) return;

    const socket = getSingletonWS(socketUrl);
    socketRef.current = socket;

    const handleMessage = (event) => {
      const raw = event.data;
      if (raw instanceof Blob) {
        raw
          .text()
          .then(processRaw)
          .catch(() => {});
      } else {
        processRaw(raw);
      }
    };

    const handleOpen = () => setIsConnected(true);

    const handleError = async (e) => {
      console.error("WebSocket error:", e);
      const email = prompt(
        "Connection failed! Enter your email to be notified when we've got a fix:"
      );
      if (email) {
        waitlistMutation.mutate(email);
      }
    };

    const handleClose = async (e) => {
      console.log("WebSocket closed, code:", e.code);
      setIsConnected(false);

      if (e.code !== 1000 && e.code !== 1001) {
        const email = prompt(
          "Connection lost! Enter your email to be notified:"
        );
        if (email) {
          waitlistMutation.mutate(email);
        }
      }
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleError);
    socket.addEventListener("close", handleClose);

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("error", handleError);
      socket.removeEventListener("close", handleClose);
    };
  }, [socketUrl, enabled, onMessage, waitlistMutation]);

  //   const processRaw = (raw) => {
  //     console.log(raw);
  //     // 1) Handle tagged envelopes like <<<DESCRIPTION>>>{json}<<<END_DESCRIPTION>>>
  //     if (typeof raw === "string") {
  //       const m = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
  //       if (m) {
  //         const tag = m[1]; // e.g. DESCRIPTION, PROMPT
  //         let inner = {};
  //         try {
  //           inner = JSON.parse(m[2]);
  //         } catch {}
  //         const tagLower = (inner?.tag_type || tag || "")
  //           .toString()
  //           .toLowerCase();

  //         if (tagLower === "description") {
  //           applyMessage(inner?.message || inner?.text || "");
  //           cancelRun(501);
  //           return;
  //         }
  //         if (tagLower === "prompt") {
  //           const t = inner?.prompt || inner?.message || "";
  //           if (t) applyMessage(t);
  //           setWaitingForInput(true);
  //           setTimeout(
  //             () => inputRef.current?.focus({ preventScroll: true }),
  //             100
  //           ); // auto focus on the text box
  //           return;
  //         }
  //       }
  //     }

  //     // 2) Fallback: legacy JSON payloads { type, data }
  //     let msg;
  //     try {
  //       msg = JSON.parse(raw || "{}");
  //     } catch {
  //       msg = null;
  //     }
  //     if (!msg?.type) return;

  //     const t = String(msg.type).toLowerCase();
  //     if (t === "prompt") {
  //       const promptText = msg.data?.prompt || "";

  //       // Check if this is asking for GitHub URL
  //       if (promptText.includes("Please enter a GitHub URL")) {
  //         console.log("🔗 Auto-responding to GitHub URL prompt with:", repoUrl);

  //         // Auto-respond with the stored repo URL
  //         if (repoUrl && socketRef.current) {
  //           // Send the repo URL automatically
  //           socketRef.current.send(
  //             JSON.stringify({ type: "input", data: repoUrl })
  //           );

  //           console.log("Auto-sent repo URL:", repoUrl);
  //         } else {
  //           console.error("No repo URL available or WebSocket not connected");
  //           applyMessage("Error: No repository URL available");
  //           // fallback: ask the user to enter the repo url
  //           applyMessage(msg.data?.prompt || "");
  //           setWaitingForInput(true);
  //           setTimeout(
  //             () => inputRef.current?.focus({ preventScroll: true }),
  //             100
  //           );
  //         }
  //         return;
  //       }
  //       applyMessage(msg.data?.prompt || "");
  //       setWaitingForInput(true);
  //       setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  //       return;
  //     }
  //     if (t === "description") {
  //       // backend might send {data: {message}} or just a string
  //       applyMessage(msg.data?.message || msg.data || "");
  //       return;
  //     }
  //     // stream planner information
  //     if (t === "planner-step") {
  //       applyMessage(msg.data?.content || msg.data || "");
  //       return;
  //     }
  //     // stream planner information
  //     if (t === "executor-tool-call") {
  //       applyMessage(`Calling tool ${msg.data?.tool_name || "Unknown Tool"}`);
  //       return;
  //     }
  //     // stream tool result information
  //     if (t === "executor-tool-result") {
  //       const toolName = msg.data?.tool_name || "Tool";
  //       const status = msg.data?.status || "unknown";
  //       const output = msg.data?.tool_output || "";
  //       const errorType = msg.data?.error_type;
  //       const reason = msg.data?.reason;

  //       if (status === "error" || errorType) {
  //         applyMessage(
  //           `${toolName}: ERROR - ${errorType || reason || "Unknown error"}`
  //         );
  //       } else {
  //         applyMessage(`${toolName}: ${status} - ${output}`);
  //       }
  //       return;
  //     }
  //     if (t === "agent") {
  //       applyMessage(
  //         `${msg.data?.agent_type || "Unknown"} agent:\n${
  //           msg.data?.content || msg.data || ""
  //         }`
  //       );
  //       return;
  //     }
  //     if (t === "output" || t === "stdout" || t === "log") {
  //       applyMessage(
  //         typeof msg.data === "string" ? msg.data.trim() : msg.data?.message || ""
  //       );
  //       return;
  //     }
  //     if (t === "idle_timeout") {
  //       alert(
  //         String(msg.data?.message) ||
  //           "This run has been canceled due to inactivity"
  //       );
  //       cancelRun(502);
  //       // router.push("/"); // Redirect to home page
  //       return;
  //     }
  //     if (t === "complete") {
  //       console.log("user entered N");
  //       cancelRun();
  //       return;
  //     }
  //     if (t === "stderr") {
  //       const errorMsg =
  //         typeof msg.data === "string"
  //           ? msg.data.trim()
  //           : msg.data?.message || "An error occurred";
  //       applyMessage(`Error: ${errorMsg}`);
  //       cancelRun(503); // Cancel the run
  //       return;
  //     }
  //     if (t === "error") {
  //       const errorMsg =
  //         typeof msg.data === "string"
  //           ? msg.data.trim()
  //           : msg.data?.message || "An error occurred";
  //       applyMessage(`Error: ${errorMsg}`);
  //       cancelRun(504); // Cancel the run
  //       setRunStatus("Error");
  //       setWaitingForInput(true);

  //       return;
  //     }
  //   };

  return {
    socket: socketRef.current,
    isConnected,
    cancelRun: cancelRunMutation.mutate,
  };
}
