"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

/** Submit button of the language switch form: busy while the other language loads. */
export function SwitchButton({ className, title, children }: { className: string; title?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" title={title} aria-busy={pending || undefined} disabled={pending} className={cn(className, pending && "opacity-60")}>
      {children}
    </button>
  );
}
