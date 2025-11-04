"use client";
import { TbAlertTriangle } from "react-icons/tb";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function IneligibleUserModal({ isShow = false }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  if (!isShow) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg max-h-full md:max-h-[calc(100vh-3rem)] overflow-auto rounded-xl border border-gray-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <TbAlertTriangle className="flex-shrink-0 w-12 h-12 text-text-failed" />
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Access Not Available
              </h2>
              <p className="text-md text-secondary">
                Your account is not eligible
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-md text-secondary">
              Unfortunately, your account does not have access to Shepherd at
              this time.
            </p>
            <p className="text-md text-secondary">
              If you believe this is an error or would like to request access,
              please contact our support team for assistance.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {/* <a
                href="mailto:support@shepherd.dev"
                className="w-full px-4 py-2 rounded-md bg-primary hover:bg-primary-hover border border-primary hover:border-primary-hover transition-all text-center"
              >
                Contact Support
              </a> */}
            <button
              type="button"
              className="w-full px-4 py-2 rounded-md border border-gray-border hover:bg-white/5 transition-all"
              onClick={() => handleSignOut()}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
