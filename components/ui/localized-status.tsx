"use client";

import Link from "next/link";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { useVisitorLocale } from "@/i18n/use-visitor-locale";
import { cn } from "@/lib/cn";
import { StatusPage } from "./status-page";

type Copy = { title: string; body: string; home: string };

/** A static 404 (app/global-not-found.tsx) in the visitor's language, picked in the browser. */
export function LocalizedNotFound({ copy }: { copy: Record<Locale, Copy> }) {
  const t = copy[useVisitorLocale()];
  return (
    <StatusPage
      code="404"
      title={t.title}
      body={t.body}
      actions={
        <Link href="/" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
          {t.home}
        </Link>
      }
    />
  );
}
