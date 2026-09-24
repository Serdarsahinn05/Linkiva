import type { Locale } from "@/i18n/config";
import { site } from "@/lib/site";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

export const MAIL_KINDS = ["verify", "reset", "changeEmail", "changeEmailConfirm", "welcome", "passwordChanged", "accountDeleted"] as const;
export type MailKind = (typeof MAIL_KINDS)[number];

/** Values a template may interpolate; each kind uses a subset. */
export type MailParams = { url?: string; newEmail?: string };

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ENTITIES[ch] ?? ch);

// "Cam" as far as email allows: pearl ground, white card, one ink pill. Hex values, because many
// clients ignore CSS variables and oklch.
const C = { ground: "#F4F4F8", card: "#FFFFFF", edge: "#E6E6EE", ink: "#1C1E26", ink2: "#5B5F6E", ink3: "#80848F" };

/**
 * Renders a transactional email. Table-based HTML that survives Gmail, Outlook and Apple Mail,
 * a hidden preheader for the inbox preview, a plain-text twin, and a "why you got this" footer.
 */
export function renderMail(kind: MailKind, locale: Locale, params: MailParams = {}) {
  const catalog = (locale === "en" ? en : tr).mail;
  const copy: Partial<Record<string, string>> = catalog[kind];
  const values: Record<string, string> = { url: params.url ?? site.url, newEmail: params.newEmail ?? "" };
  // Only {url} and {newEmail} placeholders exist in mail copy; missing keys render as empty.
  const text = (key: string) => (copy[key] ?? "").replace(/\{(\w+)\}/g, (_m, name: string) => values[name] ?? "");
  const t = (key: "footer" | "footerIgnore" | "fallback") => catalog[key];

  const heading = text("heading");
  const body = text("body");
  const cta = text("cta");
  const security = text("security");
  const preheader = text("preheader");
  const href = params.url ?? site.url;
  const safeHref = escapeHtml(href);

  const button = cta
    ? `<tr><td style="padding:4px 36px 28px"><a href="${safeHref}" style="display:inline-block;background:${C.ink};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;line-height:1;padding:15px 26px;border-radius:999px">${escapeHtml(cta)}</a></td></tr>
<tr><td style="padding:0 36px 28px;font-size:12px;line-height:1.5;color:${C.ink3}">${escapeHtml(t("fallback"))}<br><a href="${safeHref}" style="color:${C.ink2};word-break:break-all">${safeHref}</a></td></tr>`
    : "";
  const note = security ? `<tr><td style="padding:0 36px 28px;font-size:14px;line-height:1.55;color:${C.ink2}">${escapeHtml(security)}</td></tr>` : "";

  const html = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(text("subject"))}</title></head>
<body style="margin:0;padding:0;background:${C.ground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground};padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 8px 18px"><span lang="en" style="display:inline-block;background:${C.card};border:1px solid ${C.edge};border-radius:999px;padding:8px 14px;font-weight:600;font-size:14px;color:${C.ink}"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${C.ink};margin-right:7px;vertical-align:1px"></span>Linkiva</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.edge};border-radius:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:36px 36px 10px"><h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.5px;color:${C.ink}">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:8px 36px 26px;font-size:16px;line-height:1.6;color:${C.ink2}">${escapeHtml(body)}</td></tr>
${button}
${note}
</table></td></tr>
<tr><td style="padding:20px 12px 0;font-size:12px;line-height:1.6;color:${C.ink3}">${escapeHtml(t("footer"))} ${escapeHtml(t("footerIgnore"))}<br><a href="${escapeHtml(site.url)}" style="color:${C.ink3}">${escapeHtml(site.host)}</a></td></tr>
</table></td></tr></table></body></html>`;

  const plain = [heading, "", body, ...(cta ? ["", `${cta}: ${href}`] : []), ...(security ? ["", security] : []), "", "—", t("footer"), site.url].join("\n");
  return { subject: text("subject"), html, text: plain };
}
