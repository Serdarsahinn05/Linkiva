import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/config";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

export type MailKind = "verify" | "reset" | "changeEmail";

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ENTITIES[ch] ?? ch);

/**
 * Plain, table-based HTML that survives Gmail/Outlook. Carries the "Etiket" world in one place:
 * the call to action is a red tape strip on a steel-grey ground.
 */
export function renderMail(kind: MailKind, locale: Locale, url: string) {
  const t = createTranslator({ locale, messages: locale === "en" ? en : tr, namespace: "mail" });
  const heading = t(`${kind}.heading`);
  const body = t(`${kind}.body`);
  const cta = t(`${kind}.cta`);
  const footer = t("footer");
  const safeUrl = escapeHtml(url);

  const html = `<!doctype html>
<html lang="${locale}"><body style="margin:0;background:#E9EBEA;font-family:Arial,Helvetica,sans-serif;color:#141615">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9EBEA;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#F6F7F6;border:1px solid #C9CDCB;border-radius:4px">
<tr><td style="padding:32px 32px 0">
<span lang="en" style="display:inline-block;background:#1B1C1E;color:#FAFAFA;font-weight:700;letter-spacing:.08em;font-size:13px;padding:7px 14px;border-radius:2px">LINKIVA</span>
</td></tr>
<tr><td style="padding:28px 32px 8px"><h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:8px 32px 24px;font-size:16px;line-height:1.55;color:#4A4F4D">${escapeHtml(body)}</td></tr>
<tr><td style="padding:0 32px 28px">
<a href="${safeUrl}" style="display:inline-block;background:#C4262E;color:#FAFAFA;text-decoration:none;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:14px;padding:13px 22px;border-radius:2px">${escapeHtml(cta)}</a>
</td></tr>
<tr><td style="padding:0 32px 28px;font-size:13px;line-height:1.5;color:#4A4F4D;word-break:break-all">${safeUrl}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #C9CDCB;font-size:13px;color:#4A4F4D">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = `${heading}\n\n${body}\n\n${url}\n\n${footer}`;
  return { subject: t(`${kind}.subject`), html, text };
}
