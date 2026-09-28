import { cn } from "@/lib/cn";

/** A placeholder shape inside a streamed section (globals.css .skeleton: appears after 200 ms, breathes slowly). */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton block", className)} />;
}
