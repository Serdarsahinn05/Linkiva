"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { authClient } from "@/lib/auth-client";

export function ResendVerification({ email }: { email: string }) {
  const t = useTranslations();
  const [state, setState] = useState<"idle" | "pending" | "sent" | "tooMany">("idle");

  return (
    <div className="flex flex-col gap-3">
      {state === "sent" && <Notice tone="success">{t("auth.checkEmail.resent")}</Notice>}
      {state === "tooMany" && <Notice tone="error">{t("auth.register.tooMany")}</Notice>}
      <Button
        variant="secondary"
        pending={state === "pending"}
        onClick={async () => {
          setState("pending");
          const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/onboarding" });
          setState(error?.status === 429 ? "tooMany" : "sent");
        }}
      >
        {t("auth.checkEmail.resend")}
      </Button>
    </div>
  );
}
