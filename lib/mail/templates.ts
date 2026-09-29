import type { Locale } from "@/i18n/config";
import { site } from "@/lib/site";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

export const MAIL_KINDS = ["verify", "reset", "changeEmail", "changeEmailConfirm", "welcome", "passwordChanged", "accountDeletionScheduled", "accountDeleted", "twoFactorOff", "twoFactorLocked"] as const;
export type MailKind = (typeof MAIL_KINDS)[number];

/** Values a template may interpolate; each kind uses a subset. */
export type MailParams = { url?: string; newEmail?: string };

export type RenderedMail = { subject: string; html: string; text: string };

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ENTITIES[ch] ?? ch);

// "Cam" as far as email allows: pearl ground, white card, one ink pill. Hex values, because many
// clients ignore CSS variables and oklch.
const C = { ground: "#F4F4F8", card: "#FFFFFF", edge: "#E6E6EE", ink: "#1C1E26", ink2: "#5B5F6E", ink3: "#80848F" };

const catalogOf = (locale: Locale) => (locale === "en" ? en : tr);

/** The pill button and its copy-this-link fallback. */
function buttonRows(label: string, href: string, fallback: string) {
  const safeHref = escapeHtml(href);
  return `<tr><td style="padding:4px 36px 28px"><a href="${safeHref}" style="display:inline-block;background:${C.ink};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;line-height:1;padding:15px 26px;border-radius:999px">${escapeHtml(label)}</a></td></tr>
<tr><td style="padding:0 36px 28px;font-size:12px;line-height:1.5;color:${C.ink3}">${escapeHtml(fallback)}<br><a href="${safeHref}" style="color:${C.ink2};word-break:break-all">${safeHref}</a></td></tr>`;
}

/** Table-based frame shared by every mail: preheader, wordmark pill, white card with the rows, footer. */
function frame({ locale, subject, preheader, heading, rows, footerHtml }: { locale: Locale; subject: string; preheader: string; heading: string; rows: string; footerHtml: string }) {
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.ground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground};padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 8px 18px"><span lang="en" style="display:inline-block;background:${C.card};border:1px solid ${C.edge};border-radius:999px;padding:8px 14px;font-weight:600;font-size:14px;color:${C.ink}"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${C.ink};margin-right:7px;vertical-align:1px"></span>Linkiva</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.edge};border-radius:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:36px 36px 10px"><h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.5px;color:${C.ink}">${escapeHtml(heading)}</h1></td></tr>
${rows}
</table></td></tr>
<tr><td style="padding:20px 12px 0;font-size:12px;line-height:1.6;color:${C.ink3}">${footerHtml}</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Renders a transactional email. Table-based HTML that survives Gmail, Outlook and Apple Mail,
 * a hidden preheader for the inbox preview, a plain-text twin, and a "why you got this" footer.
 */
export function renderMail(kind: MailKind, locale: Locale, params: MailParams = {}): RenderedMail {
  const catalog = catalogOf(locale).mail;
  const copy: Partial<Record<string, string>> = catalog[kind];
  const values: Record<string, string> = { url: params.url ?? site.url, newEmail: params.newEmail ?? "" };
  // Only {url} and {newEmail} placeholders exist in mail copy; missing keys render as empty.
  const text = (key: string) => (copy[key] ?? "").replace(/\{(\w+)\}/g, (_m, name: string) => values[name] ?? "");

  const heading = text("heading");
  const body = text("body");
  const cta = text("cta");
  const security = text("security");
  const href = params.url ?? site.url;

  const rows = [
    `<tr><td style="padding:8px 36px 26px;font-size:16px;line-height:1.6;color:${C.ink2}">${escapeHtml(body)}</td></tr>`,
    cta ? buttonRows(cta, href, catalog.fallback) : "",
    security ? `<tr><td style="padding:0 36px 28px;font-size:14px;line-height:1.55;color:${C.ink2}">${escapeHtml(security)}</td></tr>` : "",
  ].join("\n");
  const footerHtml = `${escapeHtml(catalog.footer)} ${escapeHtml(catalog.footerIgnore)}<br><a href="${escapeHtml(site.url)}" style="color:${C.ink3}">${escapeHtml(site.host)}</a>`;
  const html = frame({ locale, subject: text("subject"), preheader: text("preheader"), heading, rows, footerHtml });

  const plain = [heading, "", body, ...(cta ? ["", `${cta}: ${href}`] : []), ...(security ? ["", security] : []), "", "—", catalog.footer, site.url].join("\n");
  return { subject: text("subject"), html, text: plain };
}

