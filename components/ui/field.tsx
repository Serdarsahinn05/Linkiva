import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "min-h-11 w-full rounded-[var(--radius-panel)] border border-hairline bg-panel px-3 text-base text-ink placeholder:text-ink-3 transition-colors duration-150 hover:border-ink-3 focus-visible:border-ink aria-invalid:border-danger";

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
        <p id={errorId} className="text-sm text-danger">
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
