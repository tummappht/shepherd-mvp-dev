"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceUpdateUserSessionName } from "@/services/user";
import PropTypes from "prop-types";
import Modal from "../modal/Modal";
import { useEffect } from "react";

export default function EditSessionNameModal({
  isOpen,
  onClose,
  session,
  setSessionName,
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      session_name: session?.session_name || "",
    },
  });

  // Reset form when session changes
  useEffect(() => {
    if (session) {
      reset({
        session_name: session.session_name || "",
      });
    }
  }, [session, reset]);

  const updateSessionNameMutation = useMutation({
    mutationFn: ({ runId, session_name }) =>
      serviceUpdateUserSessionName(runId, session_name),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
      if (setSessionName && variables?.session_name) {
        setSessionName(variables.session_name);
      }
      onClose();
      reset();
    },
    onError: (error) => {
      console.error("Failed to update session name:", error);
      alert("Failed to update session name. Please try again.");
    },
  });

  const onSubmit = (data) => {
    if (!session?.run_id) return;

    updateSessionNameMutation.mutate({
      runId: session.run_id,
      session_name: data.session_name,
    });
  };

  const handleClose = () => {
    if (!updateSessionNameMutation.isPending) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isShow={isOpen} onChange={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Edit Session Name
          </h2>
          <p className="text-sm text-secondary">
            Update the name for your session to easily identify it later.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="session_name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Session Name <span className="text-text-failed">*</span>
            </label>
            <input
              id="session_name"
              type="text"
              {...register("session_name", {
                required: "Session name is required",
                minLength: {
                  value: 1,
                  message: "Session name must be at least 1 character",
                },
                maxLength: {
                  value: 250,
                  message: "Session name must be less than 250 characters",
                },
              })}
              className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
              placeholder="Enter session name"
              disabled={updateSessionNameMutation.isPending}
              aria-invalid={errors.session_name ? "true" : "false"}
            />
            {errors.session_name && (
              <span className="text-text-failed text-xs mt-1">
                {errors.session_name.message}
              </span>
            )}
          </div>

          {/* Current Info */}
          <div className="text-xs text-secondary space-y-1">
            <p>Run ID: {session?.run_id}</p>
            {session?.github_url && (
              <p className="truncate">Repository: {session.github_url}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-border hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
            onClick={handleClose}
            disabled={updateSessionNameMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md transition-all flex items-center justify-center w-full ${
              !updateSessionNameMutation.isPending
                ? "bg-primary hover:bg-primary-hover"
                : "bg-gray-500 cursor-not-allowed"
            }`}
            disabled={updateSessionNameMutation.isPending}
          >
            {updateSessionNameMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

EditSessionNameModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  session: PropTypes.shape({
    run_id: PropTypes.string,
    session_name: PropTypes.string,
    github_url: PropTypes.string,
  }),
  setSessionName: PropTypes.func,
};
