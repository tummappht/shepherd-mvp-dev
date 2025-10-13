"use client";

import { useState, useMemo } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./CustomNode";
import { ExecutionDetailDrawer } from "./ExecutionDetailDrawer";
//TODO: Need to improve drawer

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
    data: '{"type":"executor-tool-call","data":{"tag_type":"executor_tool_call","timestamp":"2025-10-11T08:34:18.060358+00:00","tool_name":"send_transaction_tool","contracts":["VoterMeToBePresidentThisYear"]},"tag_type":"EXECUTOR_TOOL_CALL","stream_id":"stream_124","stream_complete":true}',
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
];

function processMessages(messages) {
  const contractsMap = new Map();
  const edgesData = [];
  const toolCalls = [];

  messages.forEach((msg) => {
    const parsedData = JSON.parse(msg.data);

    if (parsedData.type === "executor-tool-call") {
      const { contracts, tool_name, stream_id, timestamp } = parsedData.data;
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
    } else if (parsedData.type === "executor-tool-result") {
      const { status, reason, tool_name, tool_output, timestamp } =
        parsedData.data;
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

export default function AgentWorkflowDiagram() {
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { contractsMap, edgesData } = useMemo(
    () => processMessages(webSocketMessages),
    []
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
          label: "Agent: Reporter",
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
  }, [contractsMap]);

  const initialEdges = useMemo(() => {
    return edgesData.map((edge, idx) => {
      const isSuccess = edge.status === "success";

      return {
        id: `e-${idx}`,
        source: "agent-reporter",
        target: edge.contract,
        sourceHandle: "right",
        targetHandle: "left",
        type: "bezier",
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

  return (
    <div style={{ width: "100%", height: "100vh", background: "#0f0f23" }}>
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
    </div>
  );
}
