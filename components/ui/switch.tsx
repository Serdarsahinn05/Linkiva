"use client";

import { cn } from "@/lib/cn";

/** A small tape slider: green tape when on, grey when off (DESIGN.md §5). */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex size-11 shrink-0 items-center justify-center disabled:opacity-50"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-[var(--radius-tape)] shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)] transition-colors duration-150",
          checked ? "bg-tape-green" : "bg-tape-grey",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-[1px] bg-emboss shadow-[0_1px_2px_rgb(0_0_0/0.3)] transition-transform duration-150 ease-[var(--ease-out)]",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}
