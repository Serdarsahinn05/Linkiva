import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "./config";
import { LOCALE_HEADER } from "./marketing";

// No locale prefix in URLs (it would collide with /[username]).
// Explicit locale (public profile uses its owner's) → the address of a site page (/en…, i18n/marketing.ts) → cookie
// → Accept-Language → Turkish.
export default getRequestConfig(async ({ locale }) => {
  let resolved: Locale;
  if (isLocale(locale)) {
    resolved = locale;
  } else {
    const head = await headers();
    const fixed = head.get(LOCALE_HEADER); // set by the proxy on site pages with a language in their address
    const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
    resolved = isLocale(fixed) ? fixed : isLocale(cookie) ? cookie : (matchAcceptLanguage(head.get("accept-language")) ?? defaultLocale);
  }

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
    timeZone: "Europe/Istanbul",
  };
});
