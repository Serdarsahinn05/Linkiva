"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { createProfile } from "../actions";
import { UsernameField, useUsernameCheck } from "./username-field";

export function OnboardingForm({ initialUsername, host }: { initialUsername: string; host: string }) {
  const t = useTranslations();
  const [username, setUsername] = useState(initialUsername);
  const check = useUsernameCheck(username);
  const { available, checking } = check;
  const [result, formAction, submitting] = useActionState(createProfile, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("onboarding.title")}</h1>
        <p className="text-ink-2">{t("onboarding.lede")}</p>
      </div>

      {/* Live address preview: a glass chip whose dot lights up when the name is free. */}
      <div aria-hidden className="glass-flat flex h-12 min-w-0 items-center gap-2.5 rounded-full px-4">
        <span className={cn("size-2 shrink-0 rounded-full transition-colors", available ? "neon bg-positive text-positive" : "bg-ink-3")} />
        <span lang="en" translate="no" className="truncate text-[0.9375rem]">
          <span className="text-ink-3">{host}/</span>
          <span className="font-medium">{username || "…"}</span>
        </span>
      </div>

      {result && !result.ok && result.error !== "taken" && (
        <Notice tone="error">{result.error === "invalid" ? t("onboarding.problems.invalid") : t("common.genericError")}</Notice>
      )}

      <UsernameField
        host={host}
        name="username"
        username={username}
        onChange={setUsername}
        check={check}
        takenOnSubmit={result?.error === "taken"}
        suggestion={result?.suggestion}
      />

      <Field label={t("onboarding.displayNameLabel")} hint={t("onboarding.displayNameHint")}>
        {({ id, describedBy }) => <Input id={id} name="displayName" maxLength={60} autoComplete="name" aria-describedby={describedBy} />}
      </Field>

      <Button type="submit" block pending={submitting} pendingLabel={t("onboarding.pending")} disabled={!available || checking}>
        {t("onboarding.submit")}
      </Button>
    </form>
  );
}
