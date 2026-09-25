import { ViewTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const SHAPE = { pill: "rounded-full", control: "rounded-[var(--radius-control)]", card: "rounded-[var(--radius-card)]" } as const;

/**
 * A placeholder shape; size it with className (h-*, w-*, size-*). One light sweeps across every bone
 * on the page together (.bone in globals.css).
 */
export function Bone({ className, shape = "pill" }: { className: string; shape?: keyof typeof SHAPE }) {
  return <span aria-hidden className={cn("bone block", SHAPE[shape], className)} />;
}

/**
 * Loading screen for a route (used by loading.tsx). Fades in only after a short delay so fast
 * navigations never flash it, and steps aside quickly when the page arrives (see PageReveal).
 */
export function Skeleton({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <ViewTransition exit="skeleton-out" default="none">
      <div aria-busy="true" className={cn("skeleton-in", className)}>
        <span role="status" className="sr-only">
          {label}
        </span>
        {children}
      </div>
    </ViewTransition>
  );
}

/** Skeleton of a Section card: a heading line and its content. */
export function SectionBone({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn("glass flex flex-col gap-4 rounded-[var(--radius-card)] p-5", className)}>
      <Bone className="h-3.5 w-28" />
      {children}
    </div>
  );
}

/** A labelled input. */
export function FieldBone({ tall }: { tall?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Bone className="h-3 w-20" />
      <Bone className={cn("w-full", tall ? "h-20" : "h-12")} shape="control" />
    </div>
  );
}

/** The desktop live-preview phone, with a profile taking shape inside. */
export function PhoneBone() {
  return (
    <div aria-hidden className="hidden lg:block">
      <div className="sticky top-6">
        <div className="glass rounded-[44px] p-2.5">
          <div className="flex h-[760px] flex-col items-center gap-3 rounded-[36px] px-6 pt-16">
            <Bone className="size-24" />
            <Bone className="mt-2 h-5 w-36" />
            <Bone className="h-3.5 w-52" />
            <div className="mt-6 flex w-full flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} className="h-14 w-full" shape="card" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
