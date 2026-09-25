import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
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

/** Honest placeholder for a section whose phase has not landed yet. */
export function ComingSoon({ title, body, back }: { title: string; body: string; back: string }) {
  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-6 sm:px-8 lg:py-10">
      <PageHeader title={title} />
      <div className="glass flex flex-col items-center gap-5 rounded-[var(--radius-card)] px-6 py-16 text-center">
        <p className="max-w-[36ch] text-ink-2">{body}</p>
        <Link href="/dashboard" className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}>
          {back}
        </Link>
      </div>
    </div>
  );
}
