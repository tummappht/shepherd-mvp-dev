"use client";
import Diagram from "@/components/Diagram";
import HypothesisManager from "@/components/HypothesisManager";

export default function MasRun() {
    return (
        <div className="bg-black h-[calc(100vh-5rem)] w-full flex flex-row items-start justify-center space-x-8 py-8 px-24">
            {/* Hypothesis Section */}
            <div className="h-full w-full max-w-3xl flex flex-col">
                <HypothesisManager />
            </div>

            {/* Diagram Section */}
            <div className="rounded-lg border border-[#232323] bg-[#0C0C0C] h-full w-full max-w-3xl flex flex-col">
                <div className="px-4 py-2 border-b border-[#232323] font-semibold text-white bg-[#141414] rounded-t-lg">
                Diagram
                </div>
                <div className="flex-1 flex items-center justify-center text-white bg-[#0C0C0C] rounded-b-lg">
                <Diagram />
                </div>
            </div>
        </div>
    );
}
