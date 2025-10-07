import { useEffect, useState, useCallback } from "react";
import Modal from "./modal/Modal";

export default function WelcomeModal() {
  const [showModal, setShowModal] = useState(true);

  return (
    <Modal isShow={showModal} onChange={setShowModal}>
      <div className="space-y-3">
        <p className="text-sm text-gray-200">
          <span className="text-primary">
            Shepherd is an AI-driven security engine that validates and
            reproduces smart contract exploits.
          </span>{" "}
          Our goal is to give auditors and developers a security copilot that
          automates setup, execution, and proof of vulnerabilities that normally
          take hours of manual work.
        </p>
        <p className="text-sm text-gray-200">
          <span className="text-primary">Shepherd Alpha</span> is a guided demo
          of that system. In this release, Shepherd:
        </p>
        <ul className="list-disc text-sm text-gray-200 pl-6">
          <li>
            Spins up an environment for smart contract repos with clean
            deployment pipelines (e.g., Damn Vulnerable DeFi, NFT/token
            examples)
          </li>
          <li>Orchestrates attack paths based on known exploit classes</li>
          <li>
            Produces reproducible exploit transcripts auditors can use as PoCs
          </li>
        </ul>
        <p className="text-sm text-gray-200">
          Auditors today rely on slow manual processes or static tools that can
          flag issues but can't execute them end-to-end. Shepherd shows that
          multi-agent AI can—spinning up the environment, chaining the calls,
          and proving the exploit in full.
        </p>
        <p className="text-sm text-gray-200">
          Right now, Alpha runs on repos with straightforward initialization.
          Complex protocols like Uniswap or Compound—where deployment and state
          setup are heavier—remain the focus of our upcoming Beta, which
          generalizes Shepherd's orchestration to production-grade protocols.
        </p>
      </div>

      <div className="mt-6 flex justify-center items-center gap-3">
        <button
          type="button"
          className="w-full px-4 py-2 rounded-md border border-gray-border hover:bg-white/5 transition-all"
          onClick={() => setShowModal(false)}
        >
          Dismiss
        </button>
      </div>
    </Modal>
  );
}
