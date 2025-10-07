import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Modal from "./modal/Modal";
import FileDropZone from "./FileDropZone";
import { FaSyncAlt } from "react-icons/fa";

export default function ReportBugModal({ isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      description: "",
      screenshots: null,
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("description", data.description);

      // Append multiple screenshots
      if (data.screenshots && data.screenshots.length > 0) {
        Array.from(data.screenshots).forEach((file, index) => {
          formData.append(`screenshot_${index}`, file);
        });
      }

      // TODO: Replace with your actual API endpoint
      // const response = await fetch('/api/report-bug', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("Bug report submitted successfully!");
      reset();
      onClose();
    } catch (error) {
      console.error("Error submitting bug report:", error);
      alert("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
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
                  message: "Please provide at least 10 characters",
                },
              })}
              aria-invalid={errors.description ? "true" : "false"}
              disabled={isSubmitting}
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
              name="screenshots"
              render={({ field }) => (
                <FileDropZone
                  size="small"
                  acceptedFileTypes="image/*,.png,.jpg,.jpeg,.gif,.webp"
                  maxFileSize={5 * 1024 * 1024} // 5MB per file
                  maxFiles={10}
                  multiple
                  disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md transition-all flex items-center justify-center w-full ${
              !isSubmitting
                ? "bg-primary hover:bg-primary-hover"
                : "bg-gray-500 cursor-not-allowed"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <FaSyncAlt className="animate-spin text-base" />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
