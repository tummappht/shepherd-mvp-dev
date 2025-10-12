import { useState } from "react";
import { TbCaretDown, TbMaximize, TbX } from "react-icons/tb";
import { Handle, Position } from "reactflow";

export default function CustomNode({ data, onOpenDetail }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState("all");

  const getColor = () => {
    if (data.type === "agent")
      return "text-text-info border-stroke-info bg-bg-info";

    const s = data.successes || 0;
    const f = data.failures || 0;
    if (s > f) return "text-text-success border-stroke-success bg-bg-success";
    if (f > s) return "text-text-failed border-stroke-failed bg-bg-failed";

    return "text-text-pending border-stroke-pending bg-bg-pending";
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
                          {exec.status === "failed" && exec.reason && (
                            <div className="mt-1 text-[10px] opacity-80 truncate">
                              {exec.reason}
                            </div>
                          )}
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

// Export the Drawer component separately
export function ExecutionDetailDrawer({
  execution,
  contractName,
  isOpen,
  onClose,
}) {
  if (!isOpen || !execution) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(execution, null, 2));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-slate-900 shadow-2xl z-50 overflow-y-auto transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-1">{contractName}</div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span
                className={
                  execution.status === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {execution.status === "success" ? "✓" : "✗"}
              </span>
              {execution.tool_name}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {new Date(execution.call_timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <TbX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Status
            </h3>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium ${
                execution.status === "success"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              <span>{execution.status === "success" ? "✓" : "✗"}</span>
              {execution.status.toUpperCase()}
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Timestamps
            </h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Call Started</span>
                <span className="text-white font-mono text-sm">
                  {new Date(execution.call_timestamp).toLocaleString()}
                </span>
              </div>
              {execution.timestamp && (
                <>
                  <div className="border-t border-slate-700 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">
                      Result Received
                    </span>
                    <span className="text-white font-mono text-sm">
                      {new Date(execution.timestamp).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reason (if failed) */}
          {execution.reason && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Error Reason
              </h3>
              <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-4">
                <p className="text-red-200 whitespace-pre-wrap">
                  {execution.reason}
                </p>
              </div>
            </div>
          )}

          {/* Tool Output */}
          {execution.tool_output &&
            execution.tool_output !== "None" &&
            execution.tool_output !== "{}" && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Tool Output
                </h3>
                <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono">
                    {JSON.stringify(JSON.parse(execution.tool_output), null, 2)}
                  </pre>
                </div>
              </div>
            )}

          {/* Raw Data */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Raw Execution Data
            </h3>
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-slate-300 font-mono">
                {JSON.stringify(execution, null, 2)}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Copy Full Details
            </button>
            <button
              onClick={onClose}
              className="px-6 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
