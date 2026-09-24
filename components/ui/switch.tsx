"use client";

import { cn } from "@/lib/cn";

/** iOS-style switch. "On" is a meaningful state (live on the page), so it uses the positive colour. */
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
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
    >
      <span
        className={cn(
          "relative h-6 w-10 rounded-full border transition-colors duration-200 ease-[var(--ease-out)]",
          checked ? "border-positive/40 bg-positive" : "border-glass-edge bg-glass-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.3)] transition-transform duration-300 ease-[var(--ease-spring)]",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}
