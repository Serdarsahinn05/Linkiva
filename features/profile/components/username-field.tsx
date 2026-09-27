"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Field, Input } from "@/components/ui/field";
import { sanitizeUsernameInput, USERNAME_MAX } from "@/lib/validation/username";
import { checkUsername, type UsernameStatus } from "../actions";

/** Debounced availability check while typing. `skip` (the current name) is never checked. */
export function useUsernameCheck(username: string, skip?: string) {
  const [status, setStatus] = useState<UsernameStatus | null>(null);
  const [checking, startChecking] = useTransition();

  useEffect(() => {
    if (!username || username === skip) return;
    const handle = setTimeout(() => startChecking(async () => setStatus(await checkUsername(username))), 350);
    return () => clearTimeout(handle);
  }, [username, skip]);

  const current = status && (status.state === "problem" || status.username === username) ? status : null;
  return { current, checking, available: current?.state === "available" };
}

type Props = {
  host: string;
  username: string;
  onChange: (username: string) => void;
  check: ReturnType<typeof useUsernameCheck>;
  /** The server said "taken" on submit (a race the live check can miss). */
  takenOnSubmit?: boolean;
  suggestion?: string;
  hint?: string;
  name?: string;
};

/** Username input with the host prefix, live availability and a one-tap suggestion. Onboarding and Settings share it. */
export function UsernameField({ host, username, onChange, check, takenOnSubmit, suggestion, hint, name }: Props) {
  const t = useTranslations("onboarding");
  const { current, checking, available } = check;
  const shownSuggestion = current?.state === "taken" ? current.suggestion : suggestion;

  return (
    <>
      <Field
        label={t("usernameLabel")}
        error={
          current?.state === "problem"
            ? t(`problems.${current.problem}`)
            : current?.state === "taken" || takenOnSubmit
              ? t("taken", { username })
              : undefined
        }
        hint={
          checking ? (
            t("checking")
          ) : available ? (
            <span className="inline-flex items-center gap-1.5 text-positive">
              <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
              {t("available", { username })}
            </span>
          ) : (
            hint
          )
        }
      >
        {({ id, describedBy, invalid }) => (
          <div className="flex items-stretch">
            <span lang="en" className="flex items-center rounded-l-[var(--radius-control)] border border-r-0 border-glass-edge bg-glass-strong px-3 text-sm text-ink-3">
              {host}/
            </span>
            <Input
              id={id}
              name={name}
              value={username}
              onChange={(e) => onChange(sanitizeUsernameInput(e.target.value))}
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

      {shownSuggestion && (
        <p className="-mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
          {t("trySuggestion")}
          <button type="button" onClick={() => onChange(shownSuggestion)} className="font-semibold text-ink underline underline-offset-4" lang="en">
            {shownSuggestion}
          </button>
        </p>
      )}
    </>
  );
}
