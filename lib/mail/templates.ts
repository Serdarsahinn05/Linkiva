import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/config";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

export type MailKind = "verify" | "reset" | "changeEmail";

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ENTITIES[ch] ?? ch);

/**
 * Plain, table-based HTML that survives Gmail/Outlook. Carries the "Cam" world as far as email allows:
 * a soft pearl ground, a white card, and a single ink pill as the call to action.
 */
export function renderMail(kind: MailKind, locale: Locale, url: string) {
  const t = createTranslator({ locale, messages: locale === "en" ? en : tr, namespace: "mail" });
  const heading = t(`${kind}.heading`);
  const body = t(`${kind}.body`);
  const cta = t(`${kind}.cta`);
  const footer = t("footer");
  const safeUrl = escapeHtml(url);

  const html = `<!doctype html>
<html lang="${locale}"><body style="margin:0;background:#F4F4F8;font-family:Arial,Helvetica,sans-serif;color:#1C1E26">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E6E6EE;border-radius:20px">
<tr><td style="padding:32px 32px 0">
<span lang="en" style="display:inline-block;border:1px solid #E6E6EE;color:#1C1E26;font-weight:600;font-size:14px;padding:7px 14px;border-radius:999px">&#9679; Linkiva</span>
</td></tr>
<tr><td style="padding:28px 32px 8px"><h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.5px">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:8px 32px 24px;font-size:16px;line-height:1.55;color:#5B5F6E">${escapeHtml(body)}</td></tr>
<tr><td style="padding:0 32px 28px">
<a href="${safeUrl}" style="display:inline-block;background:#1C1E26;color:#FFFFFF;text-decoration:none;font-weight:500;font-size:15px;padding:14px 26px;border-radius:999px">${escapeHtml(cta)}</a>
</td></tr>
<tr><td style="padding:0 32px 28px;font-size:13px;line-height:1.5;color:#5B5F6E;word-break:break-all">${safeUrl}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #EEEEF3;font-size:13px;color:#5B5F6E">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = `${heading}\n\n${body}\n\n${url}\n\n${footer}`;
  return { subject: t(`${kind}.subject`), html, text };
}
