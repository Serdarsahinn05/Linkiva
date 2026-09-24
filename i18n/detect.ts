import { defaultLocale, isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "./config";

/** Locale for work that happens outside a page render (emails sent from auth callbacks). */
export function localeFromRequest(request?: Request): Locale {
  if (!request) return defaultLocale;
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim().split("="))
    .find(([name]) => name === LOCALE_COOKIE)?.[1];
  if (isLocale(cookie)) return cookie;
  return matchAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;
}
