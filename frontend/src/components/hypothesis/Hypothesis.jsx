"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRuns } from "@/hook/useRuns";
import { TbEdit } from "react-icons/tb";
import HypothesisInput from "./HypothesisInput";
import TreeCheckboxList from "../TreeCheckbox";

export default function Hypothesis({ title, onMinimize, minimized }) {
  const {
    API_BASE,
    runId,
    getSingletonWS,
    socketUrl,
    socketStatus: contextSocketStatus,
    isRenderAsMarkdown,
  } = useRuns();
  const [messages, setMessages] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [runStatus, setRunStatus] = useState("Initializing");
  const [options, setOptions] = useState([]);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const startedRef = useRef(false);

  // Define a router to redirect to different pages
  const router = useRouter();
  const inputRef = useRef(null);

  // Optional repo URL from query string
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");

  // ---- message processor (handles tagged envelopes and JSON) ----
  const applyMessage = (text, type = "description") => {
    if (text) setMessages((prev) => [...prev, { from: "system", text, type }]);
    setRunStatus("Started"); // Change from Initializing... status once the first message is sent
  };

  // Auto-focus input when waiting for user input
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    }
  }, [waitingForInput]);

  // calls the cancel api and removes this run from the running state
  const cancelRun = async (delayMs = 5000) => {
    try {
      console.log("🚀 ~ cancelRun ~ delayMs:", delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      await fetch(`${API_BASE}/runs/${runId}/cancel`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      setWaitingForInput(false);
    } catch (error) {
      console.error("Failed to cancel run:", error);
    }
  };

  // prompts the user to save their email (call if an unexpected error occurs)
  const saveWaitlistEmail = async (email) => {
    if (email?.trim()) {
      try {
        await fetch(`${API_BASE}/save-waitlist-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch (error) {
        console.error("Failed to save email:", error);
        alert("Failed to save your email. Please try again later.");
      }
    }
  };

  // cancels run if the tab closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (startedRef.current && runId) {
        console.log("Tab closing/reloading, canceling run:", runId);

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

  const processRaw = (raw) => {
    console.log("🚀 :", raw);
    // 1) Handle tagged envelopes like <<<DESCRIPTION>>>{json}<<<END_DESCRIPTION>>>
    if (typeof raw === "string") {
      const m = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
      if (m) {
        const tag = m[1]; // e.g. DESCRIPTION, PROMPT
        let inner = {};
        try {
          inner = JSON.parse(m[2]);
        } catch {}
        const tagLower = (inner?.tag_type || tag || "")
          .toString()
          .toLowerCase();

        if (tagLower === "description") {
          applyMessage(inner?.message || inner?.text || "", tagLower);
          cancelRun(501);
          return;
        }
        if (tagLower === "prompt") {
          const t = inner?.prompt || inner?.message || "";
          if (t) applyMessage(t, tagLower);
          setWaitingForInput(true);
          setTimeout(
            () => inputRef.current?.focus({ preventScroll: true }),
            100
          ); // auto focus on the text box
          return;
        }
      }
    }

    // 2) Fallback: legacy JSON payloads { type, data }
    let msg;
    try {
      msg = JSON.parse(raw || "{}");
    } catch {
      msg = null;
    }
    if (!msg?.type) return;

    const t = String(msg.type).toLowerCase();
    if (t === "prompt") {
      const promptText = msg.data?.prompt || "";
      const isHasOptions = msg.data?.options && msg.data.options.length > 0;

      // Check if this is asking for GitHub URL
      if (promptText.includes("Please enter a GitHub URL")) {
        console.log("🔗 Auto-responding to GitHub URL prompt with:", repoUrl);

        // Auto-respond with the stored repo URL
        if (repoUrl && socketRef.current) {
          // Send the repo URL automatically
          socketRef.current.send(
            JSON.stringify({ type: "input", data: repoUrl })
          );

          console.log("Auto-sent repo URL:", repoUrl);
        } else {
          console.error("No repo URL available or WebSocket not connected");
          applyMessage("Error: No repository URL available");
          // fallback: ask the user to enter the repo url
          applyMessage(msg.data?.prompt || "", t);
          setWaitingForInput(true);
          setTimeout(
            () => inputRef.current?.focus({ preventScroll: true }),
            100
          );
        }
        return;
      }
      if (isHasOptions) {
        const options = msg.data.options;
        setOptions(options);
      }
      applyMessage(msg.data?.prompt || "", t);
      setWaitingForInput(true);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
      return;
    }
    if (t === "description") {
      // backend might send {data: {message}} or just a string
      applyMessage(msg.data?.message || msg.data || "", t);

      if (msg.data?.message === "Ending Run.") {
        setRunStatus("Ended");
      }
      return;
    }
    // stream planner information
    if (t === "planner-step") {
      applyMessage(msg.data?.content || msg.data || "", t);
      return;
    }
    // stream planner information
    if (t === "executor-tool-call") {
      applyMessage(`Calling tool ${msg.data?.tool_name || "Unknown Tool"}`, t);
      return;
    }
    // stream tool result information
    if (t === "executor-tool-result") {
      const toolName = msg.data?.tool_name || "Tool";
      const status = msg.data?.status || "unknown";
      const output = msg.data?.tool_output || "";
      const errorType = msg.data?.error_type;
      const reason = msg.data?.reason;

      if (status === "error" || errorType) {
        applyMessage(
          `${toolName}: ERROR - ${errorType || reason || "Unknown error"}`,
          t
        );
      } else {
        applyMessage(`${toolName}: ${status} - ${output}`, t);
      }
      return;
    }
    if (t === "agent") {
      applyMessage(
        `${msg.data?.agent_type || "Unknown"} agent:\n${
          msg.data?.content || msg.data || ""
        }`,
        t
      );
      return;
    }
    if (t === "output" || t === "stdout" || t === "log") {
      applyMessage(
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "",
        t
      );
      return;
    }
    if (t === "idle_timeout") {
      alert(
        String(msg.data?.message) ||
          "This run has been canceled due to inactivity"
      );
      cancelRun(502);
      // router.push("/"); // Redirect to home page
      return;
    }
    if (t === "complete") {
      console.log("user entered N");
      cancelRun();
      return;
    }
    if (t === "stderr") {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      applyMessage(`Error: ${errorMsg}`, t);
      cancelRun(503); // Cancel the run
      return;
    }
    if (t === "error") {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      applyMessage(`Error: ${errorMsg}`, t);
      cancelRun(504); // Cancel the run
      setRunStatus("Error");
      setWaitingForInput(true);

      return;
    }
  };

  // WebSocket setup — start the run on open, then just stream (no polling)
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      console.log("Starting run for runId:", runId);
      const startRunThenSocket = async () => {
        try {
          let socketStatus = contextSocketStatus;
          let responseStatus = null;
          if (socketStatus === "started") {
            const socket = getSingletonWS(socketUrl);
            socketRef.current = socket;
            const onMessage = (event) => {
              // event.data can be string or Blob
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
            const onError = async (e) => {
              console.error("WebSocket error:", e);
              const email = prompt(
                "Connection failed! Something went wrong on our end. Enter your email to be notified when we've got a fix:"
              );
              await saveWaitlistEmail(email);
              // router.push("/new-test");
            };
            const onClose = async (e) => {
              console.log("WebSocket closed, code:", e.code);
              if (e.code !== 1000 && e.code !== 1001) {
                const email = prompt(
                  "Connection lost unexpectedly! Enter your email to be notified when we've resolved the issue:"
                );
                await saveWaitlistEmail(email);
                // router.push("/new-test");
              }
            };
            socket.addEventListener("message", onMessage);
            socket.addEventListener("error", onError);
            socket.addEventListener("close", onClose);
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
            console.log("Unexpected status code:", responseStatus);
            const email = prompt(
              "Something went wrong! Enter your email to be notified when we've got a fix:"
            );
            await saveWaitlistEmail(email);
            router.push("/new-test");
            return;
          } else {
            setRunStatus("Error");
            console.log("result status not parsed correctly");
          }
        } catch (error) {
          // ignore; if the run already exists, WS streaming should still work
          console.error("Error in startRunThenSocket:", error);
          console.error("Error details:", error.message, error.stack);
        }
      };
      startRunThenSocket();
    }
  }, [socketUrl, repoUrl, runId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (value, type) => {
    if (!waitingForInput) return;
    const lastMessage = messages[messages.length - 1];

    // If the prompt is asking for non-deployable files, then an empty response is valid; else, return
    const isAskingForInterfaces =
      lastMessage &&
      lastMessage.from === "system" &&
      lastMessage.text
        .toLowerCase()
        .includes("file names that are not deployable like interfaces");
    if (!value.trim() && !isAskingForInterfaces) return;

    // Check if the last message was asking about running another MAS
    // Cancel the run if the user enters N
    const isRunAnotherPrompt =
      lastMessage &&
      lastMessage.from === "system" &&
      lastMessage.text.toLowerCase().includes("run another mas");

    if (isRunAnotherPrompt) {
      const userResponse = value.trim().toLowerCase();

      if (userResponse !== "y" && userResponse !== "yes") {
        // User said N/no or anything else - cancel run
        console.log("User declined to run another MAS - canceling run");
        setMessages((prev) => [...prev, { from: "user", text: value, type }]);
        console.log("CANCELING");
        socketRef.current?.send(JSON.stringify({ type: "input", data: value }));
        applyMessage("Session has ended successfully.", "end");
        cancelRun(505);
        setWaitingForInput(false);
        return;
      }
    }

    setMessages((prev) => [...prev, { from: "user", text: value, type }]);
    socketRef.current?.send(JSON.stringify({ type: "input", data: value }));
    setWaitingForInput(false);
    setOptions([]);
  };

  const statusColor = useMemo(() => {
    switch (runStatus) {
      case "Started":
        return "text-text-success border-stroke-success bg-bg-success";
      case "At capacity":
      case "Error":
        return "text-text-error border-stroke-error bg-bg-error";
      case "Ended":
        return "text-text-pending border-stroke-pending bg-bg-pending";
      default:
        return "text-text-pending border-stroke-pending bg-bg-pending";
    }
  }, [runStatus]);

  const renderMessagePrefix = (msg, index, messages) => {
    const isOption = msg.type === "option";
    const isFromUser = msg.from === "user";
    if (isFromUser || isOption) {
      return <></>;
    }

    const isPrompt = msg.type === "prompt";
    const isRenderLine = index !== messages.length - 1 && !isPrompt;
    const circleColor = isPrompt ? "border-primary" : " border-white";

    return (
      <>
        <span
          className={`border ${circleColor} w-2 h-2 absolute top-2 left-2 rounded-full `}
        />
        {isRenderLine ? (
          <span className="border border-secondary border-dashed absolute top-6 left-[11px] h-[calc(100%-1rem)]" />
        ) : null}
      </>
    );
  };

  const renderMessage = (msg) => {
    const isFromUser = msg.from === "user";
    if (isFromUser) {
      return (
        <span
          className={`whitespace-pre-wrap bg-background-light text-white border border-stroke-light py-3 px-5 rounded-lg w-full`}
        >
          {msg.text}
        </span>
      );
    }

    const isOption = msg.type === "option";
    if (isOption) {
      return <TreeCheckboxList options={JSON.parse(msg.text)} />;
    }

    const isWhiteText = msg.type === "prompt" || msg.type === "end";
    const textColor = isWhiteText ? "text-white" : "text-secondary";

    if (isRenderAsMarkdown(msg.text)) {
      return (
        <div className={`pl-7 ${textColor}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
        </div>
      );
    } else {
      return (
        <span className={`whitespace-pre-wrap pl-7 ${textColor}`}>
          {msg.text}
        </span>
      );
    }
  };

  return (
    <div className="text-white w-full bg-surface flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-9 py-6 border-b border-stroke">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{title}</p>
          <button type="button" onClick={onMinimize}>
            <TbEdit className="text-md text-secondary" />
          </button>
        </div>
        <div
          className={`flex items-center border ${statusColor} rounded-md h-[30px] px-4`}
        >
          <span>{runStatus}</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-7 py-3 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 relative`}>
              {renderMessagePrefix(msg, index, messages)}
              {renderMessage(msg)}
            </div>
          ))}
          {runStatus !== "Ended" && !waitingForInput && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg text-sm bg-[#141414] text-gray-300">
                <div className="flex space-x-1 items-center">
                  <div className="flex space-x-1 ml-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <HypothesisInput
        waitingForInput={waitingForInput}
        options={options}
        handleSend={handleSend}
      />
    </div>
  );
}
