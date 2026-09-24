"use client";

import { SiGoogle } from "react-icons/si";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleButton({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const t = useTranslations("auth");
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="secondary"
      block
      pending={pending}
      onClick={async () => {
        setPending(true);
        // On success the browser navigates to Google; only a failure returns here.
        const { error } = await authClient.signIn.social({ provider: "google", callbackURL });
        if (error) setPending(false);
      }}
    >
      <SiGoogle size={16} aria-hidden />
      {t("google")}
    </Button>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-2" role="separator">
      <span className="h-px flex-1 bg-hairline" />
      {label}
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}
