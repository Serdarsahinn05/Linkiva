"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { actOnReport, unsuspendPage, type ReportAction } from "../actions";
import { StepUp } from "./step-up";

type Kind = ReportAction | "unsuspend";

/**
 * The decisions on a report. Each one says exactly what will happen, asks for a reason (kept in the audit log), and
 * needs the session's step-up; when it is not open, the dialog offers it right there.
 */
export function ModerationActions({
  reportId,
  profileId,
  username,
  open: reportOpen,
  hasBlock,
  suspended,
  stepUpUntil,
}: {
  reportId: string;
  profileId: string;
  username: string;
  open: boolean;
  hasBlock: boolean;
  suspended: boolean;
  stepUpUntil: string | null;
}) {
  const t = useTranslations("admin.actions");
  const router = useRouter();
  const [kind, setKind] = useState<Kind | null>(null);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "stepUp" | "gone" | "error">("idle");

  const choose = (next: Kind) => {
    setKind(next);
    setReason("");
    setState("idle");
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!kind) return;
    setState("pending");
    const result = kind === "unsuspend" ? await unsuspendPage(profileId, reason) : await actOnReport({ reportId, action: kind, reason });
    if (result.ok) {
      setKind(null);
      return router.refresh();
    }
    setState(result.error === "stepUp" ? "stepUp" : result.error === "notFound" ? "gone" : "error");
  }

  const buttons: { kind: Kind; show: boolean; danger: boolean }[] = [
    { kind: "removeBlock", show: reportOpen && hasBlock, danger: true },
    { kind: "removeImages", show: reportOpen, danger: true },
    { kind: "suspend", show: reportOpen && !suspended, danger: true },
    { kind: "unsuspend", show: suspended, danger: false },
  ];
  // Locked per the server's last word; an expired step-up shows up as a "stepUp" refusal and the notice returns.
  const locked = !stepUpUntil;
  const askStepUp = locked || state === "stepUp";

  return (
    <>
      {buttons
        .filter((b) => b.show)
        .map((b) => (
          <Button key={b.kind} variant={b.danger ? "danger" : "secondary"} size="md" onClick={() => choose(b.kind)}>
            {t(`${b.kind}.button`)}
          </Button>
        ))}

      <Dialog open={kind !== null} onClose={() => setKind(null)} title={kind ? t(`${kind}.title`) : ""} closeLabel={t("cancel")}>
        {kind && (
          <form onSubmit={submit} className="flex flex-col gap-4 p-5">
            <p className="text-ink-2">{t(`${kind}.body`, { username })}</p>
            <Field label={t("reason")} hint={t("reasonHint")}>
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  data-autofocus
                  aria-describedby={describedBy}
                  required
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={cn(inputClass, "h-auto resize-y py-3 leading-normal")}
                />
              )}
            </Field>
            {askStepUp && (
              <div className="flex flex-col items-start gap-2">
                <Notice tone="info">{t("needsStepUp")}</Notice>
                <StepUp until={null} />
              </div>
            )}
            {state === "gone" && <Notice tone="error">{t("gone")}</Notice>}
            {state === "error" && <Notice tone="error">{t("error")}</Notice>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={() => setKind(null)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant={kind === "unsuspend" ? "primary" : "danger"}
                size="md"
                pending={state === "pending"}
                pendingLabel={t(`${kind}.confirm`)}
                disabled={reason.trim().length < 3 || locked}
              >
                {t(`${kind}.confirm`)}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
