"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { unsubscribeWithToken } from "../actions";

/** One button: the GET that opened this page changed nothing (mail scanners follow links). */
export function UnsubscribeForm({ token }: { token: string }) {
  const t = useTranslations("unsubscribe");
  const [state, setState] = useState<"idle" | "done" | "invalid" | "error">("idle");
  const [pending, startTransition] = useTransition();

  if (state === "done" || state === "invalid") {
    return (
      <div className="flex flex-col gap-3" role="status">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t(state === "done" ? "done" : "invalid")}</h1>
        <p className="text-ink-2">{t(state === "done" ? "doneBody" : "invalidBody")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("title")}</h1>
      <p className="text-ink-2">{t("body")}</p>
      {state === "error" && (
        <p role="alert" className="text-sm text-negative">
          {t("error")}
        </p>
      )}
      <Button
        block
        pending={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await unsubscribeWithToken(token);
            setState(result.ok ? "done" : result.error === "invalid" ? "invalid" : "error");
          })
        }
      >
        {t("confirm")}
      </Button>
    </div>
  );
}
