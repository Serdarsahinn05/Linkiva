import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import type { Locale } from "@/i18n/config";
import { env, isE2E } from "@/lib/env";
import { renderMail, type MailKind, type MailParams } from "./templates";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/** Local development / e2e: without a mail provider, the last mail per recipient lands in tmp/mailbox. */
const DEV_MAILBOX = join(process.cwd(), "tmp", "mailbox");

export async function sendMail({ to, kind, locale, url, newEmail }: { to: string; kind: MailKind; locale: Locale } & MailParams) {
  const { subject, html, text } = renderMail(kind, locale, { url, newEmail });

  if (!resend) {
    if (env.NODE_ENV === "production" && !isE2E) throw new Error("RESEND_API_KEY is not configured");
    await mkdir(DEV_MAILBOX, { recursive: true });
    await writeFile(join(DEV_MAILBOX, `${to.toLowerCase()}.json`), JSON.stringify({ to, kind, subject, url, sentAt: new Date().toISOString() }, null, 2));
    console.info(`[mail:${kind}] to=${to}${url ? `\n${url}` : ""}`);
    return;
  }

  const { error } = await resend.emails.send({ from: env.MAIL_FROM, to, subject, html, text });
  if (error) throw new Error(`Mail delivery failed: ${error.message}`);
}

/** Notifications must never break the action that triggered them (a deleted account stays deleted). */
export function sendMailQuietly(input: Parameters<typeof sendMail>[0]) {
  return sendMail(input).catch((error) => console.error(`[mail:${input.kind}] failed`, error));
}
