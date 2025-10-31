"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./CustomNode";
import { ExecutionDetailDrawer } from "./ExecutionDetailDrawer";
import { useRuns } from "@/hook/useRuns";

/* ---------------- constants & helpers ---------------- */

function parseWsPayload(raw) {
  if (typeof raw === "string") {
    // Envelope
    const m = raw.match(/^<<<([A-Z_]+)>>>([\s\S]*?)<<<END_\1>>>$/);
    if (m) {
      let inner = {};
      try {
        inner = JSON.parse(m[2]);
      } catch {}
      const tag = (inner?.tag_type || m[1])
        .toString()
        .toLowerCase()
        .replace(/_/g, "-");
      return { type: tag, data: inner };
    }
    // Plain JSON
    try {
      return JSON.parse(raw);
    } catch {}
  }
  return null;
}

function agentLabelFromData(data) {
  let agent = data?.agent_type || data?.agent || data?.name || "";
  if (!agent && typeof data?.content === "string") {
    const cleaned = data.content.split("<<<END_")[0].trim();
    try {
      agent = JSON.parse(cleaned)?.agent_type || "";
    } catch {
      agent = cleaned.match(/"agent_type"\s*:\s*"([^"]+)"/)?.[1] || "";
    }
  }
  return `Agent: ${agent || "Unknown"}`;
}

function processMessages(messages) {
  const contractsMap = new Map();
  const edgesData = [];
  const toolCalls = [];

  messages.forEach((msg) => {
    if (msg.type === "executor-tool-call") {
      const { contracts, tool_name, stream_id, timestamp } = msg.data;
      toolCalls.push({ stream_id, tool_name, contracts, timestamp });

      contracts.forEach((contract) => {
        if (!contractsMap.has(contract)) {
          contractsMap.set(contract, {
            name: contract,
            successes: 0,
            failures: 0,
            executions: [],
          });
        }
      });
    } else if (msg.type === "executor-tool-result") {
      const { status, reason, tool_name, tool_output, timestamp } = msg.data;
      const lastCall = toolCalls[toolCalls.length - 1];

      if (lastCall && lastCall.tool_name === tool_name) {
        lastCall.contracts.forEach((contract) => {
          const info = contractsMap.get(contract);
          if (info) {
            if (status === "success") info.successes++;
            else info.failures++;

            info.executions.push({
              tool_name,
              status,
              reason: reason || "",
              tool_output: tool_output || "",
              timestamp,
              call_timestamp: lastCall.timestamp,
            });
          }

          edgesData.push({
            contract,
            tool_name,
            status,
            reason: reason || "",
          });
        });
      }
    }
  });

  return { contractsMap, edgesData };
}

function DiagramInner({ queryParamRunId }) {
  const { socketUrl, getSingletonWS } = useRuns(queryParamRunId);
  const { fitView } = useReactFlow();
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [agentLabel, setAgentLabel] = useState("Agent: Reporter");
  const [webSocketMessages, setWebSocketMessages] = useState([]);
  const prevNodeCountRef = useRef(0);

  useEffect(() => {
    if (!socketUrl) return;

    const ws = getSingletonWS(socketUrl);

    const onMessage = async (evt) => {
      let raw = evt.data;
      if (raw instanceof Blob) {
        try {
          raw = await raw.text();
        } catch {
          return;
        }
      }
      const msg = parseWsPayload(raw);
      if (!msg) return;

      const t = String(msg.type || "")
        .toLowerCase()
        .replace(/_/g, "-");
      if (
        t !== "agent" &&
        t !== "executor-tool-call" &&
        t !== "executor-tool-result"
      )
        return;

      if (t === "agent") {
        const label = agentLabelFromData(msg.data || {});
        setAgentLabel(label);
        return;
      }

      setWebSocketMessages((msgs) => [...msgs, msg]);
    };

    const onError = (e) => {
      console.error("[Diagram] WS error:", e);
    };

    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", onError);
    return () => {
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("error", onError);
    };
  }, [socketUrl, getSingletonWS]);

  const { contractsMap, edgesData } = useMemo(
    () => processMessages(webSocketMessages),
    [webSocketMessages]
  );

  const handleOpenDetail = (execution, contractName) => {
    setSelectedExecution(execution);
    setSelectedContract(contractName);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedExecution(null);
      setSelectedContract(null);
    }, 300);
  };

  const nodeTypes = useMemo(
    () => ({
      custom: (props) => (
        <CustomNode {...props} onOpenDetail={handleOpenDetail} />
      ),
    }),
    []
  );

  const initialNodes = useMemo(() => {
    if (!contractsMap || contractsMap.size === 0) {
      return [];
    }

    const contracts = Array.from(contractsMap.values());
    const agentX = 100;
    const agentY = 300;
    const contractStartX = 500;
    const contractStartY = 50;
    const verticalSpacing = 150;

    const nodes = [
      {
        id: "agent-reporter",
        type: "custom",
        data: {
          label: agentLabel,
          type: "agent",
        },
        position: { x: agentX, y: agentY },
      },
    ];

    contracts.forEach((contract, idx) => {
      nodes.push({
        id: contract.name,
        type: "custom",
        data: {
          label: contract.name,
          type: "contract",
          successes: contract.successes,
          failures: contract.failures,
          executions: contract.executions,
        },
        position: {
          x: contractStartX,
          y: contractStartY + idx * verticalSpacing,
        },
      });
    });

    return nodes;
  }, [contractsMap, agentLabel]);

  const initialEdges = useMemo(() => {
    return edgesData.map((edge, idx) => {
      const isSuccess = edge.status === "success";

      return {
        id: `e-${idx}`,
        source: "agent-reporter",
        target: edge.contract,
        sourceHandle: "right",
        targetHandle: "left",
        type: "simplebezier",
        animated: isSuccess,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSuccess ? "#34d399" : "#fb7185",
        },
        style: {
          stroke: isSuccess ? "#34d399" : "#fb7185",
          strokeWidth: 3,
        },
      };
    });
  }, [edgesData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Auto-fit view when new nodes are added
  useEffect(() => {
    const currentNodeCount = nodes.length;

    // Only fit view if node count increased (new nodes added)
    if (currentNodeCount > prevNodeCountRef.current && currentNodeCount > 1) {
      // Small delay to ensure nodes are rendered before fitting
      const timer = setTimeout(() => {
        fitView({
          padding: 0.2,
          duration: 800,
          maxZoom: 1.5,
          minZoom: 0.3,
        });
      }, 100);

      prevNodeCountRef.current = currentNodeCount;
      return () => clearTimeout(timer);
    }

    prevNodeCountRef.current = currentNodeCount;
  }, [nodes.length, fitView]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Controls
          style={{
            button: {
              background: "#1f1f3a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
        <Background
          variant="dots"
          gap={20}
          size={2}
          color="#1e293b"
          className="bg-surface"
        />
      </ReactFlow>

      <ExecutionDetailDrawer
        execution={selectedExecution}
        contractName={selectedContract}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
}

export default function AgentWorkflowDiagram({ queryParamRunId }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0f0f23" }}>
      <ReactFlowProvider>
        <DiagramInner queryParamRunId={queryParamRunId} />
      </ReactFlowProvider>
    </div>
  );
}

AgentWorkflowDiagram.propTypes = {
  queryParamRunId: PropTypes.string,
};

DiagramInner.propTypes = {
  queryParamRunId: PropTypes.string,
};
