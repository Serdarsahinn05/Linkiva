"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Wordmark } from "@/components/ui/surface";
import { restoreDeletedAccount } from "../actions";
import { LogoutButton } from "./logout-button";

/** Shown instead of the dashboard while the account waits to be deleted: bring it back, or leave. */
export function RestoreAccount({ purgeAt }: { purgeAt: string }) {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "error">("idle");

  async function restore() {
    setState("pending");
    const { ok } = await restoreDeletedAccount();
    if (!ok) return setState("error");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 sm:px-8">
      <header className="py-2">
        <Link href="/" className="inline-block">
          <Wordmark />
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="glass flex w-full max-w-[28rem] flex-col gap-5 rounded-[28px] p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-balance">{t("account.restoreTitle")}</h1>
          <p className="text-ink-2">{t("account.restoreBody", { date: format.dateTime(new Date(purgeAt), { dateStyle: "long" }) })}</p>
          {state === "error" && <Notice tone="error">{t("common.genericError")}</Notice>}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={restore} pending={state === "pending"} pendingLabel={t("account.restoring")}>
              <RotateCcw size={18} aria-hidden />
              {t("account.restore")}
            </Button>
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
