"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { FaEdit, FaWindowMinimize } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

/* ---------- helpers ---------- */

const makeRunId = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    function getSingletonWS(url) {
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
    }

    /* ---------- component ---------- */

    export default function Hypothesis({ id, title, onMinimize, minimized }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [waitingForInput, setWaitingForInput] = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const startedRef = useRef(false);

    // Stable run id across re-renders
    const runIdRef = useRef(makeRunId());
    const runId = runIdRef.current;

    // Publish runId so Diagram (or others) can reuse it
    useEffect(() => {
        try { localStorage.setItem("masRunId", runId); } catch {}
        try { window.dispatchEvent(new CustomEvent("mas:runId", { detail: runId })); } catch {}
    }, [runId]);

    // Optional repo URL from query string
    const searchParams = useSearchParams();
    const repoUrl = searchParams.get("repoUrl");

    // Backend base (env or fallback)
    const API_BASE = useMemo(() => {
        return (process.env.NEXT_PUBLIC_API_BASE_URL || "https://shepherd-mas-dev.fly.dev").replace(/\/+$/, "");
    }, []);

    // ws(s)://.../ws/{runId}
    const socketUrl = useMemo(() => {
        const u = new URL(API_BASE);
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        u.pathname = u.pathname.replace(/\/$/, "") + `/ws/${runId}`;
        return u.toString();
    }, [API_BASE, runId]);

    // ---- message processor (handles tagged envelopes and JSON) ----
    const applyMessage = (text) => {
        if (text) setMessages(prev => [...prev, { from: "system", text }]);
    };

    const processRaw = (raw) => {
        // 1) Handle tagged envelopes like <<<DESCRIPTION>>>{json}<<<END_DESCRIPTION>>>
        if (typeof raw === "string") {
        const m = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
        if (m) {
            const tag = m[1];                 // e.g. DESCRIPTION, PROMPT
            let inner = {};
            try { inner = JSON.parse(m[2]); } catch {}
            const tagLower = (inner?.tag_type || tag || "").toString().toLowerCase();

            if (tagLower === "description") {
            applyMessage(inner?.message || inner?.text || "");
            return;
            }
            if (tagLower === "prompt") {
            const t = inner?.prompt || inner?.message || "";
            if (t) applyMessage(t);
            setWaitingForInput(true);
            return;
            }
            // add more tag handlers as needed (e.g., OUTPUT, STDERR)
        }
        }

        // 2) Fallback: legacy JSON payloads { type, data }
        let msg;
        try { msg = JSON.parse(raw || "{}"); } catch { msg = null; }
        if (!msg?.type) return;

        const t = String(msg.type).toLowerCase();
        if (t === "prompt") {
        applyMessage(msg.data?.prompt || "");
        setWaitingForInput(true);
        return;
        }
        if (t === "description") {
        // backend might send {data: {message}} or just a string
        applyMessage(msg.data?.message || msg.data || "");
        return;
        }
        if (t === "output" || t === "stderr" || t === "stdout" || t === "log") {
        applyMessage(typeof msg.data === "string" ? msg.data.trim() : (msg.data?.message || ""));
        return;
        }
    };

    // WebSocket setup — start the run on open, then just stream (no polling)
    useEffect(() => {
        const socket = getSingletonWS(socketUrl);
        socketRef.current = socket;

        const onOpen = async () => {
        if (!startedRef.current) {
            startedRef.current = true;
            try {
            const body = repoUrl ? { github_url: repoUrl } : {};
            await fetch(`${API_BASE}/runs/${runId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            } catch {
            // ignore; if the run already exists, WS streaming should still work
            }
        }
        };

        const onMessage = (event) => {
        // event.data can be string or Blob
        const raw = event.data;
        if (raw instanceof Blob) {
            raw.text().then(processRaw).catch(() => {});
        } else {
            processRaw(raw);
        }
        };

        const onError = (e) => {
        // eslint-disable-next-line no-console
        console.error("WebSocket error:", e);
        };

        socket.addEventListener("open", onOpen);
        socket.addEventListener("message", onMessage);
        socket.addEventListener("error", onError);

        return () => {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("message", onMessage);
        socket.removeEventListener("error", onError);
        };
    }, [socketUrl, API_BASE, repoUrl, runId]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !waitingForInput) return;
        setMessages(prev => [...prev, { from: "user", text: input }]);
        socketRef.current?.send(JSON.stringify({ type: "input", data: input }));
        setInput("");
        setWaitingForInput(false);
    };

    return (
        <div className={`text-white w-full border border-[#232323] bg-[#0C0C0C] rounded-lg ${minimized ? "h-auto" : "flex flex-col flex-1 min-h-0"}`}>
        <div className="flex justify-between items-center px-4 py-2 bg-[#141414] rounded-t-lg">
            <div className="flex items-center space-x-2">
            <p className="font-semibold">{title}</p>
            <FaEdit className="text-sm text-gray-400" />
            </div>
            <button onClick={() => onMinimize?.(id)}>
            <FaWindowMinimize className="text-gray-400" />
            </button>
        </div>

        {!minimized && (
            <div className="flex flex-col flex-1 px-4 py-4 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`px-4 py-2 rounded-lg text-sm max-w-xs break-words ${msg.from === "user" ? "bg-[#df153e] text-white" : "bg-[#141414] text-gray-300"}`}>
                    {msg.text}
                    </div>
                </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-2 mt-4">
                <input
                type="text"
                placeholder="Type your answer..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-[#141414] border border-[#232323] rounded-md px-4 py-2 text-sm text-gray-300 placeholder:text-gray-500"
                disabled={!waitingForInput}
                />
                <button
                onClick={handleSend}
                className={`px-3 py-2 rounded-md text-white text-sm ${waitingForInput ? "bg-[#df153e]" : "bg-gray-500 cursor-not-allowed"}`}
                disabled={!waitingForInput}
                >
                Send
                </button>
            </div>
            </div>
        )}
        </div>
    );
}
