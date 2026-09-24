"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { THEME_COOKIE } from "@/lib/theme-preference";

const YEAR = 60 * 60 * 24 * 365;

/** Interface preferences live in cookies so the root layout can apply them before first paint. */
export async function setThemePreference(value: string) {
  const parsed = z.enum(["light", "dark", "system"]).safeParse(value);
  if (!parsed.success) return;
  const jar = await cookies();
  if (parsed.data === "system") jar.delete(THEME_COOKIE);
  else jar.set(THEME_COOKIE, parsed.data, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

export async function setLocalePreference(value: string) {
  const parsed = z.enum(locales).safeParse(value);
  if (!parsed.success) return;
  (await cookies()).set(LOCALE_COOKIE, parsed.data, { path: "/", maxAge: YEAR, sameSite: "lax" });
}
