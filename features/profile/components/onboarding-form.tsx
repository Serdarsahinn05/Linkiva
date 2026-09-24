"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { sanitizeUsernameInput, USERNAME_MAX } from "@/lib/validation/username";
import { checkUsername, createProfile, type UsernameStatus } from "../actions";

export function OnboardingForm({ initialUsername, host }: { initialUsername: string; host: string }) {
  const t = useTranslations();
  const [username, setUsername] = useState(initialUsername);
  const [status, setStatus] = useState<UsernameStatus | null>(null);
  const [checking, startChecking] = useTransition();
  const [result, formAction, submitting] = useActionState(createProfile, null);

  // Debounced availability check while typing.
  useEffect(() => {
    if (!username) return;
    const handle = setTimeout(() => startChecking(async () => setStatus(await checkUsername(username))), 350);
    return () => clearTimeout(handle);
  }, [username]);

  const current = status && (status.state === "problem" || status.username === username) ? status : null;
  const available = current?.state === "available";
  const suggestion = current?.state === "taken" ? current.suggestion : result?.suggestion;

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

      <Field
        label={t("onboarding.usernameLabel")}
        error={
          current?.state === "problem"
            ? t(`onboarding.problems.${current.problem}`)
            : current?.state === "taken" || result?.error === "taken"
              ? t("onboarding.taken", { username })
              : undefined
        }
        hint={
          checking ? (
            t("onboarding.checking")
          ) : available ? (
            <span className="inline-flex items-center gap-1.5 text-positive">
              <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
              {t("onboarding.available", { username })}
            </span>
          ) : undefined
        }
      >
        {({ id, describedBy, invalid }) => (
          <div className="flex items-stretch">
            <span lang="en" className="flex items-center rounded-l-[var(--radius-control)] border border-r-0 border-glass-edge bg-glass-strong px-3 text-sm text-ink-3">
              {host}/
            </span>
            <Input
              id={id}
              name="username"
              value={username}
              onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
              maxLength={USERNAME_MAX}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="rounded-l-none"
            />
          </div>
        )}
      </Field>

      {suggestion && (
        <p className="-mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
          {t("onboarding.trySuggestion")}
          <button type="button" onClick={() => setUsername(suggestion)} className="font-semibold text-ink underline underline-offset-4" lang="en">
            {suggestion}
          </button>
        </p>
      )}

      <Field label={t("onboarding.displayNameLabel")} hint={t("onboarding.displayNameHint")}>
        {({ id, describedBy }) => <Input id={id} name="displayName" maxLength={60} autoComplete="name" aria-describedby={describedBy} />}
      </Field>

      <Button type="submit" block pending={submitting} pendingLabel={t("onboarding.pending")} disabled={!available || checking}>
        {t("onboarding.submit")}
      </Button>
    </form>
  );
}
