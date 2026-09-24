import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  /** Shows the pending label and blocks repeat submits, keeping the button's width stable. */
  pending?: boolean;
  pendingLabel?: string;
  block?: boolean;
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 px-4 text-[0.9375rem] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<Variant, string> = {
  // Primary is a red tape strip: one per screen (DESIGN.md §2).
  primary: "tape tape-type min-h-11 px-5",
  secondary: "rounded-[var(--radius-panel)] border border-ink bg-transparent text-ink hover:bg-panel",
  ghost: "rounded-[var(--radius-panel)] text-ink hover:bg-panel",
  // Destructive actions are an outline with a plain verb, never a filled red block.
  danger: "rounded-[var(--radius-panel)] border border-danger bg-transparent text-danger hover:bg-danger/8",
};

export function Button({ variant = "primary", pending, pendingLabel, block, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      data-tone={variant === "primary" ? "red" : undefined}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      className={cn(base, variants[variant], block && "w-full", className)}
      {...rest}
    >
      {pending ? (
        <>
          <span className="print-dots" aria-hidden />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
