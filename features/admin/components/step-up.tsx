"use client";

import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { confirmStepUp } from "../actions";

/**
 * The step-up state of this session: locked (sensitive actions ask for the current two-step code) or open until a
 * time. Opening it is always an explicit act; nothing unlocks on its own.
 */
export function StepUp({ until, className }: { until: string | null; className?: string }) {
  const t = useTranslations("admin.stepUp");
  const format = useFormatter();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "invalid" | "tooMany" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("pending");
    const result = await confirmStepUp(code);
    if (result.ok) {
      setOpen(false);
      setCode("");
      setState("idle");
      return router.refresh();
    }
    setState(result.error === "invalid" || result.error === "tooMany" ? result.error : "error");
  }

  const error = state === "invalid" ? t("invalid") : state === "tooMany" ? t("tooMany") : state === "error" ? t("error") : undefined;

  return (
    <>
      {until ? (
        <p className={cn("flex items-center gap-2 text-sm text-ink-2", className)}>
          <LockKeyholeOpen size={16} strokeWidth={1.75} className="text-positive" aria-hidden />
          {t("openUntil", { time: format.dateTime(new Date(until), { timeStyle: "short" }) })}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "glass-flat flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            className,
          )}
        >
          <LockKeyhole size={16} strokeWidth={1.75} aria-hidden />
          {t("unlock")}
        </button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={t("title")} closeLabel={t("cancel")}>
        <form onSubmit={submit} className="flex flex-col gap-4 p-5" noValidate>
          <p className="text-ink-2">{t("body")}</p>
          <Field label={t("code")} error={error}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                data-autofocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (state !== "pending") setState("idle");
                }}
                className="font-mono text-lg tracking-[0.3em]"
              />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" size="md" pending={state === "pending"} pendingLabel={t("confirm")} disabled={code.replace(/\s/g, "").length !== 6}>
              {t("confirm")}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
