"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultLocale, isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "./config";

const subscribe = () => () => {};

function browserLocale(): Locale {
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  if (isLocale(cookie)) return cookie;
  return matchAcceptLanguage(navigator.languages.join(",")) ?? defaultLocale;
}

/**
 * The visitor's language on pages that must stay static (cached profile 404, the global 404): rendered in Turkish on
 * the server, switched after hydration from the language cookie or the browser. Also sets <html lang> to match.
 */
export function useVisitorLocale(): Locale {
  const locale = useSyncExternalStore(subscribe, browserLocale, () => defaultLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return locale;
}
