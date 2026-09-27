"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useToast } from "@/components/ui/toast";
import { USERNAME_REDIRECT_DAYS } from "@/lib/validation/username";
import { changeUsername, type ChangeUsernameResult } from "../actions";
import { UsernameField, useUsernameCheck } from "./username-field";

/** Settings → Profile: move the page to a new address; the old one keeps redirecting for 90 days. */
export function UsernameForm({ current: initial, host }: { current: string; host: string }) {
  const t = useTranslations("username");
  const tc = useTranslations("common");
  const toast = useToast();
  const [current, setCurrent] = useState(initial);
  const [username, setUsername] = useState(initial);
  const [result, setResult] = useState<ChangeUsernameResult | null>(null);
  const [saving, startSaving] = useTransition();
  const check = useUsernameCheck(username, current);
  const changed = username !== current;

  function change(next: string) {
    setUsername(next);
    setResult(null);
  }

  function save() {
    startSaving(async () => {
      const res = await changeUsername(username);
      setResult(res);
      if (res.ok) {
        setCurrent(res.username);
        toast({ tone: "success", message: t("changed", { address: `${host}/${res.username}` }) });
      }
    });
  }

  const error = result && !result.ok && result.error !== "taken" ? result.error : null;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed && check.available) save();
      }}
    >
      <UsernameField
        host={host}
        username={username}
        onChange={change}
        check={check}
        takenOnSubmit={result?.ok === false && result.error === "taken"}
        suggestion={result?.ok === false ? result.suggestion : undefined}
      />
      {error && <Notice tone="error">{error === "limit" ? t("limit") : error === "invalid" ? t("invalid") : tc("genericError")}</Notice>}
      {changed && (
        <div className="flex flex-wrap justify-end gap-3">
          {/* The consequence stays in view right next to the confirm button. */}
          <p className="basis-full text-sm text-ink-2">{t("hint", { days: USERNAME_REDIRECT_DAYS })}</p>
          <Button variant="ghost" size="md" onClick={() => change(current)} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="secondary" size="md" pending={saving} pendingLabel={t("saving")} disabled={!check.available || check.checking}>
            {t("save")}
          </Button>
        </div>
      )}
    </form>
  );
}
