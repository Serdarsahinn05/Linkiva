"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { localizedPath, MARKETING_PAGES } from "@/i18n/marketing";

const YEAR = 60 * 60 * 24 * 365;
const schema = z.object({ to: z.enum(locales), page: z.enum(MARKETING_PAGES) });

/**
 * The language switch on the site pages: remembers the choice (so sign-up and the dashboard follow it) and opens the
 * same page in that language. Only known pages are accepted, so this cannot redirect anywhere else. A plain form
 * action: works without JavaScript.
 */
export async function switchLanguage(formData: FormData) {
  const parsed = schema.safeParse({ to: formData.get("to"), page: formData.get("page") });
  if (!parsed.success) redirect("/");
  (await cookies()).set(LOCALE_COOKIE, parsed.data.to, { path: "/", maxAge: YEAR, sameSite: "lax" });
  redirect(localizedPath(parsed.data.page, parsed.data.to));
}
