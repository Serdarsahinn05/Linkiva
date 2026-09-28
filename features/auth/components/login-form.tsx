"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { GoogleButton, OrDivider } from "./google-button";

type Status = "idle" | "invalid" | "unverified" | "tooMany" | "error" | "badCode" | "expired";

export function LoginForm({ googleEnabled, notice }: { googleEnabled: boolean; notice?: "passwordReset" }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  // Second step: the password was right and the account asks for a code (two-step verification).
  const [step, setStep] = useState<"password" | "code">("password");
  const [useBackup, setUseBackup] = useState(false);

  function enterDashboard() {
    router.replace("/dashboard");
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setStatus("idle");

    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      callbackURL: "/dashboard",
    });

    if (!error) {
      if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        setPending(false);
        return setStep("code");
      }
      return enterDashboard();
    }
    setPending(false);
    // One message for wrong email *and* wrong password: never reveal which accounts exist.
    if (error.status === 429) setStatus("tooMany");
    else if (error.code === "EMAIL_NOT_VERIFIED") setStatus("unverified");
    else if (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD") setStatus("invalid");
    else setStatus("error");
  }

  async function onCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "").replace(/\s/g, "");
    const trustDevice = form.get("trust") === "on";
    setPending(true);
    setStatus("idle");
    const { error } = useBackup ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice }) : await authClient.twoFactor.verifyTotp({ code, trustDevice });
    if (!error) return enterDashboard();
    setPending(false);
    if (error.code === "INVALID_TWO_FACTOR_COOKIE") {
      // The ten minutes to enter the code ran out: start again from the password.
      setStep("password");
      setStatus("expired");
    } else if (error.status === 429 || error.code === "ACCOUNT_TEMPORARILY_LOCKED" || error.code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE") setStatus("tooMany");
    else if (error.code === "INVALID_CODE" || error.code === "INVALID_BACKUP_CODE" || error.status === 401) setStatus("badCode");
    else setStatus("error");
  }

  const messages: Record<Exclude<Status, "idle">, string> = {
    invalid: t("auth.login.invalid"),
    unverified: t("auth.login.unverified"),
    tooMany: t("auth.login.tooMany"),
    error: t("common.genericError"),
    badCode: t("auth.twoFactor.badCode"),
    expired: t("auth.twoFactor.expired"),
  };
  const statusNotice = status !== "idle" && <Notice tone={status === "unverified" || status === "expired" ? "info" : "error"}>{messages[status]}</Notice>;

  if (step === "code") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("auth.twoFactor.title")}</h1>
          <p className="text-ink-2">{useBackup ? t("auth.twoFactor.backupHint") : t("auth.twoFactor.hint")}</p>
        </div>
        {statusNotice}
        {/* key: switching between app code and backup code starts with an empty field. */}
        <form key={useBackup ? "backup" : "totp"} onSubmit={onCode} className="flex flex-col gap-4">
          <Field label={useBackup ? t("auth.twoFactor.backupCode") : t("auth.twoFactor.code")}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                name="code"
                required
                autoFocus
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck={false}
                inputMode={useBackup ? "text" : "numeric"}
                pattern={useBackup ? undefined : "[0-9 ]{6,7}"}
                maxLength={useBackup ? 32 : 7}
                aria-describedby={describedBy}
                className="font-mono tracking-[0.2em]"
              />
            )}
          </Field>
          <label className="flex items-start gap-3 text-sm text-ink-2">
            <input type="checkbox" name="trust" className="mt-0.5 size-5 shrink-0 accent-ink" />
            {t("auth.twoFactor.trust")}
          </label>
          <Button type="submit" block pending={pending} pendingLabel={t("auth.twoFactor.pending")}>
            {t("auth.twoFactor.submit")}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => {
            setUseBackup((v) => !v);
            setStatus("idle");
          }}
          className="-mt-2 self-start rounded-full text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {useBackup ? t("auth.twoFactor.useApp") : t("auth.twoFactor.useBackup")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("auth.login.title")}</h1>

      {notice === "passwordReset" && <Notice tone="success">{t("auth.login.passwordReset")}</Notice>}
      {statusNotice}

      {googleEnabled && (
        <>
          <GoogleButton />
          <OrDivider label={t("common.or")} />
        </>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate={false}>
        <Field label={t("auth.fields.email")}>
          {({ id, describedBy }) => <Input id={id} name="email" type="email" autoComplete="email" inputMode="email" required aria-describedby={describedBy} />}
        </Field>
        <Field label={t("auth.fields.password")}>
          {({ id, describedBy }) => (
            <PasswordInput
              id={id}
              name="password"
              autoComplete="current-password"
              required
              aria-describedby={describedBy}
              showLabel={t("auth.fields.showPassword")}
              hideLabel={t("auth.fields.hidePassword")}
            />
          )}
        </Field>
        <Link href="/forgot-password" className="-mt-1 self-start text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline">
          {t("auth.login.forgot")}
        </Link>
        <Button type="submit" block pending={pending} pendingLabel={t("auth.login.pending")}>
          {t("auth.login.submit")}
        </Button>
      </form>

      <p className="text-sm text-ink-2">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-ink underline underline-offset-4">
          {t("auth.login.toRegister")}
        </Link>
      </p>
    </div>
  );
}
