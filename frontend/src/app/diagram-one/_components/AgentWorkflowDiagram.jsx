"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import cola from "cytoscape-cola";

// Register only the layout extensions you need
cytoscape.use(dagre);
cytoscape.use(cola);

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
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:33:48.444152+00:00","tool_name":"send_transaction_tool","status":"failed","error_type":null,"reason":"Transaction reverted: insufficient gas","tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_111","stream_complete":true}',
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
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:34:24.075092+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":"Contract not found","tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_127","stream_complete":true}',
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
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:34:49.169947+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":"View function failed: invalid parameters","tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_139","stream_complete":true}',
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
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:35:23.036705+00:00","tool_name":"evm_control_tool","status":"failed","error_type":null,"reason":"EVM control failed: invalid state","tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_159","stream_complete":true}',
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
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:35:53.794493+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":"Timeout error: execution took too long","tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_179","stream_complete":true}',
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
    data: '{"type":"executor-tool-result","data":{"tag_type":"executor_tool_result","timestamp":"2025-10-11T08:36:16.982128+00:00","tool_name":"call_view_tool","status":"failed","error_type":null,"reason":"Invalid parameters: wrong input format","tool_output":"None","storage_index":null},"tag_type":"EXECUTOR_TOOL_RESULT","stream_id":"stream_195","stream_complete":true}',
  },
];

function processMessages(messages) {
  const contractsMap = new Map();
  const edgesData = [];
  const toolCalls = [];
  const timelineData = [];

  messages.forEach((msg, index) => {
    const parsedData = JSON.parse(msg.data);

    if (parsedData.type === "executor-tool-call") {
      const { contracts, tool_name, stream_id, timestamp } = parsedData.data;
      toolCalls.push({ stream_id, tool_name, contracts, timestamp, index });

      contracts.forEach((contract) => {
        if (!contractsMap.has(contract)) {
          contractsMap.set(contract, {
            name: contract,
            calls: 0,
            successes: 0,
            failures: 0,
            lastCall: timestamp,
            tools: new Set(),
          });
        }
        const info = contractsMap.get(contract);
        info.calls++;
        info.lastCall = timestamp;
        info.tools.add(tool_name);
      });
    } else if (parsedData.type === "executor-tool-result") {
      const { status, reason, tool_name, timestamp } = parsedData.data;

      // Find the matching tool call
      const matchingCall = toolCalls.find(
        (call) => call.tool_name === tool_name
      );

      if (matchingCall) {
        matchingCall.contracts.forEach((contract) => {
          const info = contractsMap.get(contract);
          if (info) {
            if (status === "success") info.successes++;
            else info.failures++;
          }

          edgesData.push({
            contract,
            tool_name,
            status,
            reason,
            timestamp,
            callIndex: matchingCall.index,
          });
        });
      }

      timelineData.push({
        type: "result",
        tool_name,
        status,
        reason,
        timestamp,
      });
    }
  });

  return { contractsMap, edgesData, timelineData };
}

