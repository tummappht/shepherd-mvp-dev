import { useEffect, useCallback } from "react";
import ModalWrapper from "./ModalWrapper";

export default function Modal({ children, isShow = true, onChange }) {
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && onChange) {
        onChange(false);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (!isShow) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isShow, onKeyDown]);

  if (!isShow) return null;

  return (
    <ModalWrapper>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => onChange && onChange(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-lg max-h-full md:max-h-[calc(100vh-3rem)] overflow-auto rounded-xl border border-gray-border bg-surface p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalWrapper>
  );
}
