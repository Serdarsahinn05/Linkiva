import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  /** Shows the pending label and blocks repeat submits. */
  pending?: boolean;
  pendingLabel?: string;
  block?: boolean;
  size?: "md" | "lg";
};

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,transform,box-shadow,opacity] duration-150 ease-[var(--ease-out)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:opacity-80";

export const buttonVariants: Record<Variant, string> = {
  // Monochrome primary: white pill on dark, ink pill on light. One per screen (DESIGN.md §6).
  primary: "bg-accent text-accent-ink shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_24px_-10px_rgb(0_0_0/0.5)] hover:opacity-90",
  secondary: "glass text-ink hover:bg-glass-strong",
  ghost: "text-ink hover:bg-glass",
  danger: "border border-negative/50 text-negative hover:bg-negative/10",
};

export const buttonSizes = { md: "h-11 px-5 text-[0.9375rem]", lg: "h-12 px-6 text-base" } as const;

export function Button({ variant = "primary", size = "lg", pending, pendingLabel, block, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], block && "w-full", className)}
      {...rest}
    >
      {pending ? (
        <>
          <span className="dots" aria-hidden />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
