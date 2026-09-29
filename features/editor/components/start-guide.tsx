"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { dismissGuide } from "../actions";

export type GuideStep = "link" | "photo" | "theme" | "share";

/** Where the editor lets each step be done (ids set on the editor's own fields). */
export const GUIDE_TARGET = { link: "guide-link", photo: "guide-photo" } as const;

const action = cn(buttonBase, buttonVariants.secondary, buttonSizes.md, "shrink-0 px-4");

/**
 * The editor's "Getting started" card (Faz 18). Every step is ticked from the page itself, never by a click here:
 * a link with an address, a photo, a look other than the default, a first real visitor. No tour, no modal: the card
 * sits above the editor and points at the fields that do the work. Closing it is kept on the account.
 */
export function StartGuide({ done, steps, shareUrl }: { done: Record<GuideStep, boolean>; steps: GuideStep[]; shareUrl: string }) {
  const t = useTranslations("guide");
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const count = steps.filter((s) => done[s]).length;
  const complete = count === steps.length;

  function close() {
    setOpen(false);
    // Closing is a preference: if the save fails the card simply comes back on the next visit.
    void dismissGuide();
  }

  function focusField(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    (el.matches("input, button") ? el : el.querySelector<HTMLElement>("button, input:not(.sr-only)"))?.focus({ preventScroll: true });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // No clipboard (an insecure context or a denied permission): the address is shown in the share panel.
    }
  }

  const stepAction = (step: GuideStep) => {
    if (step === "link")
      return (
        <button type="button" className={action} onClick={() => focusField(GUIDE_TARGET.link)}>
          {t("link.action")}
        </button>
      );
    if (step === "photo")
      return (
        <button type="button" className={action} onClick={() => focusField(GUIDE_TARGET.photo)}>
          {t("photo.action")}
        </button>
      );
    if (step === "theme")
      return (
        <Link href="/dashboard/appearance" className={action}>
          {t("theme.action")}
        </Link>
      );
    return (
      <button type="button" className={action} onClick={copy}>
        {copied ? <Check size={16} strokeWidth={2} className="text-positive" aria-hidden /> : null}
        {copied ? t("share.copied") : t("share.action")}
      </button>
    );
  };

  return (
    <section aria-labelledby="guide-heading" className="glass flex flex-col gap-4 rounded-[var(--radius-card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="guide-heading" className="text-lg font-semibold tracking-[-0.02em]">
            {complete ? t("doneTitle") : t("title")}
          </h2>
          <p className="text-sm text-ink-2">{complete ? t("doneBody") : t("body")}</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="-mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-glass-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={count}
          aria-label={t("progress", { done: count, total: steps.length })}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-strong"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-sheet)]" style={{ width: `${(count / steps.length) * 100}%` }} />
        </div>
        <span className="font-mono text-sm text-ink-2 tabular-nums">
          {count}/{steps.length}
        </span>
      </div>

      <ol className="flex flex-col">
        {steps.map((step) => (
          <li key={step} className="flex min-h-14 items-center gap-3 border-t border-glass-edge py-2 first:border-t-0">
            <span
              aria-hidden
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color] duration-300",
                done[step] ? "border-transparent bg-accent text-accent-ink" : "border-ink-3 bg-transparent",
              )}
            >
              {done[step] && <Check size={14} strokeWidth={2.5} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn("font-medium", done[step] && "text-ink-3")}>
                {t(`${step}.label`)}
                <span className="sr-only">{done[step] ? `, ${t("stepDone")}` : ""}</span>
              </span>
              {!done[step] && step === "share" && <span className="text-sm text-ink-3">{t("share.hint")}</span>}
            </span>
            {!done[step] && stepAction(step)}
          </li>
        ))}
      </ol>
    </section>
  );
}
