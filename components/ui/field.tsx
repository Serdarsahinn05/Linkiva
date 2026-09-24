import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "h-12 w-full rounded-[var(--radius-control)] border border-glass-edge bg-glass px-4 text-base text-ink shadow-[inset_0_1px_0_var(--c-glass-shine)] placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150 hover:border-ink-3/50 focus-visible:border-ink focus-visible:shadow-[0_0_0_4px_var(--c-focus)] focus-visible:outline-none aria-invalid:border-negative";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  /** Renders the control; receives the ids needed to wire label, hint and error. */
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

/** Label + control + hint/error, wired for screen readers. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="text-sm text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(inputClass, className)} {...rest} />;
}
