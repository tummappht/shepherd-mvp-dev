import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Modal from "../modal/Modal";
import FileDropZone from "../FileDropZone";
import { serviceReportIssue } from "@/services/report";
import PropTypes from "prop-types";

export default function ReportBugModal({ isOpen, onClose }) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      description: "",
      images: null,
    },
  });

  const reportIssueMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await serviceReportIssue(formData);
      if (!response.success) {
        throw new Error(`API error: ${response.status}`);
      }
      return response;
    },
    onSuccess: () => {
      reset();
      onClose();
    },
    onError: (error) => {
      alert("Failed to submit bug report. Please try again later.");
      console.error("Error submitting bug report:", error);
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append("text", data.description);

    // Append multiple images
    if (data.images && data.images.length > 0) {
      Array.from(data.images).forEach((file) => {
        formData.append("images", file);
      });
    }

    reportIssueMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!reportIssueMutation.isPending) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isShow={isOpen} onChange={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Report a Bug
          </h2>
          <p className="text-sm text-secondary">
            Help us improve Shepherd by reporting any issues you encounter.
          </p>
        </div>

        <div className="space-y-4">
          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Bug Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              className="w-full py-2 px-3 h-32 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none resize-none"
              placeholder="Please describe the bug, including what you expected to happen and what actually happened..."
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters",
                },
              })}
              aria-invalid={errors.description ? "true" : "false"}
              disabled={reportIssueMutation.isPending}
            />
            {errors.description && (
              <span className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Screenshot Upload Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Screenshots (Optional)
            </label>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <FileDropZone
                  size="small"
                  acceptedFileTypes="image/*,.png,.jpg,.jpeg,.gif,.webp"
                  maxFileSize={5 * 1024 * 1024} // 5MB per file
                  maxFiles={10}
                  multiple
                  disabled={reportIssueMutation.isPending}
                  {...field}
                />
              )}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-border hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
            onClick={handleClose}
            disabled={reportIssueMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md transition-all flex items-center justify-center w-full ${
              !reportIssueMutation.isPending
                ? "bg-primary hover:bg-primary-hover"
                : "bg-gray-500 cursor-not-allowed"
            }`}
            disabled={reportIssueMutation.isPending}
          >
            {reportIssueMutation.isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

ReportBugModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
