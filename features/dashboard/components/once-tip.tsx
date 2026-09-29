"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

// One-time hints (Faz 18): remembered per browser, which is all a hint needs. Storage can be missing or throw (a
// private window, blocked site data); then the hint is simply not shown rather than shown on every visit.
export type TipKey = "preview" | "palette";

const storageKey = (key: TipKey) => `linkiva:tip:${key}`;
const CHANGE = "linkiva:tip";

function seen(key: TipKey): boolean {
  try {
    return localStorage.getItem(storageKey(key)) === "1";
  } catch {
    return true;
  }
}

export function markTipSeen(key: TipKey) {
  try {
    if (localStorage.getItem(storageKey(key)) === "1") return;
    localStorage.setItem(storageKey(key), "1");
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE));
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
};

/** Hidden on the server and until the browser says the hint is new, so nothing flashes. */
export function useTipVisible(key: TipKey) {
  return !useSyncExternalStore(subscribe, () => seen(key), () => true);
}

/** A small glass note with a way to put it away. `stacked` puts the button under the words (a narrow column). */
export function OnceTip({ tip, children, stacked, className }: { tip: TipKey; children: ReactNode; stacked?: boolean; className?: string }) {
  const t = useTranslations("tips");
  if (!useTipVisible(tip)) return null;
  return (
    <div
      role="note"
      className={cn(
        "toast-in glass-float flex rounded-[var(--radius-control)] text-sm",
        stacked ? "flex-col items-start gap-1 px-3.5 pt-3 pb-1.5" : "items-center gap-3 py-2 pr-2 pl-3.5",
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-ink">{children}</span>
      <button
        type="button"
        onClick={() => markTipSeen(tip)}
        className={cn(
          "h-9 shrink-0 rounded-full px-3 font-medium text-ink-2 transition-colors hover:bg-glass-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          stacked && "-ml-3",
        )}
      >
        {t("dismiss")}
      </button>
    </div>
  );
}
