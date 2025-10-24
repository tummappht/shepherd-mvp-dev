"use client";
// import Diagram from "@/components/Diagram";
import AgentWorkflowDiagram from "@/components/diagram/Diagram";
import HypothesisManager from "@/components/hypothesis/HypothesisManager";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function MasRun() {
  const searchParams = useSearchParams();
  const runIdFromQuery = searchParams.get("run_id");

  return (
    <div className="container mx-auto h-full max-h-full grid grid-cols-2 gap-[1px] bg-stroke rounded-lg overflow-hidden">
      {/* Hypothesis Section */}
      <Suspense fallback={<div>Loading hypotheses...</div>}>
        <HypothesisManager runIdFromQuery={runIdFromQuery} />
      </Suspense>

      {/* Diagram Section */}
      <AgentWorkflowDiagram runIdFromQuery={runIdFromQuery} />
    </div>
  );
}
