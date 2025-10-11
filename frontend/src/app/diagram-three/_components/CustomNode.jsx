import { useState } from "react";
import { TbCaretDown } from "react-icons/tb";
import { Handle, Position } from "reactflow";

export default function CustomNode({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getColor = () => {
    if (data.type === "agent")
      return "text-text-pending border-stroke-pending bg-bg-pending";

    const s = data.successes || 0;
    const f = data.failures || 0;
    if (s > f) return "text-text-success border-stroke-success bg-bg-success";
    if (f > s) return "text-text-failed border-stroke-failed bg-bg-failed";

    return "text-text-info border-stroke-info bg-bg-info";
  };

  return (
    <div
      className={`${getColor()} border-2 rounded-md p-4 min-w-[220px] backdrop-blur-lg`}
    >
      <Handle
        type="source"
        position={Position.Right}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="source"
        position={Position.Left}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="source"
        position={Position.Top}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="target"
        position={Position.Right}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="target"
        position={Position.Top}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className={`${getColor()} w-2 h-2`}
      />

      <div>
        <div className="text-md font-bold flex items-center justify-between">
          <span>{data.label}</span>
          {data.executions && data.executions.length > 0 && (
            <button type="button" onClick={() => setIsExpanded(!isExpanded)}>
              <TbCaretDown
                className={`transition-transform ${
                  isExpanded ? "-rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
        {data.type === "contract" && isExpanded && data.executions && (
          <div
            style={{
              marginTop: "12px",
              maxHeight: "300px",
              overflowY: "auto",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "8px",
              padding: "8px",
            }}
          >
            {data.executions.map((exec, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "8px",
                  padding: "8px",
                  background:
                    exec.status === "success"
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  borderLeft: `3px solid ${
                    exec.status === "success" ? "#10b981" : "#ef4444"
                  }`,
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{exec.status === "success" ? "✓" : "✗"}</span>
                  <span>{exec.tool_name}</span>
                </div>
                <div style={{ opacity: 0.9, marginBottom: "4px" }}>
                  {new Date(exec.call_timestamp).toLocaleTimeString()}
                </div>
                {exec.status && exec.status === "failed" && (
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "4px 6px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "4px",
                      wordBreak: "break-word",
                      maxHeight: "80px",
                      overflowY: "auto",
                    }}
                  >
                    Reason: {exec.reason ? exec.reason : "-"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
