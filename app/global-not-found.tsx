import type { Metadata } from "next";
import Link from "next/link";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { Ambient } from "@/components/ui/surface";
import { defaultLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { fontVariables } from "@/lib/fonts";
import tr from "@/messages/tr.json";
import "./globals.css";

export const metadata: Metadata = { title: "404 · Linkiva" };

/**
 * 404 for URLs that match no route at all (e.g. /a/b). It renders outside every root layout, so it
 * brings its own document and uses the default language.
 */
export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={fontVariables}>
      <body>
        <Ambient />
        <StatusPage
          code="404"
          title={tr.errors.notFoundTitle}
          body={tr.errors.notFoundBody}
          actions={
            <Link href="/" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
              {tr.errors.home}
            </Link>
          }
        />
      </body>
    </html>
  );
}
