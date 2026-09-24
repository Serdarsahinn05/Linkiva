"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

// Public profile error boundary. The profile root has no client i18n provider, so the copy is bilingual.
export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <StatusPage
      code="500"
      title="Bir şeyler ters gitti"
      body="Something went wrong. Tekrar dene / try again."
      actions={
        <Button size="md" onClick={reset}>
          <RotateCcw size={16} aria-hidden />
          Tekrar dene
        </Button>
      }
    />
  );
}
