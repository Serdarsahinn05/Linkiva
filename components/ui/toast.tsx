"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Toast = { id: number; message: string; tone: "success" | "error"; action?: { label: string; onClick: () => void }; duration: number };
type ToastInput = Omit<Toast, "id" | "duration"> & { duration?: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);

/**
 * Glass pill above the mobile tab bar (DESIGN.md §6); the dot carries the semantic colour.
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
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-6">
        {toast && (
          <div key={toast.id} className="glass-float toast-in pointer-events-auto flex min-h-12 max-w-full items-center gap-3 rounded-full py-1.5 pr-1.5 pl-4 text-[0.9375rem]">
            <span aria-hidden className={cn("neon size-2 shrink-0 rounded-full", toast.tone === "success" ? "bg-positive text-positive" : "bg-negative text-negative")} />
            <span className={cn(!toast.action && "pr-3")}>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className="h-9 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90"
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
