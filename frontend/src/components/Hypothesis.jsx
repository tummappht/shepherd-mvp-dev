"use client";
import { useState, useEffect, useRef } from "react";
import { FaEdit, FaWindowMinimize } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

const socketUrl = "ws://localhost:8000/ws/test-123";

export default function Hypothesis({ id, title, onMinimize, minimized }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [waitingForInput, setWaitingForInput] = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const searchParams = useSearchParams();
    const repoUrl = searchParams.get("repoUrl");

    const shouldSkipLine = (line) => {
        return line?.includes("Please enter a GitHub URL") || line?.includes("=======");
    };

    // Trigger MAS run on mount
    useEffect(() => {
        if (!repoUrl) return;
        fetch("http://localhost:8000/runs/test-123", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ github_url: repoUrl }),
        });
    }, [repoUrl]);

    useEffect(() => {
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        let lastOutputBuffer = "";

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (shouldSkipLine(message.data)) return;

            if (message.type === "prompt") {
                if (promptText.includes("Please enter a GitHub URL")) {
                    setMessages((prev) => [...prev, {
                        from: "system",
                        text: promptText
                    }]);

                    // Auto-send the repoUrl
                    if (repoUrl) {
                        setMessages((prev) => [...prev, {
                            from: "user",
                            text: repoUrl
                        }]);
                        socketRef.current?.send(JSON.stringify({ type: "input", data: repoUrl }));
                        setTyping(true);
                        setWaitingForInput(false);
                    }

                    return;
                }
                setMessages((prev) => [...prev, {
                    from: "system",
                    text: message.data.prompt
                }]);
                setWaitingForInput(true); // Stop further output until user responds
                return;
            }

            if (waitingForInput) return; // pause output until input is sent

            if ((message.type === "output" || message.type === "stderr") && message.data) {
                const data = message.data.trim();
                lastOutputBuffer += data + " ";

                const normalized = lastOutputBuffer.toLowerCase();
                if (
                    !normalized.includes("please enter comma-separated") &&
                    !normalized.includes("file names that are not deployable")
                ) {
                    setMessages((prev) => [...prev, {
                        from: "system",
                        text: data
                    }]);
                    lastOutputBuffer = "";
                }
            }
        };

        socket.onerror = (err) => console.error("WebSocket error:", err);
        return () => socket.close();
    }, [waitingForInput]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { from: "user", text: input }]);
        socketRef.current?.send(JSON.stringify({ type: "input", data: input }));
        setInput("");
        setTyping(true);
        setWaitingForInput(false);
    };

    return (
        <div className={`text-white w-full border border-[#232323] bg-[#0C0C0C] rounded-lg ${minimized ? "h-auto" : "flex flex-col flex-1 min-h-0"}`}>
            <div className="flex justify-between items-center px-4 py-2 bg-[#141414] rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <p className="font-semibold">{title}</p>
                    <FaEdit className="text-sm text-gray-400" />
                </div>
                <button onClick={() => onMinimize(id)}>
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
                        {typing && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2 rounded-lg text-sm bg-[#141414] text-gray-400 italic animate-pulse">...</div>
                            </div>
                        )}
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
                        />
                        <button
                            onClick={handleSend}
                            className="bg-[#df153e] px-3 py-2 rounded-md text-white text-sm"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