export default function AgentWorkflowDiagram() {
  const [messages, setMessages] = useState(webSocketMessages);
  const [filter, setFilter] = useState("all");
  const [selectedTool, setSelectedTool] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [layout, setLayout] = useState("dagre");
  const [selectedEdge, setSelectedEdge] = useState(null);
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const { contractsMap, edgesData, timelineData } = useMemo(
    () => processMessages(messages),
    [messages]
  );

  // Get unique tools for filtering
  const uniqueTools = useMemo(() => {
    const tools = new Set();
    edgesData.forEach((edge) => tools.add(edge.tool_name));
    return Array.from(tools);
  }, [edgesData]);

  // Filter edges based on selected filter and tool
  const filteredEdges = useMemo(() => {
    let filtered = edgesData;

    if (filter !== "all") {
      filtered = filtered.filter((edge) => edge.status === filter);
    }

    if (selectedTool) {
      filtered = filtered.filter((edge) => edge.tool_name === selectedTool);
    }

    return filtered;
  }, [edgesData, filter, selectedTool]);

  // Prepare graph data for Cytoscape
  const graphData = useMemo(() => {
    const elements = [];

    // Add agent node
    elements.push({
      data: {
        id: "agent-reporter",
        label: "🤖 Agent",
        type: "agent",
      },
    });

    // Add contract nodes
    contractsMap.forEach((contract, name) => {
      elements.push({
        data: {
          id: name,
          label: `${name}\n✓ ${contract.successes} | ✗ ${contract.failures}`,
          type: "contract",
          successes: contract.successes,
          failures: contract.failures,
        },
      });
    });

    // Add edges
    filteredEdges.forEach((edge, idx) => {
      const isSuccess = edge.status === "success";
      elements.push({
        data: {
          id: `edge-${edge.contract}-${idx}`,
          source: "agent-reporter",
          target: edge.contract,
          label: edge.tool_name,
          tool_name: edge.tool_name,
          status: edge.status,
          reason: edge.reason,
          timestamp: edge.timestamp,
          isSuccess,
        },
      });
    });

    return elements;
  }, [contractsMap, filteredEdges]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: graphData,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: "single",

      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele) => {
              if (ele.data("type") === "agent") return "#667eea";
              const successes = ele.data("successes") || 0;
              const failures = ele.data("failures") || 0;
              if (successes > failures) return "#10b981";
              if (failures > successes) return "#ef4444";
              return "#6b7280";
            },
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            color: "white",
            "text-outline-color": "#000",
            "text-outline-width": 1,
            "font-size": "10px",
            "font-weight": "bold",
            width: (ele) => (ele.data("type") === "agent" ? 80 : 70),
            height: (ele) => (ele.data("type") === "agent" ? 80 : 60),
            shape: (ele) =>
              ele.data("type") === "agent" ? "ellipse" : "round-rectangle",
            "border-width": 2,
            "border-color": (ele) => {
              if (ele.data("type") === "agent") return "#5a67d8";
              return "rgba(255,255,255,0.3)";
            },
            "overlay-opacity": 0,
            "transition-property":
              "background-color, border-color, width, height",
            "transition-duration": "0.3s",
            // Prevent node grabbing
            grabbable: false,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#fbbf24",
            width: (ele) => (ele.data("type") === "agent" ? 90 : 80),
            height: (ele) => (ele.data("type") === "agent" ? 90 : 70),
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": (ele) =>
              ele.data("isSuccess") ? "#10b981" : "#ef4444",
            "target-arrow-color": (ele) =>
              ele.data("isSuccess") ? "#10b981" : "#ef4444",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: (ele) =>
              `${ele.data("tool_name")}${
                ele.data("reason") ? "\n" + ele.data("reason") : ""
              }`,
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            "font-size": "8px",
            color: (ele) => (ele.data("isSuccess") ? "#065f46" : "#991b1b"),
            "text-background-color": (ele) =>
              ele.data("isSuccess") ? "#d1fae5" : "#fee2e2",
            "text-background-opacity": 0.9,
            "text-background-padding": 2,
            "text-border-color": (ele) =>
              ele.data("isSuccess") ? "#10b981" : "#ef4444",
            "text-border-width": 1,
            "text-border-style": "solid",
            "overlay-opacity": 0,
            opacity: (ele) => (ele.data("isSuccess") ? 1 : 0.8),
            // Prevent edge grabbing
            grabbable: false,
          },
        },
        {
          selector: "edge:selected",
          style: {
            width: 3,
            "line-color": "#fbbf24",
            "target-arrow-color": "#fbbf24",
          },
        },
        {
          selector: "edge.animated",
          style: {
            "line-style": "dashed",
            "line-dash-pattern": [5, 5],
            animation: "edge-anim 2s linear infinite",
          },
        },
      ],
      layout: {
        name: layout,
        directed: true,
        padding: 30,
        spacingFactor: 1.2,
        animate: true,
        animationDuration: 500,
        fit: true,
        avoidOverlap: true,
        nodeRepulsion: layout === "cola" ? 4000 : undefined,
        edgeElasticity: layout === "cola" ? 100 : undefined,
        nestingFactor: layout === "cola" ? 5 : undefined,
        gravity: layout === "cola" ? 80 : undefined,
        numIter: layout === "cola" ? 1000 : undefined,
        initialTemp: layout === "cola" ? 200 : undefined,
        coolingFactor: layout === "cola" ? 0.95 : undefined,
        minTemp: layout === "cola" ? 1.0 : undefined,
      },
    });

    // Add event listeners (only for viewing, not editing)
    cyRef.current.on("tap", "edge", (evt) => {
      const edge = evt.target;
      setSelectedEdge(edge.data());
    });

    cyRef.current.on("tap", (evt) => {
      if (evt.target === cyRef.current) {
        setSelectedEdge(null);
      }
    });

    // Animate successful edges
    cyRef.current.edges().forEach((edge) => {
      if (edge.data("isSuccess")) {
        edge.addClass("animated");
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graphData, layout]);

  // Update layout when it changes
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current
        .layout({
          name: layout,
          animate: true,
          animationDuration: 500,
          fit: true,
        })
        .run();
    }
  }, [layout]);

  return (
    <>
      {/* Add Cytoscape styles inline */}
      <style jsx global>{`
        .cytoscape-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .cytoscape-container canvas {
          outline: none;
        }

        @keyframes edge-anim {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <div className="w-full h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="cytoscape-container w-full h-full bg-white"
          />

          {selectedEdge && (
            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md border border-gray-200 w-64 z-10">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Edge Details
              </h3>
              <div className="text-sm text-gray-700">
                <div className="mb-2">
                  <span className="font-medium">Tool:</span>{" "}
                  {selectedEdge.tool_name}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 font-semibold ${
                      selectedEdge.isSuccess ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {selectedEdge.status}
                  </span>
                </div>
                {selectedEdge.reason && (
                  <div className="mb-2">
                    <span className="font-medium">Reason:</span>{" "}
                    {selectedEdge.reason}
                  </div>
                )}
                <div className="mb-3">
                  <span className="font-medium">Time:</span>{" "}
                  {new Date(selectedEdge.timestamp).toLocaleString()}
                </div>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="w-full px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
