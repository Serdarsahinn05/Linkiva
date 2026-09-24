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

type Status = "idle" | "invalid" | "unverified" | "tooMany" | "error";

export function LoginForm({ googleEnabled, notice }: { googleEnabled: boolean; notice?: "passwordReset" }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setStatus("idle");

    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      callbackURL: "/dashboard",
    });

    if (!error) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setPending(false);
    // One message for wrong email *and* wrong password: never reveal which accounts exist.
    if (error.status === 429) setStatus("tooMany");
    else if (error.code === "EMAIL_NOT_VERIFIED") setStatus("unverified");
    else if (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD") setStatus("invalid");
    else setStatus("error");
  }

  const messages: Record<Exclude<Status, "idle">, string> = {
    invalid: t("auth.login.invalid"),
    unverified: t("auth.login.unverified"),
    tooMany: t("auth.login.tooMany"),
    error: t("common.genericError"),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">{t("auth.login.title")}</h1>

      {notice === "passwordReset" && <Notice tone="success">{t("auth.login.passwordReset")}</Notice>}
      {status !== "idle" && <Notice tone={status === "unverified" ? "info" : "error"}>{messages[status]}</Notice>}

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
