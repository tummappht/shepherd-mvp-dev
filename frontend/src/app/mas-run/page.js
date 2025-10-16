"use client";
// import Diagram from "@/components/Diagram";
import AgentWorkflowDiagram from "@/components/diagram/Diagram";
import HypothesisManager from "@/components/HypothesisManager";
import { Suspense } from "react";

export default function MasRun() {
  return (
    <div className="container mx-auto h-full max-h-full grid grid-cols-2 gap-[1px] bg-stroke rounded-lg overflow-hidden">
      {/* Hypothesis Section */}
      <Suspense fallback={<div>Loading hypotheses...</div>}>
        <HypothesisManager />
      </Suspense>

      {/* Diagram Section */}
      <AgentWorkflowDiagram />
    </div>
  );
}
