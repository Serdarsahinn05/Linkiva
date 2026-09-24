"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Toast = { id: number; message: string; tone: "success" | "error"; action?: { label: string; onClick: () => void }; duration: number };
type ToastInput = Omit<Toast, "id" | "duration"> & { duration?: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);

/**
 * Toasts slide out of the bottom edge like a strip leaving the label maker (DESIGN.md §5).
 * One at a time; a new toast replaces the current one.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const counter = useRef(0);

  const show = useCallback((input: ToastInput) => {
    counter.current += 1;
    setToast({ duration: 6000, ...input, id: counter.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast((t) => (t?.id === toast.id ? null : t)), toast.duration);
    return () => clearTimeout(handle);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6">
        {toast && (
          <div
            key={toast.id}
            data-tone={toast.tone === "success" ? "green" : "red"}
            className="tape toast-in pointer-events-auto min-h-12 max-w-full gap-4 pr-6 text-[0.9375rem] font-medium [text-shadow:none]"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className={cn("tape-type min-h-9 rounded-[var(--radius-tape)] bg-black/25 px-3 text-xs hover:bg-black/35")}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
