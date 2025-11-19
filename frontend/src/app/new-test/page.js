"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FileDropZone from "@/components/FileDropZone";
import Card, {
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/Card";
import { FaSyncAlt, FaTimes } from "react-icons/fa";
import { useRuns } from "@/hook/useRuns";
import { useForm, Controller } from "react-hook-form";
import ReferenceModal from "./_components/ReferenceModal";

export default function NewTest() {
  const [isShowRef, setIsShowRef] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);
  const [attachedReference, setAttachedReference] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { handleStartRun } = useRuns();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      contactAsset: null,
      tunnelUrl: "",
      githubUrl: "",
      projectDescription: "",
    },
  });

  const handleAttach = () => {
    if (selectedReference) {
      setAttachedReference(selectedReference);
      setIsShowRef(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let sessionName = data.sessionName;
      if (!sessionName && data.githubUrl) {
        const urlParts = data.githubUrl.split("/");
        sessionName = urlParts[urlParts.length - 1] || data.githubUrl;
      }

      const formData = new FormData();
      formData.append("tunnel_url", data.tunnelUrl);
      formData.append("github_url", data.githubUrl);
      formData.append("project_description", data.projectDescription);
      formData.append("environment", data.environment);
      formData.append("session_name", sessionName);
      if (data.contactAsset?.[0]) {
        formData.append("assets", data.contactAsset[0]);
      }

      if (Array.isArray(data.whitePaper)) {
        data.whitePaper.forEach((file, idx) => {
          formData.append(`whitePaper[${idx}]`, file);
        });
      } else if (data.whitePaper?.[0]) {
        formData.append("whitePaper", data.whitePaper[0]);
      }

      await handleStartRun(formData);

      router.push("/mas-run?session_name=" + encodeURIComponent(sessionName));
    } catch (error) {
      console.error("Error during form submission:", error);
      alert("An error occurred while submitting the form. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="container mx-auto flex flex-col gap-4"
      >
        <Card>
          <CardTitle className="mb-0">Upload Repository</CardTitle>
          <CardDescription>
            Please upload your repository as a .zip file for analysis.
          </CardDescription>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-semibold">Contract Asset</p>
              <Controller
                control={control}
                name="contactAsset"
                rules={{ required: "Please upload a contract asset zip file" }}
                render={({ field }) => (
                  <FileDropZone
                    acceptedFileTypes=".zip"
                    maxFileSize={50 * 1024 * 1024} // 50MB
                    maxFiles={1}
                    {...field}
                  />
                )}
              />
              {errors.contactAsset && (
                <span className="text-text-failed text-xs">
                  {errors.contactAsset.message}
                </span>
              )}
            </div>
            <div>
              <p className="mb-2 font-semibold">Tunnel URL</p>
              <input
                type="text"
                placeholder="Tunnel URL"
                className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
                {...register("tunnelUrl", {
                  required: "Tunnel URL is required",
                  pattern: {
                    value: /^https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com\s*$/,
                    message:
                      "Please enter a valid Cloudflare tunnel URL (e.g., https://example.trycloudflare.com)",
                  },
                })}
                aria-invalid={errors.tunnelUrl ? "true" : "false"}
              />
              {errors.tunnelUrl && (
                <span className="text-text-failed text-xs">
                  {errors.tunnelUrl.message}
                </span>
              )}
            </div>
            <div>
              <p className="mb-2 font-semibold">Github URL</p>
              <input
                type="text"
                placeholder="Github URL"
                className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
                {...register("githubUrl", {
                  required: "Github URL is required",
                  pattern: {
                    value: /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/,
                    message:
                      "Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)",
                  },
                })}
                aria-invalid={errors.githubUrl ? "true" : "false"}
              />
              {errors.githubUrl && (
                <span className="text-text-failed text-xs">
                  {errors.githubUrl.message}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="mb-0">Session Name</CardTitle>
          <CardDescription>
            Please provide a name for your session. If left empty, the
            repository name will be used.
          </CardDescription>
          <CardContent>
            <input
              type="text"
              placeholder="Session Name"
              className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
              {...register("sessionName")}
              aria-invalid={errors.sessionName ? "true" : "false"}
            />
            {errors.sessionName && (
              <span className="text-text-failed text-xs">
                This field is required
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="mb-0">Project description</CardTitle>
          <CardDescription>
            Please provide the protocol documentation to help better inform the
            repository.
          </CardDescription>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-semibold">Description (Optional)</p>
              <textarea
                className="w-full py-2 px-3 h-36 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
                placeholder="Insert documentation..."
                {...register("projectDescription")}
                aria-invalid={errors.projectDescription ? "true" : "false"}
              />
              {errors.projectDescription && (
                <span className="text-text-failed text-xs">
                  This field is required
                </span>
              )}
            </div>
            <div>
              <p className="mb-2 font-semibold">White Paper (Optional)</p>
              <Controller
                control={control}
                name="whitePaper"
                render={({ field }) => (
                  <FileDropZone
                    size="small"
                    acceptedFileTypes=".pdf,.doc,.docx"
                    maxFileSize={50 * 1024 * 1024} // 50MB
                    multiple
                    {...field}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="mb-0">Attach Reference</CardTitle>
          <CardDescription>
            Attach related contracts you&apos;ve ref to inform vulnerability
            exploration.
          </CardDescription>
          <CardContent>
            <div className="flex flex-col gap-4">
              {attachedReference ? (
                <div className="flex items-center justify-between p-3 bg-surface border border-gray-border rounded-lg hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/images/defi.png"
                      width={35}
                      height={35}
                      alt="DeFiHackLabs"
                    />
                    <Image
                      src="/images/file.png"
                      width={20}
                      height={20}
                      alt="File"
                    />
                    <p className="text-sm">{selectedReference}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAttachedReference(null)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove file"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full flex flex-row items-center justify-center px-4 py-1 gap-2 rounded-lg bg-gray-border cursor-not-allowed"
                  // onClick={() => setIsShowRef(true)}
                >
                  <p className="text-lg text-helper">+</p>
                  <p className="text-sm font-semibold text-helper">
                    Attach Files
                  </p>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="mb-0">Select an Environment</CardTitle>
          <CardDescription>
            Please select the environment where you&apos;d like to deploy the
            smart contracts from the repository indicated.
          </CardDescription>
          <CardContent>
            <select
              className="w-full py-2 px-4 border border-gray-border rounded-md bg-surface text-foreground"
              {...register("environment", {
                required: "Please select an environment",
              })}
              aria-invalid={errors.environment ? "true" : "false"}
            >
              <option value="" disabled>
                Choose environment…
              </option>
              <option value="local">Local</option>
              {/* <option value="testnet" disabled>Testnet</option> */}
            </select>
            {errors.environment && (
              <span className="text-text-failed text-xs">
                {errors.environment.message}
              </span>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="border-2 bg-surface border-gray-border text-gray-300 hover:bg-surface-hover w-24 h-12 rounded-lg transition-all"
          >
            Back
          </button>
          <button
            type="submit"
            className={`border-2 rounded-lg transition-all h-12 w-24 ${
              !isLoading
                ? "bg-primary hover:bg-primary-hover border-primary hover:border-primary-hover"
                : "bg-gray-500 border-gray-500 cursor-not-allowed"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <FaSyncAlt className="animate-spin mx-auto text-base" />
            ) : (
              "Next"
            )}
          </button>
        </div>
      </form>
      <ReferenceModal
        isShow={isShowRef}
        setIsShow={setIsShowRef}
        handleAttach={handleAttach}
        selectedReference={selectedReference}
        setSelectedReference={setSelectedReference}
      />
    </>
  );
}
