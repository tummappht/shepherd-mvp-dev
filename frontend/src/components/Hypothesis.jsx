"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { FaEdit, FaWindowMinimize } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

const makeRunId = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    export default function Hypothesis({ id, title, onMinimize, minimized }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [waitingForInput, setWaitingForInput] = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const runIdRef = useRef(id ?? makeRunId());
    const runId = runIdRef.current;

    const searchParams = useSearchParams();
    const repoUrl = searchParams.get("repoUrl");

    // Prefer env var; default to dev API for local testing
    const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://shepherd-mas-dev.fly.dev").replace(/\/+$/, "");

    // Build ws(s) URL from API_BASE, sharing the SAME runId
    const socketUrl = useMemo(() => {
        const u = new URL(API_BASE);
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        u.pathname = u.pathname.replace(/\/$/, "") + `/ws/${runId}`;
        return u.toString();
    }, [API_BASE, runId]);

    // Trigger MAS run
    useEffect(() => {
        if (!repoUrl) return;
        fetch(`${API_BASE}/runs/${runId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: repoUrl }),
        }).catch(() => {});
    }, [API_BASE, repoUrl, runId]);

    // WebSocket setup
    useEffect(() => {
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
        // connected
        };

        socket.onmessage = (event) => {
        let parsed;
        try {
            parsed = JSON.parse(event.data || "{}");
        } catch {
            parsed = null;
        }
        if (!parsed?.type || parsed.data == null) return;

        let text = "";
        if (parsed.type === "prompt") {
            text = parsed.data.prompt || "";
            setWaitingForInput(true);
        } else if (parsed.type === "output" || parsed.type === "stderr") {
            text = typeof parsed.data === "string" ? parsed.data.trim() : "";
        }

        if (text) {
            setMessages((prev) => [...prev, { from: "system", text }]);
        }
        };

        socket.onerror = (err) => {
        // eslint-disable-next-line no-console
        console.error("WebSocket error:", err);
        };

        return () => {
        socket.close();
        };
    }, [socketUrl]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !waitingForInput) return;
        setMessages((prev) => [...prev, { from: "user", text: input }]);
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
            <button onClick={() => onMinimize?.(runId)}>
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
