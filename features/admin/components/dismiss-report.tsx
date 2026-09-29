"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { dismissReport } from "../actions";

/** "Nothing to do here": closes the report and leaves the page alone. An optional note goes to the audit log. */
export function DismissReport({ id }: { id: string }) {
  const t = useTranslations("admin.reports");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "gone" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("pending");
    const result = await dismissReport(id, note);
    if (result.ok) {
      setOpen(false);
      router.push("/admin/reports");
      return router.refresh();
    }
    setState(result.error === "notFound" ? "gone" : "error");
  }

  return (
    <>
      <Button variant="secondary" size="md" onClick={() => setOpen(true)}>
        {t("dismiss")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("dismissTitle")} closeLabel={t("cancel")}>
        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          <p className="text-ink-2">{t("dismissBody")}</p>
          <Field label={t("note")} hint={t("noteHint")}>
            {({ id: fieldId, describedBy }) => (
              <textarea
                id={fieldId}
                data-autofocus
                aria-describedby={describedBy}
                maxLength={500}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={cn(inputClass, "h-auto resize-y py-3 leading-normal")}
              />
            )}
          </Field>
          {state === "gone" && <Notice tone="error">{t("alreadyClosed")}</Notice>}
          {state === "error" && <Notice tone="error">{t("error")}</Notice>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" size="md" pending={state === "pending"} pendingLabel={t("dismiss")}>
              {t("dismissConfirm")}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
