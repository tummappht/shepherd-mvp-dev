import AgentWorkflowDiagram from "./_components/AgentWorkflowDiagram";
// import AgentFlow from "./_components/Diagram";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Network Overview</h1>
      {/* <AgentFlow /> */}
      <AgentWorkflowDiagram />
    </main>
  );
}
