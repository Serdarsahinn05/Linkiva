"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string; icon?: ReactNode };

/** Glass segmented control: the selected option is a lifted glass pill. */
export function Segmented<T extends string>({ label, value, options, onChange, className }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("glass-flat inline-flex max-w-full flex-wrap rounded-full p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-200",
            value === option.value ? "bg-glass-strong text-ink shadow-[inset_0_1px_0_var(--c-glass-shine),0_2px_8px_-4px_rgb(0_0_0/0.3)]" : "text-ink-2 hover:text-ink",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
