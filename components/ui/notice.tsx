import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "error";

const icons = { info: Info, success: CircleCheck, error: CircleAlert } as const;
// Semantic colour is the only colour in the UI (DESIGN.md §3).
const colors: Record<Tone, string> = { info: "text-info", success: "text-positive", error: "text-negative" };

/** Inline message on glass. Errors are announced assertively, everything else politely. */
export function Notice({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const Icon = icons[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("glass-flat flex items-start gap-3 rounded-[var(--radius-control)] p-3.5 text-sm text-ink", className)}>
      <Icon size={18} strokeWidth={1.75} className={cn("mt-px shrink-0", colors[tone])} aria-hidden />
      <div>{children}</div>
    </div>
  );
}
