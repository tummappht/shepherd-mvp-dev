"use client";

import { useState } from "react";
import { TbCaretDown, TbMaximize } from "react-icons/tb";
import { Handle, Position } from "reactflow";

export default function CustomNode({ data, onOpenDetail }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState("all");

  const getColor = () => {
    if (data.type === "agent")
      return "text-text-info border-stroke-info bg-bg-info";

    const s = data.successes || 0;
    const f = data.failures || 0;
    if (f > s) return "text-text-failed border-stroke-failed bg-bg-failed";
    return "text-text-success border-stroke-success bg-bg-success";
  };

  const filteredExecutions =
    data.executions?.filter((exec) => {
      if (filter === "all") return true;
      return exec.status === filter;
    }) || [];

  return (
    <div
      className={`${getColor()} border-2 rounded-md p-4 min-w-[220px] backdrop-blur-2xl relative`}
    >
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className={`${getColor()} w-2 h-2`}
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className={`${getColor()} w-2 h-2`}
      />

      <div>
        <div className="text-md font-bold flex items-center justify-between gap-2">
          <span className="truncate">{data.label}</span>
          {data.executions && data.executions.length > 0 && (
            <div className="flex items-center gap-1">
              {data.failures > 0 && (
                <span className="text-xs bg-bg-failed/20 text-text-failed px-1.5 py-0.5 rounded">
                  {data.failures}
                </span>
              )}
              {data.successes > 0 && (
                <span className="text-xs bg-bg-success/20 text-text-success px-1.5 py-0.5 rounded">
                  {data.successes}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:opacity-70 transition-opacity"
              >
                <TbCaretDown
                  className={`transition-transform ${
                    isExpanded ? "-rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {data.type === "contract" && isExpanded && data.executions && (
          <div className="mt-3">
            <div className="flex gap-1 mb-2 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === "all"
                    ? "bg-bg-pending/30 text-text-pending"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                All ({data.executions.length})
              </button>
              <button
                onClick={() => setFilter("failed")}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === "failed"
                    ? "bg-bg-failed/30 text-text-failed"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                Failed ({data.failures})
              </button>
              <button
                onClick={() => setFilter("success")}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === "success"
                    ? "bg-bg-success/30 text-text-success"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                Success ({data.successes})
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto bg-[rgba(0,0,0,0.5)] rounded-lg p-2 space-y-2">
              {filteredExecutions.length === 0 ? (
                <div className="text-xs text-white/50 text-center py-2">
                  No {filter !== "all" ? filter : ""} executions
                </div>
              ) : (
                filteredExecutions.map((exec, idx) => (
                  <div key={idx} className="group relative">
                    <div
                      className={`p-2 rounded-md cursor-pointer transition-all hover:scale-[1.02] ${
                        exec.status === "success"
                          ? "bg-bg-success/30 hover:bg-bg-success/40 text-text-success"
                          : "bg-bg-failed/30 hover:bg-bg-failed/40 text-text-failed"
                      }`}
                      style={{
                        borderLeft: `3px solid ${
                          exec.status === "success" ? "#10b981" : "#ef4444"
                        }`,
                      }}
                      onClick={() => onOpenDetail?.(exec, data.label)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs flex items-center gap-2 mb-1">
                            <span>{exec.status === "success" ? "✓" : "✗"}</span>
                            <span className="truncate">{exec.tool_name}</span>
                          </div>
                          <div className="text-[10px] opacity-70">
                            {new Date(exec.call_timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail?.(exec, data.label);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                        >
                          <TbMaximize className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
