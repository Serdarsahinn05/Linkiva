import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "./config";

// No locale prefix in URLs (it would collide with /[username]).
// Explicit locale (public profile uses its owner's) → cookie → Accept-Language → Turkish.
export default getRequestConfig(async ({ locale }) => {
  let resolved: Locale;
  if (isLocale(locale)) {
    resolved = locale;
  } else {
    const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
    resolved = isLocale(cookie) ? cookie : (matchAcceptLanguage((await headers()).get("accept-language")) ?? defaultLocale);
  }

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
    timeZone: "Europe/Istanbul",
  };
});
