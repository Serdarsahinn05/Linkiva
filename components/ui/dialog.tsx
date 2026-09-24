"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  /** "sheet" docks to the bottom on small screens (used for the mobile preview). */
  variant?: "center" | "sheet";
  className?: string;
};

/**
 * Native <dialog>: showModal() gives focus trapping, Esc and inert background for free.
 * Only for tasks that need protected focus (DESIGN.md §5).
 */
export function Dialog({ open, onClose, title, closeLabel, children, variant = "center", className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md rounded-[var(--radius-panel)] border border-hairline bg-panel p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-ink/40",
        variant === "sheet" && "max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label={closeLabel} className="-mr-2 flex size-11 items-center justify-center rounded-[var(--radius-panel)] hover:bg-ground">
          <X size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {/* Content mounts only while open: a closed dialog stays out of the DOM and accessibility tree. */}
      {open && children}
    </dialog>
  );
}
