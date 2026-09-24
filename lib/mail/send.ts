import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import type { Locale } from "@/i18n/config";
import { env } from "@/lib/env";
import { renderMail, type MailKind } from "./templates";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/** Local development / e2e: without a mail provider, the last mail per recipient lands in tmp/mailbox. */
export const DEV_MAILBOX = join(process.cwd(), "tmp", "mailbox");

export async function sendMail({ to, kind, locale, url }: { to: string; kind: MailKind; locale: Locale; url: string }) {
  const { subject, html, text } = renderMail(kind, locale, url);

  if (!resend) {
    if (env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
    await mkdir(DEV_MAILBOX, { recursive: true });
    await writeFile(join(DEV_MAILBOX, `${to.toLowerCase()}.json`), JSON.stringify({ to, kind, subject, url, sentAt: new Date().toISOString() }, null, 2));
    console.info(`[mail:${kind}] to=${to}\n${url}`);
    return;
  }

  const { error } = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html, text });
  if (error) throw new Error(`Mail delivery failed: ${error.message}`);
}
