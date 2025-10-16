"use client";

import { useMemo } from "react";
import { TbX } from "react-icons/tb";

export function ExecutionDetailDrawer({
  execution,
  contractName,
  isOpen,
  onClose,
}) {
  if (!isOpen || !execution) return null;

  const copyToClipboard = (message) => {
    navigator.clipboard.writeText(message);
  };

  const toolOutput = useMemo(() => {
    try {
      const toolOutput = execution.tool_output;
      const validJsonString = toolOutput.replace(/'/g, '"');

      const formattedOutput = JSON.stringify(
        JSON.parse(validJsonString),
        null,
        2
      );
      return formattedOutput;
    } catch (e) {
      return "{}";
    }
  }, [execution.tool_output]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl z-50 overflow-y-auto transform transition-transform flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-stroke p-4 flex items-start justify-between">
          <div>
            <div className="text-md text-secondary mb-1">{contractName}</div>
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
              {execution.tool_name}
            </h2>
            <p className="text-sm text-secondary mt-2">
              {new Date(execution.call_timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:bg-surface-hover transition-all duration-200 focus:outline-none rounded p-1.5 ml-auto"
          >
            <TbX />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1">
          {/* Status */}
          <div>
            <h3 className="text-md text-white mb-2">Status</h3>
            <p
              className={`text-md ${
                execution.status === "success"
                  ? "text-text-success"
                  : "text-text-failed"
              }`}
            >
              {execution.status}
            </p>
          </div>

          {/* Reason (if failed) */}
          {execution.reason && (
            <div>
              <h3 className="text-md text-white mb-2">Error Reason</h3>
              <p className="text-text-failed whitespace-pre-wrap">
                {execution.reason}
              </p>
            </div>
          )}

          {/* Tool Output */}
          {toolOutput && (
            <div>
              <h3 className="text-md text-white mb-2">Tool Output</h3>
              <div className="relative">
                <div className="bg-surface border border-stroke rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-white font-mono">
                    {toolOutput}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(toolOutput)}
                    className="absolute right-2 top-2 text-sm text-secondary hover:bg-surface-hover transition-all duration-200 focus:outline-none rounded p-1.5"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex gap-3 p-4">
          <button
            onClick={onClose}
            className="px-6 border-2 bg-surface border-gray-border text-gray-300 hover:bg-surface-hover h-12 rounded-lg transition-all w-full"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
