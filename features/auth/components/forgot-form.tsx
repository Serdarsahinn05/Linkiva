"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { authClient } from "@/lib/auth-client";
import { emailSchema } from "@/lib/validation/auth";

export function ForgotForm() {
  const t = useTranslations();
  const [state, setState] = useState<"idle" | "pending" | "sent" | "tooMany">("idle");
  const [emailError, setEmailError] = useState<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = emailSchema.safeParse(new FormData(event.currentTarget).get("email"));
    if (!email.success) {
      setEmailError(t("auth.errors.email"));
      return;
    }
    setEmailError(undefined);
    setState("pending");
    const { error } = await authClient.requestPasswordReset({ email: email.data, redirectTo: "/reset-password" });
    // Same answer whether or not the account exists.
    setState(error?.status === 429 ? "tooMany" : "sent");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("auth.forgot.title")}</h1>
        <p className="text-ink-2">{t("auth.forgot.lede")}</p>
      </div>

      {state === "sent" ? (
        <Notice tone="success">{t("auth.forgot.sent")}</Notice>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {state === "tooMany" && <Notice tone="error">{t("auth.register.tooMany")}</Notice>}
          <Field label={t("auth.fields.email")} error={emailError}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={invalid} aria-describedby={describedBy} />
            )}
          </Field>
          <Button type="submit" block pending={state === "pending"} pendingLabel={t("auth.forgot.pending")}>
            {t("auth.forgot.submit")}
          </Button>
        </form>
      )}

      <Link href="/login" className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink">
        {t("auth.forgot.backToLogin")}
      </Link>
    </div>
  );
}
