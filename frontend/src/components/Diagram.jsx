"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";

// singleton WS by URL
function getSingletonWS(url) {
    if (typeof window === "undefined") return new WebSocket(url);
    const pool = (window.__masWsPool ||= new Map());
    const existing = pool.get(url);
    if (existing && existing.readyState < 2) return existing;
    const ws = new WebSocket(url);
    pool.set(url, ws);
    ws.addEventListener("close", () => { if (pool.get(url) === ws) pool.delete(url); });
    return ws;
    }

    export default function Diagram({ runId: runIdProp }) {
    const containerRef = useRef(null);
    const cyRef = useRef(null);

    // Resolve runId: prop > localStorage > event
    const [runId, setRunId] = useState(runIdProp || null);
    useEffect(() => {
        if (runIdProp) { setRunId(runIdProp); return; }
        try {
        const v = localStorage.getItem("masRunId");
        if (v) setRunId(v);
        } catch {}
        const onRunId = (e) => { if (e?.detail) setRunId(e.detail); };
        window.addEventListener("mas:runId", onRunId);
        return () => window.removeEventListener("mas:runId", onRunId);
    }, [runIdProp]);

    const API_BASE = useMemo(() => {
        return (process.env.NEXT_PUBLIC_API_BASE_URL || "https://shepherd-mas-dev.fly.dev").replace(/\/+$/, "");
    }, []);

    const socketUrl = useMemo(() => {
        if (!runId) return null;
        const u = new URL(API_BASE);
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        u.pathname = u.pathname.replace(/\/$/, "") + `/ws/${runId}`;
        return u.toString();
    }, [API_BASE, runId]);

    // Init Cytoscape once
    useEffect(() => {
        if (!containerRef.current || cyRef.current) return;
        cyRef.current = cytoscape({
        container: containerRef.current,
        style: [
            {
            selector: "node",
            style: {
                shape: "roundrectangle",
                "background-color": "#0f172a",
                label: "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                color: "#f8fafc",
                "text-wrap": "wrap",
                "text-max-width": 160,
                "font-size": 14,
                "text-outline-width": 1,
                "text-outline-color": "#0f172a",
                padding: "12px",
                width: "label",
                height: "label",
                "border-width": 1,
                "border-color": "#38bdf8",
                "transition-property": "opacity",
                "transition-duration": "0.2s",
                opacity: 1,
            },
            },
            { selector: "node.agent", style: { "border-color": "#f43f5e" } },
            { selector: "node.hidden", style: { opacity: 0 } },
        ],
        elements: [],
        layout: { name: "preset" },
        });
        return () => { cyRef.current?.destroy(); cyRef.current = null; };
    }, []);

    // Grid positioning
    const nextPosition = () => {
        const cy = cyRef.current;
        const count = cy?.nodes()?.length || 0;
        const cols = 5;
        return { x: 120 + (count % cols) * 180, y: 120 + Math.floor(count / cols) * 140 };
    };

    // Labels
    const labelFromMsg = (type, data) => {
        const norm = String(type || "").toLowerCase().replace(/_/g, "-");

        if (norm === "executor-tool-call") {
        let tool = "";
        if (typeof data?.content === "string") {
            const cleaned = data.content.split("<<<END_")[0].trim();
            try { tool = JSON.parse(cleaned)?.tool_name || ""; }
            catch { tool = (cleaned.match(/"tool_name"\s*:\s*"([^"]+)"/)?.[1]) || ""; }
        } else if (data && typeof data === "object") {
            tool = data.tool_name || data.tool || data.name || "";
        }
        return `Tool: ${tool || "Unknown"}`;
        }

        if (norm === "agent") {
        let agent = "";
        if (typeof data?.content === "string") {
            const cleaned = data.content.split("<<<END_")[0].trim();
            try { agent = JSON.parse(cleaned)?.agent_type || ""; }
            catch { agent = (cleaned.match(/"agent_type"\s*:\s*"([^"]+)"/)?.[1]) || ""; }
        } else if (data && typeof data === "object") {
            agent = data.agent_type || data.agent || data.name || "";
        }
        return `Agent:`;
        }

        return String(type || "");
    };

    // --- parse helper: envelope or JSON ---
    const parseWsPayload = (raw) => {
        if (typeof raw === "string") {
        // Envelope form: <<<TAG>>>{json}<<<END_TAG>>>
        const m = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
        if (m) {
            let inner = {};
            try { inner = JSON.parse(m[2]); } catch { /* ignore */ }
            const tag = (inner?.tag_type || m[1]).toLowerCase().replace(/_/g, "-");
            return { type: tag, data: inner };
        }
        // Plain JSON form
        try { return JSON.parse(raw); } catch {}
        }
        return null;
    };

    // Connect WS and handle messages
    useEffect(() => {
        if (!cyRef.current || !socketUrl) return;

        const ws = getSingletonWS(socketUrl);

        const onMessage = async (evt) => {
        let raw = evt.data;
        if (raw instanceof Blob) {
            try { raw = await raw.text(); } catch { return; }
        }
        const msg = parseWsPayload(raw);
        if (!msg) return;

        const t = String(msg.type || "").toLowerCase().replace(/_/g, "-");
        if (t !== "agent" && t !== "executor-tool-call") return;

        const cy = cyRef.current;
        const id = `${t}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const label = labelFromMsg(t, msg.data || {});
        const classes = t === "agent" ? "hidden agent" : "hidden";

        cy.add({
            group: "nodes",
            data: { id, label },
            position: nextPosition(),
            classes,
        });

        requestAnimationFrame(() => cy.$id(id).removeClass("hidden"));
        };

        const onError = (e) => console.error("[Diagram] WS error:", e);

        ws.addEventListener("message", onMessage);
        ws.addEventListener("error", onError);
        return () => {
        ws.removeEventListener("message", onMessage);
        ws.removeEventListener("error", onError);
        };
    }, [socketUrl]);

    return (
        <div
        className="w-full h-[600px] bg-[#0C0C0C] bg-[radial-gradient(circle,_#1e293b_1px,_transparent_1px)] [background-size:20px_20px] rounded-lg shadow-md"
        ref={containerRef}
        />
    );
}
