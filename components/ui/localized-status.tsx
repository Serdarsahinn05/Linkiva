"use client";

import { House } from "lucide-react";
import Link from "next/link";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { LostMascot } from "@/features/errors/components/lost-mascot";
import type { Locale } from "@/i18n/config";
import { useVisitorLocale } from "@/i18n/use-visitor-locale";
import { cn } from "@/lib/cn";
import { StatusPage } from "./status-page";

type Copy = { title: string; body: string; home: string };

/** A static 404 (app/global-not-found.tsx) in the visitor's language, picked in the browser. */
export function LocalizedNotFound({ copy }: { copy: Record<Locale, Copy> }) {
  const locale = useVisitorLocale();
  const t = copy[locale];
  const home = locale === "en" ? "/en" : "/";
  return (
    <StatusPage
      code="404"
      home={home}
      figure={<LostMascot />}
      title={t.title}
      body={t.body}
      actions={
        <Link href={home} className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg)}>
          <House size={18} aria-hidden />
          {t.home}
        </Link>
      }
    />
  );
}
