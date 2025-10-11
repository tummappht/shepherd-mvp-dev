"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

const webSocketMessages = [
  {
    type: "receive",
    time: 1760171624.554248,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:33:44.013060+00:00","tool_name":"send_transaction_tool","contracts":["MockBPT","VotingEscrow"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_108","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171627.155849,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:33:46.986163+00:00","tool_name":"send_transaction_tool","status":"success","error_type":null,"reason":null,"tool_output":"{}","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_109","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171628.245686,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:33:48.083609+00:00","tool_name":"send_transaction_tool","contracts":["VotingEscrow"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_110","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171628.6089702,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:33:48.444152+00:00","tool_name":"send_transaction_tool","status":"failed","error_type":null,"reason":null,"tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_111","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171647.0525851,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:34:06.887391+00:00","tool_name":"send_transaction_tool","contracts":["VotingEscrow"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_122","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171649.6981502,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:34:09.529676+00:00","tool_name":"send_transaction_tool","status":"success","error_type":null,"reason":null,"tool_output":"{}","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_123","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171658.2408571,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:34:18.060358+00:00","tool_name":"send_transaction_tool","contracts":["Voter"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_124","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171660.755778,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:34:20.489376+00:00","tool_name":"send_transaction_tool","status":"success","error_type":null,"reason":null,"tool_output":"{}","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_125","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171662.854412,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:34:22.660994+00:00","tool_name":"call_view_tool","contracts":["FluxToken"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_126","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171664.23873,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:34:24.075092+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":null,"tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_127","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171687.985081,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:34:47.825255+00:00","tool_name":"call_view_tool","contracts":["VotingEscrow"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_138","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171689.583358,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:34:49.169947+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":null,"tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_139","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171721.965676,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:35:21.474082+00:00","tool_name":"evm_control_tool","contracts":[]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_158","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171723.25019,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:35:23.036705+00:00","tool_name":"evm_control_tool","status":"failed","error_type":null,"reason":null,"tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_159","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171740.14877,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:35:39.915843+00:00","tool_name":"evm_control_tool","contracts":[]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_169","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171741.111489,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:35:40.959759+00:00","tool_name":"evm_control_tool","status":"success","error_type":null,"reason":null,"tool_output":"{\'method_used\': \'anvil_setNextBlockTimestamp\', \'params\': [1760171959], \'result\': None}","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_170","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171752.550944,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:35:52.383173+00:00","tool_name":"call_view_tool","contracts":["VotingEscrow"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_178","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171753.951488,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:35:53.794493+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":null,"tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_179","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171775.801925,
    opcode: 1,
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:36:15.578198+00:00","tool_name":"call_view_tool","contracts":["VotingEscrow"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_194","stream_complete":true}',
  },
  {
    type: "receive",
    time: 1760171777.20632,
    opcode: 1,
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:36:16.982128+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":null,"tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_195","stream_complete":true}',
  },
];

function processMessages(messages) {
  const contractsMap = new Map();
  const edgesData = [];
  const toolCalls = [];
  const toolResults = new Map(); // Map to store full tool result data by edge index

  messages.forEach((msg) => {
    const parsedData = JSON.parse(msg.data);

    if (parsedData.type === "executor-tool-call") {
      const { contracts, tool_name, stream_id } = parsedData.data;
      toolCalls.push({ stream_id, tool_name, contracts });

      contracts.forEach((contract) => {
        if (!contractsMap.has(contract)) {
          contractsMap.set(contract, {
            name: contract,
            calls: 0,
            successes: 0,
            failures: 0,
          });
        }
        contractsMap.get(contract).calls++;
      });
    } else if (parsedData.type === "executor-tool-result") {
      const { status, reason, tool_name, tool_output, error_type, timestamp } =
        parsedData.data;
      const lastCall = toolCalls[toolCalls.length - 1];

      if (lastCall && lastCall.tool_name === tool_name) {
        lastCall.contracts.forEach((contract) => {
          const info = contractsMap.get(contract);
          if (info) {
            if (status === "success") info.successes++;
            else info.failures++;
          }

          const edgeIndex = edgesData.length;
          edgesData.push({
            contract,
            tool_name,
            status,
            reason,
          });

          // Store full tool result data
          toolResults.set(edgeIndex, {
            status,
            tool_name,
            tool_output,
            error_type,
            reason,
            timestamp,
            contract,
          });
        });
      }
    }
  });

  return { contractsMap, edgesData, toolResults };
}

export default function AgentWorkflowDiagram() {
  const [selectedEdge, setSelectedEdge] = useState(null);

  const { contractsMap, edgesData, toolResults } = useMemo(
    () => processMessages(webSocketMessages),
    []
  );

  const centerX = 450;
  const centerY = 400;
  const radius = 300;

  const contracts = Array.from(contractsMap.values());
  const angleStep = (2 * Math.PI) / Math.max(contracts.length, 1);

  const initialNodes = [
    {
      id: "agent-reporter",
      data: { label: "🤖 Agent: Reporter" },
      position: { x: centerX - 75, y: centerY - 75 },
      style: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "3px solid #5a67d8",
        borderRadius: "50%",
        padding: "35px",
        fontSize: "16px",
        fontWeight: "700",
        width: "150px",
        height: "150px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: "0 10px 25px rgba(102, 126, 234, 0.4)",
        zIndex: 10,
      },
    },
    ...contracts.map((contract, idx) => {
      const angle = idx * angleStep;
      const x = centerX + radius * Math.cos(angle) - 70;
      const y = centerY + radius * Math.sin(angle) - 50;

      return {
        id: contract.name,
        data: {
          label: (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "6px",
                }}
              >
                {contract.name}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.9 }}>
                ✓ {contract.successes} | ✗ {contract.failures}
              </div>
            </div>
          ),
        },
        position: { x, y },
        style: {
          background:
            contract.successes > contract.failures
              ? "#10b981"
              : contract.failures > contract.successes
              ? "#ef4444"
              : "#6b7280",
          color: "white",
          border: "2px solid rgba(255,255,255,0.3)",
          borderRadius: "12px",
          padding: "16px 20px",
          minWidth: "140px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        },
      };
    }),
  ];

  const initialEdges = edgesData.map((edge, idx) => {
    const isSuccess = edge.status === "success";
    const label = edge.reason
      ? `${edge.tool_name}\n${edge.reason}`
      : edge.tool_name;

    return {
      id: `e-${edge.contract}-${idx}`,
      source: "agent-reporter",
      target: edge.contract,
      label,
      type: "smoothstep",
      animated: isSuccess,
      data: { edgeIndex: idx }, // Store edge index for lookup
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSuccess ? "#10b981" : "#ef4444",
      },
      style: {
        stroke: isSuccess ? "#10b981" : "#ef4444",
        strokeWidth: 3,
        opacity: isSuccess ? 1 : 0.7,
        cursor: "pointer",
      },
      labelStyle: {
        fill: isSuccess ? "#065f46" : "#991b1b",
        fontSize: "10px",
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: isSuccess ? "#d1fae5" : "#fee2e2",
        fillOpacity: 0.95,
        rx: 4,
        ry: 4,
      },
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onEdgeClick = (event, edge) => {
    const edgeIndex = edge.data?.edgeIndex;
    if (edgeIndex !== undefined && toolResults.has(edgeIndex)) {
      setSelectedEdge(toolResults.get(edgeIndex));
    }
  };

  const stats = {
    total: edgesData.length,
    success: edgesData.filter((e) => e.status === "success").length,
    failed: edgesData.filter((e) => e.status === "failed").length,
  };

  return (
    <div style={{ width: "100%", height: "900px", background: "#f9fafb" }}>
      <div
        style={{
          padding: "20px",
          background: "white",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "600",
            color: "#111827",
          }}
        >
          Agent Tool Execution Flow
        </h2>
        <p style={{ margin: "0 0 12px 0", color: "#6b7280", fontSize: "14px" }}>
          Real-time visualization of agent interactions with success/failure
          states
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              background: "#f3f4f6",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}
            >
              {stats.total}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Total Calls
            </div>
          </div>
          <div
            style={{
              background: "#d1fae5",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "700", color: "#065f46" }}
            >
              {stats.success}
            </div>
            <div style={{ fontSize: "12px", color: "#065f46" }}>Successful</div>
          </div>
          <div
            style={{
              background: "#fee2e2",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "700", color: "#991b1b" }}
            >
              {stats.failed}
            </div>
            <div style={{ fontSize: "12px", color: "#991b1b" }}>Failed</div>
          </div>
          <div
            style={{
              background: "#f3f4f6",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}
            >
              {contracts.length}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Contracts</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                background: "#10b981",
                borderRadius: "4px",
              }}
            ></div>
            <span>Success</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                background: "#ef4444",
                borderRadius: "4px",
              }}
            ></div>
            <span>Failed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "50%",
              }}
            ></div>
            <span>Agent</span>
          </div>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={onEdgeClick}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.4}
        maxZoom={1.5}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === "agent-reporter") return "#667eea";
            if (node.style?.background) return node.style.background;
            return "#6b7280";
          }}
          style={{ background: "#f3f4f6" }}
        />
        <Background variant="dots" gap={16} size={1} color="#d1d5db" />
      </ReactFlow>

      {/* Tool Result Modal */}
      {selectedEdge && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedEdge(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Tool Execution Result
              </h3>
              <button
                onClick={() => setSelectedEdge(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0 8px",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Contract
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f3f4f6",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "14px",
                  }}
                >
                  {selectedEdge.contract}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Tool Name
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f3f4f6",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  {selectedEdge.tool_name}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Status
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background:
                      selectedEdge.status === "success" ? "#d1fae5" : "#fee2e2",
                    color:
                      selectedEdge.status === "success" ? "#065f46" : "#991b1b",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedEdge.status}
                </div>
              </div>

              {selectedEdge.timestamp && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Timestamp
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f3f4f6",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedEdge.timestamp}
                  </div>
                </div>
              )}

              {selectedEdge.error_type && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Error Type
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#fee2e2",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#991b1b",
                    }}
                  >
                    {selectedEdge.error_type}
                  </div>
                </div>
              )}

              {selectedEdge.reason && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Reason
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f3f4f6",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  >
                    {selectedEdge.reason}
                  </div>
                </div>
              )}

              {selectedEdge.tool_output &&
                selectedEdge.tool_output !== "None" && (
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: "4px",
                      }}
                    >
                      Tool Output
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        background: "#1f2937",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        color: "#f3f4f6",
                        maxHeight: "300px",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {selectedEdge.tool_output}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
