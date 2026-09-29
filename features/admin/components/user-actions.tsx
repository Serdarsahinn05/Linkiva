"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, inputClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { eraseAccountNow, setRole } from "../actions";
import { StepUp } from "./step-up";

type Role = "USER" | "MODERATOR" | "ADMIN";

/** Role change and immediate erasure for one account (admins only). Both need step-up and a reason. */
export function UserActions({ userId, name, role, stepUpUntil, canErase }: { userId: string; name: string; role: Role; stepUpUntil: string | null; canErase: boolean }) {
  const t = useTranslations("admin.users");
  const tr = useTranslations("admin.roles");
  const router = useRouter();
  const [dialog, setDialog] = useState<"role" | "erase" | null>(null);
  const [nextRole, setNextRole] = useState<Role>(role);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fromOwner, setFromOwner] = useState(false);
  const [state, setState] = useState<"idle" | "pending" | "stepUp" | "lastAdmin" | "confirm" | "protected" | "error">("idle");

  const open = (which: "role" | "erase") => {
    setDialog(which);
    setReason("");
    setConfirm("");
    setFromOwner(false);
    setNextRole(role);
    setState("idle");
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("pending");
    const result = dialog === "role" ? await setRole(userId, nextRole, reason) : await eraseAccountNow(userId, confirm, reason);
    if (result.ok) {
      setDialog(null);
      if (dialog === "erase") return router.push("/admin/users");
      return router.refresh();
    }
    const e = result.error;
    setState(e === "stepUp" || e === "lastAdmin" || e === "confirm" || e === "protected" ? e : "error");
  }

  const locked = !stepUpUntil;
  const ready = reason.trim().length >= 3 && !locked && (dialog === "role" ? nextRole !== role : fromOwner && confirm.trim().toLowerCase() === name.toLowerCase());

  return (
    <>
      <Button variant="secondary" size="md" onClick={() => open("role")}>
        {t("changeRole")}
      </Button>
      {canErase && (
        <Button variant="danger" size="md" onClick={() => open("erase")}>
          {t("erase")}
        </Button>
      )}

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} title={dialog === "erase" ? t("eraseTitle") : t("roleTitle")} closeLabel={t("cancel")}>
        {dialog && (
          <form onSubmit={submit} className="flex flex-col gap-4 p-5">
            {dialog === "role" ? (
              <>
                <p className="text-ink-2">{t("roleBody")}</p>
                <Segmented label={t("changeRole")} value={nextRole} onChange={setNextRole} options={(["USER", "MODERATOR", "ADMIN"] as const).map((value) => ({ value, label: value === "USER" ? t("userRole") : tr(value) }))} className="w-full" />
              </>
            ) : (
              <>
                <p className="text-ink-2">{t("eraseBody", { name })}</p>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={fromOwner} onChange={(e) => setFromOwner(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-ink" />
                  {t("fromOwner")}
                </label>
                <Field label={t("confirmLabel", { name })}>
                  {({ id }) => <Input id={id} value={confirm} autoCapitalize="none" autoComplete="off" spellCheck={false} onChange={(e) => setConfirm(e.target.value)} />}
                </Field>
              </>
            )}
            <Field label={t("reason")} hint={t("reasonHint")}>
              {({ id, describedBy }) => (
                <textarea id={id} aria-describedby={describedBy} required minLength={3} maxLength={500} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={cn(inputClass, "h-auto resize-y py-3 leading-normal")} />
              )}
            </Field>
            {(locked || state === "stepUp") && (
              <div className="flex flex-col items-start gap-2">
                <Notice tone="info">{t("needsStepUp")}</Notice>
                <StepUp until={null} />
              </div>
            )}
            {state === "lastAdmin" && <Notice tone="error">{t("lastAdmin")}</Notice>}
            {state === "protected" && <Notice tone="error">{t("protected")}</Notice>}
            {state === "confirm" && <Notice tone="error">{t("confirmMismatch")}</Notice>}
            {state === "error" && <Notice tone="error">{t("error")}</Notice>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={() => setDialog(null)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant={dialog === "erase" ? "danger" : "primary"} size="md" pending={state === "pending"} pendingLabel={t("save")} disabled={!ready}>
                {dialog === "erase" ? t("eraseConfirm") : t("save")}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
