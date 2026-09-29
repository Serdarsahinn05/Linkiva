"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input, inputClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { REPORT_REASONS } from "../reasons";
import { submitReport, type ReportState } from "../actions";

/** The report form. A real form with a server action, so it also works before or without JavaScript. */
export function ReportForm({ username, blockId, pageUrl }: { username: string; blockId?: string; pageUrl: string }) {
  const t = useTranslations("report");
  const [state, action, pending] = useActionState<ReportState, FormData>(submitReport, { status: "idle" });

  if (state.status === "done") {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <CircleCheck size={28} strokeWidth={1.75} className="text-positive" aria-hidden />
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("doneTitle")}</h2>
        <p className="text-ink-2">{t("doneBody")}</p>
        {/* A full address (possibly a custom domain), not a route of this site. */}
        <a href={pageUrl} className="text-sm font-medium underline underline-offset-4">
          {t("backToPage")}
        </a>
      </div>
    );
  }

  const error = state.status === "invalid" ? t("invalid") : state.status === "tooMany" ? t("tooMany") : state.status === "error" ? t("error") : null;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="username" value={username} />
      {blockId && <input type="hidden" name="blockId" value={blockId} />}
      {/* Honeypot: hidden from people and assistive tech, filled by naive bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("reason")}</legend>
        {REPORT_REASONS.map((reason) => (
          <label
            key={reason}
            className="glass-flat flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-4 py-2.5 transition-colors has-[:checked]:bg-glass-strong has-[:checked]:ring-1 has-[:checked]:ring-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
          >
            <input type="radio" name="reason" value={reason} required className="size-4 shrink-0 accent-ink" />
            <span className="flex flex-col">
              <span className="font-medium">{t(`reasons.${reason}.label`)}</span>
              <span className="text-sm text-ink-2">{t(`reasons.${reason}.hint`)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Field label={t("details")} hint={t("detailsHint")}>
        {({ id, describedBy }) => (
          <textarea id={id} name="details" aria-describedby={describedBy} maxLength={1000} rows={4} className={cn(inputClass, "h-auto resize-y py-3 leading-normal")} />
        )}
      </Field>

      <Field label={t("email")} hint={t("emailHint")}>
        {({ id, describedBy }) => <Input id={id} name="email" type="email" autoComplete="email" inputMode="email" aria-describedby={describedBy} />}
      </Field>

      {error && <Notice tone="error">{error}</Notice>}

      <Button type="submit" pending={pending} pendingLabel={t("submit")} className="self-start">
        {t("submit")}
      </Button>
    </form>
  );
}
