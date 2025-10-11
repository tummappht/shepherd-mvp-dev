"use client";

import React, { useEffect, useRef, useMemo } from "react";
import cytoscape from "cytoscape";

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

  messages.forEach((msg) => {
    const parsedData = JSON.parse(msg.data);

    if (parsedData.type === "executor-tool-call") {
      const { contracts, tool_name, stream_id } = parsedData.data;
      toolCalls.push({ stream_id, tool_name, contracts });

      contracts.forEach((contract) => {
        if (!contractsMap.has(contract)) {
          contractsMap.set(contract, {
            name: contract,
            successes: 0,
            failures: 0,
          });
        }
      });
    } else if (parsedData.type === "executor-tool-result") {
      const { status, reason, tool_name } = parsedData.data;
      const lastCall = toolCalls[toolCalls.length - 1];

      if (lastCall && lastCall.tool_name === tool_name) {
        lastCall.contracts.forEach((contract) => {
          const info = contractsMap.get(contract);
          if (info) {
            if (status === "success") info.successes++;
            else info.failures++;
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

export default function AgentWorkflowDiagram() {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const { contractsMap, edgesData } = useMemo(
    () => processMessages(webSocketMessages),
    []
  );

  const stats = useMemo(
    () => ({
      total: edgesData.length,
      success: edgesData.filter((e) => e.status === "success").length,
      failed: edgesData.filter((e) => e.status === "failed").length,
      contracts: contractsMap.size,
    }),
    [edgesData, contractsMap]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const contracts = Array.from(contractsMap.values());

    const nodes = [
      {
        data: {
          id: "agent-reporter",
          label: "🤖 Agent:\nReporter",
          type: "agent",
        },
      },
      ...contracts.map((contract) => ({
        data: {
          id: contract.name,
          label: `${contract.name}\n✓ ${contract.successes} | ✗ ${contract.failures}`,
          type: "contract",
          successes: contract.successes,
          failures: contract.failures,
        },
      })),
    ];

    const edges = edgesData.map((edge, idx) => ({
      data: {
        id: `e${idx}`,
        source: "agent-reporter",
        target: edge.contract,
        label: edge.reason
          ? `${edge.tool_name}\n${edge.reason}`
          : edge.tool_name,
        status: edge.status,
      },
    }));

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "100px",
            "font-size": "12px",
            "font-weight": "600",
            color: "#ffffff",
            width: "120px",
            height: "120px",
            "border-width": 3,
            "border-color": "#ffffff",
            "background-color": "#6b7280",
          },
        },
        {
          selector: 'node[type="agent"]',
          style: {
            "background-color": "#667eea",
            "border-color": "#5a67d8",
            width: "140px",
            height: "140px",
            "font-size": "14px",
            shape: "ellipse",
          },
        },
        {
          selector: 'node[type="contract"]',
          style: {
            "background-color": (ele) => {
              const s = ele.data("successes");
              const f = ele.data("failures");
              if (s > f) return "#10b981";
              if (f > s) return "#ef4444";
              return "#6b7280";
            },
            shape: "roundrectangle",
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "curve-style": "bezier",
            "control-point-step-size": 80,
            "target-arrow-shape": "triangle",
            "arrow-scale": 1.5,
            label: "data(label)",
            "font-size": "10px",
            "font-weight": "600",
            "text-background-opacity": 1,
            "text-background-color": "#ffffff",
            "text-background-padding": "4px",
            "text-border-opacity": 1,
            "text-border-width": 1,
            "text-border-color": "#e5e7eb",
            color: "#1f2937",
            "line-color": (ele) =>
              ele.data("status") === "success" ? "#10b981" : "#ef4444",
            "target-arrow-color": (ele) =>
              ele.data("status") === "success" ? "#10b981" : "#ef4444",
            "text-rotation": "autorotate",
          },
        },
      ],
      layout: {
        name: "circle",
        radius: 280,
        avoidOverlap: true,
        animate: true,
        animationDuration: 500,
      },
    });

    // Center the agent node
    const agentNode = cyRef.current.getElementById("agent-reporter");
    agentNode.position({ x: 0, y: 0 });
    agentNode.lock();

    cyRef.current.fit(50);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [contractsMap, edgesData]);

  return (
    <div
      className="w-full h-screen bg-surface bg-[radial-gradient(circle,_#1e293b_1px,_transparent_1px)] [background-size:20px_20px] shadow-md overflow-auto"
      ref={containerRef}
    />
  );
}
