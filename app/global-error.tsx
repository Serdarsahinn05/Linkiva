"use client";

import { House, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button, buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { Ambient } from "@/components/ui/surface";
import { errorCopy } from "@/features/errors/fallback-copy";
import { LostMascot } from "@/features/errors/components/lost-mascot";
import { defaultLocale } from "@/i18n/config";
import { useVisitorLocale } from "@/i18n/use-visitor-locale";
import { cn } from "@/lib/cn";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * An error in a root layout itself: it replaces the whole document, so it brings its own <html>, styles and fonts,
 * and picks the visitor's language in the browser (no i18n provider here). The same page as the 404.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const locale = useVisitorLocale();
  const t = errorCopy[locale];
  const home = locale === "en" ? "/en" : "/";
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang={defaultLocale} className={fontVariables}>
      <body>
        <title>{`500 · ${site.name}`}</title>
        <Ambient />
        <StatusPage
          code={error.digest ? `#${error.digest}` : "500"}
          home={home}
          figure={<LostMascot />}
          title={t.errorTitle}
          body={t.errorBody}
          actions={
            <>
              <Button size="lg" onClick={retry}>
                <RotateCcw size={18} aria-hidden />
                {t.retry}
              </Button>
              {/* A plain link: the app's router may be what broke. */}
              <a href={home} className={cn(buttonBase, buttonVariants.ghost, buttonSizes.lg)}>
                <House size={18} aria-hidden />
                {t.home}
              </a>
            </>
          }
        />
      </body>
    </html>
  );
}
