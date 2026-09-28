import { site } from "@/lib/site";
import type { Locale } from "./config";

/**
 * The public site pages exist in both languages at fixed addresses, so search engines can index each one
 * (ROADMAP Faz 15): Turkish unprefixed, English under /en. "en" can never be a username (at least 3 characters)
 * and is reserved anyway. The dashboard and auth pages keep following the language cookie.
 */
const PAGES = {
  "/": { tr: "/", en: "/en" },
  "/privacy": { tr: "/privacy", en: "/en/privacy" },
  "/terms": { tr: "/terms", en: "/en/terms" },
} as const;

export type MarketingPage = keyof typeof PAGES;
export const MARKETING_PAGES = Object.keys(PAGES) as MarketingPage[]; // keys of the literal above

/** The request header the proxy sets on these pages; i18n/request.ts reads it before the cookie. */
export const LOCALE_HEADER = "x-linkiva-locale";

export function localizedPath<P extends MarketingPage, L extends Locale>(page: P, locale: L): (typeof PAGES)[P][L] {
  return PAGES[page][locale];
}

/** The fixed language of a site page address, or undefined for every other path. */
export function marketingLocale(pathname: string): Locale | undefined {
  for (const paths of Object.values(PAGES)) {
    if (paths.tr === pathname) return "tr";
    if (paths.en === pathname) return "en";
  }
  return undefined;
}

const absolute = (path: string) => (path === "/" ? site.url : `${site.url}${path}`);

/** hreflang for a site page: both languages plus x-default (Turkish, the product's first language). */
export function languageAlternates(page: MarketingPage) {
  return { tr: absolute(PAGES[page].tr), en: absolute(PAGES[page].en), "x-default": absolute(PAGES[page].tr) };
}

export function marketingUrl(page: MarketingPage, locale: Locale) {
  return absolute(PAGES[page][locale]);
}

/** `alternates` for a site page's metadata: its own canonical address and hreflang for both languages. */
export function marketingAlternates(page: MarketingPage, locale: Locale) {
  return { canonical: marketingUrl(page, locale), languages: languageAlternates(page) };
}

/** The page's fixed language as a Locale (getLocale() returns a plain string). */
export const pageLocale = (locale: string): Locale => (locale === "en" ? "en" : "tr");
