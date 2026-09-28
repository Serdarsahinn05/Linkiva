import type { Metadata } from "next";
import { LocalizedNotFound } from "@/components/ui/localized-status";
import { Ambient } from "@/components/ui/surface";
import { defaultLocale } from "@/i18n/config";
import { fontVariables } from "@/lib/fonts";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import "./globals.css";

export const metadata: Metadata = { title: "404 · Linkiva" };

const copy = (m: typeof tr) => ({ title: m.errors.notFoundTitle, body: m.errors.notFoundBody, home: m.errors.home });

/**
 * 404 for URLs that match no route at all (e.g. /a/b). It renders outside every root layout, so it brings its own
 * document; the text is switched to the visitor's language in the browser.
 */
export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={fontVariables}>
      <body>
        <Ambient />
        <LocalizedNotFound copy={{ tr: copy(tr), en: copy(en) }} />
      </body>
    </html>
  );
}
