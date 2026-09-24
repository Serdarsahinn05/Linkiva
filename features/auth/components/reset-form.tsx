"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MAX, PASSWORD_MIN, passwordSchema } from "@/lib/validation/auth";

export function ResetForm({ token }: { token: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [tokenInvalid, setTokenInvalid] = useState(!token);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (!passwordSchema.safeParse(password).success) {
      setError(password.length < PASSWORD_MIN ? t("auth.errors.passwordShort", { min: PASSWORD_MIN }) : t("auth.errors.passwordLong", { max: PASSWORD_MAX }));
      return;
    }
    setError(undefined);
    setPending(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) {
      if (result.error.code === "INVALID_TOKEN" || result.error.status === 400) setTokenInvalid(true);
      else setError(t("common.genericError"));
      return;
    }
    router.replace("/login?reset=1");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("auth.reset.title")}</h1>

      {tokenInvalid ? (
        <>
          <Notice tone="error">{t("auth.reset.invalidToken")}</Notice>
          <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
            {t("auth.reset.requestNew")}
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label={t("auth.fields.newPassword")} hint={t("auth.fields.passwordHint", { min: PASSWORD_MIN })} error={error}>
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
          <Button type="submit" block pending={pending} pendingLabel={t("auth.reset.pending")}>
            {t("auth.reset.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
