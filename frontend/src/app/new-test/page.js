"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import References from "@/components/References";
import ModalWrapper from "@/components/ModalWrapper";
import { useState } from "react";

export default function NewTest() {
  const [showRef, setShowRef] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);
  const [attachedReference, setAttachedReference] = useState(null);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const router = useRouter();

  const handleAttach = () => {
    if (selectedReference) {
      setAttachedReference(selectedReference);
      setShowRef(false);
    }
  };

  const handleEnvChange = (env) => {
    setSelectedEnv(selectedEnv === env ? null : env);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push(`/mas-run?repoUrl=${encodeURIComponent(repoUrl)}`);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="container mx-auto flex flex-col gap-8 py-8 px-4"
      >
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-row justify-between items-center">
            <div className="flex flex-col">
              <p className="text-md font-semibold">Repository URL</p>
              <p className="text-secondary">
                Insert the repository link you&apos;d like to explore
              </p>
            </div>
          </div>
          <select
            name="repoUrl"
            className="w-full p-4 border border-gray-border rounded-md bg-surface text-[#e5e7eb]"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose repository…
            </option>
            <option value="https://github.com/dhruvjain2905/naive-receiver">
              https://github.com/dhruvjain2905/naive-receiver
            </option>
            <option value="https://github.com/dhruvjain2905/Truster">
              https://github.com/dhruvjain2905/Truster
            </option>
            <option value="https://github.com/dhruvjain2905/Unstoppable">
              https://github.com/dhruvjain2905/Unstoppable
            </option>
            <option value="https://github.com/tunonraksa/puppet-deploy">
              https://github.com/tunonraksa/puppet-deploy
            </option>
          </select>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Project description</p>
            <p className="text-secondary">
              Please provide the protocol documentation to help better inform
              the repository.
            </p>
          </div>
          <textarea
            name="projectDescription"
            className="w-full p-4 h-36 border border-gray-border rounded-md bg-surface text-[#595959] placeholder-[#595959] placeholder:italic"
            placeholder="Insert documentation..."
          />
          <button
            type="button"
            className="w-fit flex flex-row items-center justify-center px-4 py-2 gap-2 rounded-lg bg-primary hover:bg-primary-hover transition-all"
          >
            <Image src="/images/she.png" height={20} width={20} alt="Upload" />
            <p className="text-sm font-semibold">Upload White Paper</p>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Attach Reference</p>
            <p className="text-secondary">
              Attach related contracts you&apos;ve ref to inform vulnerability
              exploration.
            </p>
          </div>
          {attachedReference ? (
            <div className="w-fit flex flex-row px-4 py-2 rounded-lg gap-2 items-center bg-surface border border-gray-border">
              <Image
                src="/images/defi.png"
                width={35}
                height={35}
                alt="DeFiHackLabs"
              />
              <Image src="/images/file.png" width={20} height={20} alt="File" />
              <p className="text-sm">{selectedReference}</p>
              <button type="button" onClick={() => setAttachedReference(null)}>
                <Image src="/images/x.png" alt="Close" width={16} height={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="w-fit flex flex-row items-center justify-center px-4 py-1 gap-2 rounded-lg bg-gray-border"
              onClick={() => setShowRef(true)}
            >
              <p className="text-lg text-[#595959]">+</p>
              <p className="text-sm font-semibold text-[#595959]">
                Attach Files
              </p>
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-row justify-between items-center">
            <div className="flex flex-col">
              <p className="text-md font-semibold">Select an Environment</p>
              <p className="text-secondary">
                Please select the environment where you&apos;d like to deploy
                the smart contracts from the repository indicated.
              </p>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row gap-3">
              <button
                type="button"
                onClick={() => handleEnvChange("local")}
                className={`w-fit px-4 py-1 rounded-lg border-2 transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                  selectedEnv === "local"
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-gray-border text-gray-300 hover:bg-surface-hover hover:border-gray-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedEnv === "local"
                      ? "bg-white border-white"
                      : "border-gray-400"
                  }`}
                >
                  {selectedEnv === "local" && (
                    <svg
                      className="w-3 h-3 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold">Local</span>
              </button>
              <button
                type="button"
                onClick={() => handleEnvChange("testnet")}
                className={`w-fit px-4 py-1 rounded-lg border-2 transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                  selectedEnv === "testnet"
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-gray-border text-gray-300 hover:bg-surface-hover"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedEnv === "testnet"
                      ? "bg-white border-white"
                      : "border-gray-400"
                  }`}
                >
                  {selectedEnv === "testnet" && (
                    <svg
                      className="w-3 h-3 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-semibold">Testnet</span>
              </button>
            </div>
          </div>
          <div className="flex flex-row justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="border-2 bg-surface border-gray-border text-gray-300 hover:bg-surface-hover px-6 py-3 rounded-lg transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover border-2 border-primary hover:border-primary-hover px-6 py-3 rounded-lg transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </form>
      {showRef && (
        <ModalWrapper>
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative flex flex-col px-8 py-4 bg-surface border border-gray-border gap-4 rounded-lg w-full max-w-lg">
              <button
                type="button"
                onClick={() => setShowRef(false)}
                className="absolute top-4 right-4"
              >
                <Image src="/images/x.png" alt="Close" width={16} height={16} />
              </button>

              <div className="flex flex-col gap-1">
                <p className="text-md font-semibold">References</p>
                <p className="text-secondary">
                  Identify smart contracts with similar vulnerabilities to
                  support your hypothesis.
                </p>
              </div>

              <References
                clicked={selectedReference}
                setClicked={setSelectedReference}
              />

              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-sm transition-all"
                onClick={handleAttach}
              >
                Attach
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </>
  );
}
