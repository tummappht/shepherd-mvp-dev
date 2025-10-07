"use client";

import { useState, useEffect, useRef } from "react";
import { FaEdit, FaSyncAlt, FaWindowMinimize } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRuns } from "@/hook/useRuns";

/* ---------- helpers ---------- */
const shouldRenderAsMarkdown = (text) => {
  return text && text.includes("|");
};

/* ---------- component ---------- */

export default function Hypothesis({ id, title, onMinimize, minimized }) {
  const {
    API_BASE,
    runId,
    getSingletonWS,
    socketUrl,
    socketStatus: contextSocketStatus,
  } = useRuns();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [runStatus, setRunStatus] = useState("Initializing...");
  const [isSystemThinking, setIsSystemThinking] = useState(true);

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
  const applyMessage = (text) => {
    setIsSystemThinking(false);
    if (text) setMessages((prev) => [...prev, { from: "system", text }]);
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
    console.log("🚀 ~ processRaw ~ raw:", raw);
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
          applyMessage(inner?.message || inner?.text || "");
          cancelRun(501);
          return;
        }
        if (tagLower === "prompt") {
          const t = inner?.prompt || inner?.message || "";
          if (t) applyMessage(t);
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
          applyMessage(msg.data?.prompt || "");
          setWaitingForInput(true);
          setTimeout(
            () => inputRef.current?.focus({ preventScroll: true }),
            100
          );
        }
        return;
      }
      applyMessage(msg.data?.prompt || "");
      setWaitingForInput(true);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
      return;
    }
    if (t === "description") {
      // backend might send {data: {message}} or just a string
      applyMessage(msg.data?.message || msg.data || "");
      return;
    }
    // stream planner information
    if (t === "planner-step") {
      applyMessage(msg.data?.content || msg.data || "");
      return;
    }
    // stream planner information
    if (t === "executor-tool-call") {
      applyMessage(`Calling tool ${msg.data?.tool_name || "Unknown Tool"}`);
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
          `${toolName}: ERROR - ${errorType || reason || "Unknown error"}`
        );
      } else {
        applyMessage(`${toolName}: ${status} - ${output}`);
      }
      return;
    }
    if (t === "agent") {
      applyMessage(
        `${msg.data?.agent_type || "Unknown"} agent:\n${
          msg.data?.content || msg.data || ""
        }`
      );
      return;
    }
    if (t === "output" || t === "stdout" || t === "log") {
      applyMessage(
        typeof msg.data === "string" ? msg.data.trim() : msg.data?.message || ""
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
      applyMessage(`Error: ${errorMsg}`);
      cancelRun(503); // Cancel the run
      return;
    }
    if (t === "error") {
      const errorMsg =
        typeof msg.data === "string"
          ? msg.data.trim()
          : msg.data?.message || "An error occurred";
      applyMessage(`Error: ${errorMsg}`);
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
          const body = repoUrl ? { github_url: repoUrl } : {};
          const repoUrlTrimmed = repoUrl?.trim();

          let fetch_url = ``;
          const repoMap = {
            "https://github.com/dhruvjain2905/naive-receiver": "dvd2",
            "https://github.com/dhruvjain2905/Truster": "dvd3",
            "https://github.com/dhruvjain2905/Unstoppable": "dvd1",
            "https://github.com/tunonraksa/puppet-deploy": "dvd8",
          };

          if (repoUrlTrimmed && repoMap[repoUrlTrimmed]) {
            await cancelRun(0); // cancel any existing run with the same runId before starting a new one
            fetch_url = `${API_BASE}/runs/${repoMap[repoUrlTrimmed]}/${runId}`;
            const response = await fetch(fetch_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            responseStatus = response.status;

            const result = await response.json();
            socketStatus = result.status;
            console.log(result);
          }

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
  }, [socketUrl, API_BASE, repoUrl, runId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!waitingForInput) return;
    const lastMessage = messages[messages.length - 1];

    // If the prompt is asking for non-deployable files, then an empty response is valid; else, return
    const isAskingForInterfaces =
      lastMessage &&
      lastMessage.from === "system" &&
      lastMessage.text
        .toLowerCase()
        .includes("file names that are not deployable like interfaces");
    if (!input.trim() && !isAskingForInterfaces) return;

    // Check if the last message was asking about running another MAS
    // Cancel the run if the user enters N

    const isRunAnotherPrompt =
      lastMessage &&
      lastMessage.from === "system" &&
      lastMessage.text.toLowerCase().includes("run another mas");

    if (isRunAnotherPrompt) {
      const userResponse = input.trim().toLowerCase();

      if (userResponse !== "y" && userResponse !== "yes") {
        // User said N/no or anything else - cancel run
        console.log("User declined to run another MAS - canceling run");
        setMessages((prev) => [...prev, { from: "user", text: input }]);
        console.log("CANCELING");
        socketRef.current?.send(JSON.stringify({ type: "input", data: input }));
        setInput("");
        applyMessage("Session has ended successfully.");
        cancelRun(505);
        setWaitingForInput(false);
        return;
      }
    }

    setMessages((prev) => [...prev, { from: "user", text: input }]);
    socketRef.current?.send(JSON.stringify({ type: "input", data: input }));
    setInput("");
    setWaitingForInput(false);
    setIsSystemThinking(true);
  };

  return (
    <div
      className={`text-white w-full border border-gray-border bg-surface rounded-lg ${
        minimized ? "h-auto" : "flex flex-col flex-1 min-h-0"
      }`}
    >
      <div className="flex justify-between items-center px-4 py-2 bg-[#141414] rounded-t-lg">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{title}</p>
          <FaEdit className="text-sm text-gray-400" />
          <span className="text-secondary">{runStatus}</span>
        </div>
        <button type="button" onClick={() => onMinimize?.(id)}>
          <FaWindowMinimize className="text-gray-400" />
        </button>
      </div>

      {!minimized && (
        <div className="flex flex-col flex-1 px-4 py-4 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-2 ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                } ${shouldRenderAsMarkdown(msg.text) ? "w-full" : ""}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg text-sm break-words markdown-content ${
                    msg.from === "user"
                      ? "bg-primary text-white max-w-xs"
                      : shouldRenderAsMarkdown(msg.text)
                      ? "bg-[#141414] text-gray-300 max-w-4xl w-full"
                      : "bg-[#141414] text-gray-300 max-w-xs"
                  }`}
                >
                  {shouldRenderAsMarkdown(msg.text) ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
            {isSystemThinking && !waitingForInput && (
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

          <div className="flex items-center gap-2 mt-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your answer..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-[#141414] border border-gray-border rounded-md px-4 py-2 text-sm text-gray-300 placeholder:text-gray-500 h-10"
              disabled={!waitingForInput}
            />
            <button
              onClick={handleSend}
              className={`px-3 py-2 rounded-md text-white text-sm w-[60px] h-10 ${
                waitingForInput
                  ? "bg-primary"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
              disabled={!waitingForInput}
            >
              {!waitingForInput ? (
                <FaSyncAlt className="animate-spin mx-auto" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
