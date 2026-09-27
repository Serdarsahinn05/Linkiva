import { ViewTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Wraps a dashboard page so it comes into focus when it replaces the skeleton or the previous page.
 * View Transitions only; browsers without them simply show the page.
 */
export function PageReveal({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] lg:text-[2.5rem]">{title}</h1>
      {children}
    </div>
  );
}

export function Section({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass flex flex-col gap-4 rounded-[var(--radius-card)] p-5", className)}>
      {title && <h2 className="text-[0.9375rem] font-semibold text-ink-2">{title}</h2>}
      {children}
    </section>
  );
}
