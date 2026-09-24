"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { inputClass } from "./field";

type Props = Omit<ComponentPropsWithoutRef<"input">, "type"> & { showLabel: string; hideLabel: string };

export function PasswordInput({ className, showLabel, hideLabel, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={cn(inputClass, "pr-12", className)} {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-2 hover:text-ink"
      >
        {visible ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
      </button>
    </div>
  );
}
