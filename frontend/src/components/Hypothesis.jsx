"use client";
import { useState, useEffect, useRef } from "react";
import { FaEdit, FaWindowMinimize } from "react-icons/fa";

const socketUrl = "ws://localhost:8000/ws/test-123";

export default function Hypothesis({ id, title, onMinimize, minimized }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Trigger MAS run on mount
    useEffect(() => {
        fetch("http://localhost:8000/runs/test-123", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                github_url: "https://github.com/dhruvjain2905/naive-receiver"
            })
        }).then(res => res.json()).then(console.log);
    }, []);

    useEffect(() => {
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        let accumulated = "";

        socket.onopen = () => console.log("WebSocket connected");

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "output") {
                accumulated += message.data;

                // Optional: Debounced update
                setTyping(true);
                setMessages((prev) => {
                    const updated = [...prev];
                    // Replace last system message if it's mid-stream
                    if (updated.length && updated[updated.length - 1].from === "system" && updated[updated.length - 1].streaming) {
                        updated[updated.length - 1] = {
                            from: "system",
                            text: accumulated,
                            streaming: true
                        };
                    } else {
                        updated.push({
                            from: "system",
                            text: accumulated,
                            streaming: true
                        });
                    }
                    return updated;
                });
            }

            if (message.type === "end") {
                // Finalize last message by removing streaming flag
                setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length && updated[updated.length - 1].streaming) {
                        updated[updated.length - 1].streaming = false;
                    }
                    return updated;
                });
                setTyping(false);
            }
        };

        socket.onerror = (err) => console.error("WebSocket error:", err);

        return () => {
            socket.close();
        };
    }, []);

    // Auto-scroll on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { from: "user", text: input }]);
        socketRef.current?.send(JSON.stringify({ type: "input", data: input }));
        setInput("");
        setTyping(true);
    };

    return (
        <div className={`text-white w-full border border-[#232323] bg-[#0C0C0C] rounded-lg ${minimized ? "h-auto" : "flex flex-col flex-1 min-h-0"}`}>
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 bg-[#141414] rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <p className="font-semibold">{title}</p>
                    <FaEdit className="text-sm text-gray-400" />
                </div>
                <button onClick={() => onMinimize(id)}>
                    <FaWindowMinimize className="text-gray-400" />
                </button>
            </div>

            {/* Chat area */}
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

                    {/* Input */}
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