/** Broken link notice (features/link-check): the links that failed the daily check twice in a row, and the editor. */
export function renderBrokenLinks(locale: Locale, links: { title: string; url: string }[]): RenderedMail {
  const catalog = catalogOf(locale).mail;
  const copy = catalog.brokenLinks;
  const editorUrl = `${site.url}/dashboard`;
  const count = String(links.length);
  const body = copy.body.replace("{count}", count);

  const list = `<tr><td style="padding:0 36px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${links
    .map(
      (l) =>
        `<tr><td style="padding:10px 0;border-top:1px solid ${C.edge}"><div style="font-size:15px;font-weight:600;color:${C.ink}">${escapeHtml(l.title)}</div><div style="font-size:13px;line-height:1.5;color:${C.ink3};word-break:break-all">${escapeHtml(l.url)}</div></td></tr>`,
    )
    .join("")}</table></td></tr>`;
  const rows = [
    `<tr><td style="padding:8px 36px 22px;font-size:16px;line-height:1.6;color:${C.ink2}">${escapeHtml(body)}</td></tr>`,
    list,
    buttonRows(copy.cta, editorUrl, catalog.fallback),
  ].join("\n");
  const footerHtml = `${escapeHtml(copy.footer)}<br><a href="${escapeHtml(site.url)}" style="color:${C.ink3}">${escapeHtml(site.host)}</a>`;
  const html = frame({ locale, subject: copy.subject, preheader: copy.preheader.replace("{count}", count), heading: copy.heading, rows, footerHtml });

  const plain = [copy.heading, "", body, "", ...links.map((l) => `- ${l.title}: ${l.url}`), "", `${copy.cta}: ${editorUrl}`, "", "—", copy.footer, site.url].join("\n");
  return { subject: copy.subject, html, text: plain };
}

export type DigestMail = {
  views: number;
  clicks: number;
  /** Relative change against the week before; null when there is nothing to compare. */
  viewsTrend: number | null;
  clicksTrend: number | null;
  /** At most three, most clicked first. */
  topLinks: { title: string; clicks: number }[];
  /** One insight sentence, already in the owner's language (plain text). */
  insight: string | null;
  /** Signed, session-less opt-out page. */
  unsubscribeUrl: string;
};

/** The weekly summary (features/digest): two figures with their trend, the top links, one insight. */
export function renderDigest(locale: Locale, data: DigestMail): RenderedMail {
  const catalog = catalogOf(locale).mail;
  const copy = catalog.digest;
  const count = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });
  const fill = (s: string) => s.replace("{views}", count.format(data.views)).replace("{clicks}", count.format(data.clicks));
  const trend = (value: number | null) => (value === null ? "" : `${percent.format(value)} ${copy.vsLastWeek}`);
  const analyticsUrl = `${site.url}/dashboard/analytics`;

  const stat = (label: string, value: number, change: number | null) =>
    `<td width="50%" style="padding:0 6px;vertical-align:top"><div style="border:1px solid ${C.edge};border-radius:16px;padding:16px 18px">
<div style="font-size:13px;color:${C.ink3}">${escapeHtml(label)}</div>
<div style="font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.5px;color:${C.ink};font-variant-numeric:tabular-nums">${escapeHtml(count.format(value))}</div>
<div style="font-size:12px;line-height:1.4;color:${C.ink2};min-height:17px">${escapeHtml(trend(change))}</div></div></td>`;

  const links = data.topLinks.length
    ? `<tr><td style="padding:0 36px 8px;font-size:13px;font-weight:600;color:${C.ink3}">${escapeHtml(copy.topLinks)}</td></tr>
<tr><td style="padding:0 36px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${data.topLinks
        .map(
          (l) =>
            `<tr><td style="padding:9px 0;border-top:1px solid ${C.edge};font-size:15px;color:${C.ink}">${escapeHtml(l.title)}</td><td align="right" style="padding:9px 0;border-top:1px solid ${C.edge};font-size:15px;color:${C.ink2};font-variant-numeric:tabular-nums;white-space:nowrap">${escapeHtml(count.format(l.clicks))}</td></tr>`,
        )
        .join("")}</table></td></tr>`
    : "";

  const rows = [
    `<tr><td style="padding:14px 30px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${stat(copy.views, data.views, data.viewsTrend)}${stat(copy.clicks, data.clicks, data.clicksTrend)}</tr></table></td></tr>`,
    links,
    data.insight ? `<tr><td style="padding:0 36px 26px;font-size:15px;line-height:1.6;color:${C.ink2}">${escapeHtml(data.insight)}</td></tr>` : "",
    buttonRows(copy.cta, analyticsUrl, catalog.fallback),
  ].join("\n");
  const footerHtml = `${escapeHtml(copy.footer)} <a href="${escapeHtml(data.unsubscribeUrl)}" style="color:${C.ink2}">${escapeHtml(copy.unsubscribe)}</a><br><a href="${escapeHtml(site.url)}" style="color:${C.ink3}">${escapeHtml(site.host)}</a>`;
  const html = frame({ locale, subject: copy.subject, preheader: fill(copy.preheader), heading: copy.heading, rows, footerHtml });

  const line = (label: string, value: number, change: number | null) => `${label}: ${count.format(value)}${change === null ? "" : ` (${trend(change)})`}`;
  const plain = [
    copy.heading,
    "",
    line(copy.views, data.views, data.viewsTrend),
    line(copy.clicks, data.clicks, data.clicksTrend),
    ...(data.topLinks.length ? ["", `${copy.topLinks}:`, ...data.topLinks.map((l) => `- ${l.title}: ${count.format(l.clicks)}`)] : []),
    ...(data.insight ? ["", data.insight] : []),
    "",
    `${copy.cta}: ${analyticsUrl}`,
    "",
    "—",
    copy.footer,
    `${copy.unsubscribe}: ${data.unsubscribeUrl}`,
  ].join("\n");
  return { subject: copy.subject, html, text: plain };
}
