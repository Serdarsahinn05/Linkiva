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
import { emailSchema, PASSWORD_MAX, PASSWORD_MIN, passwordSchema } from "@/lib/validation/auth";
import { GoogleButton, OrDivider } from "./google-button";

type Errors = { email?: string; password?: string; form?: string };

export function RegisterForm({ googleEnabled, claimedUsername }: { googleEnabled: boolean; claimedUsername?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // The username typed on the landing page travels through verification to onboarding.
  const onboarding = claimedUsername ? `/onboarding?username=${encodeURIComponent(claimedUsername)}` : "/onboarding";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = emailSchema.safeParse(form.get("email"));
    const password = String(form.get("password") ?? "");
    const next: Errors = {};
    if (!email.success) next.email = t("auth.errors.email");
    if (password.length < PASSWORD_MIN) next.password = t("auth.errors.passwordShort", { min: PASSWORD_MIN });
    else if (!passwordSchema.safeParse(password).success) next.password = t("auth.errors.passwordLong", { max: PASSWORD_MAX });
    setErrors(next);
    if (next.email || next.password || !email.success) return;

    setPending(true);
    const { error } = await authClient.signUp.email({
      email: email.data,
      password,
      // Better Auth requires a name; the real display name is chosen in onboarding.
      name: email.data.split("@")[0] ?? email.data,
      callbackURL: onboarding,
    });
    setPending(false);

    if (error) {
      setErrors({ form: error.status === 429 ? t("auth.register.tooMany") : t("common.genericError") });
      return;
    }
    // Same screen whether or not the address already had an account (no enumeration).
    router.push(`/check-email?email=${encodeURIComponent(email.data)}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("auth.register.title")}</h1>
        <p className="text-ink-2">{t("auth.register.lede")}</p>
      </div>

      {errors.form && <Notice tone="error">{errors.form}</Notice>}

      {googleEnabled && (
        <>
          <GoogleButton callbackURL={onboarding} />
          <OrDivider label={t("common.or")} />
        </>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label={t("auth.fields.email")} error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={invalid} aria-describedby={describedBy} />
          )}
        </Field>
        <Field label={t("auth.fields.password")} hint={t("auth.fields.passwordHint", { min: PASSWORD_MIN })} error={errors.password}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              name="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              showLabel={t("auth.fields.showPassword")}
              hideLabel={t("auth.fields.hidePassword")}
            />
          )}
        </Field>
        <Button type="submit" block pending={pending} pendingLabel={t("auth.register.pending")}>
          {t("auth.register.submit")}
        </Button>
        <p className="text-sm text-ink-2">{t("auth.register.terms")}</p>
      </form>

      <p className="text-sm text-ink-2">
        {t("auth.register.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          {t("auth.register.toLogin")}
        </Link>
      </p>
    </div>
  );
}
