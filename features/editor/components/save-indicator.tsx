"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { SaveState } from "./use-autosave";

/** "Saving / Saved / Could not save" pill; the saved dot uses the semantic positive colour. */
export function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations("editor");
  if (state === "idle") return null;
  return (
    <p role="status" className={cn("glass-flat flex h-9 items-center gap-2 rounded-full px-3.5 text-sm", state === "error" ? "text-negative" : "text-ink-2")}>
      {state === "saving" && <span className="dots" aria-hidden />}
      {state === "saved" && <span className="neon size-1.5 rounded-full bg-positive text-positive" aria-hidden />}
      {state === "error" && <CircleAlert size={16} strokeWidth={1.75} aria-hidden />}
      {state === "saving" ? t("saving") : state === "saved" ? t("saved") : t("saveError")}
    </p>
  );
}
