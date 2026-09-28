import { env } from "@/lib/env";
import { MAIL_KINDS, renderBrokenLinks, renderDigest, renderMail, type MailKind } from "@/lib/mail/templates";

const KINDS = [...MAIL_KINDS, "digest", "brokenLinks"] as const;

/** Development only: renders a mail in the browser, e.g. /api/dev/mail?kind=reset&locale=en (digest and brokenLinks use samples). */
export function GET(request: Request) {
  if (env.NODE_ENV === "production") return new Response("Not found", { status: 404 });

  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  if (!kind || !(KINDS as readonly string[]).includes(kind)) {
    const links = KINDS.map((k) => `<li><a href="?kind=${k}">${k}</a> · <a href="?kind=${k}&locale=en">en</a></li>`).join("");
    return new Response(`<ul style="font:16px/2 system-ui">${links}</ul>`, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const locale = params.get("locale") === "en" ? "en" : "tr";
  const { html } =
    kind === "digest"
      ? renderDigest(locale, {
          views: 1284,
          clicks: 342,
          viewsTrend: 0.18,
          clicksTrend: -0.07,
          topLinks: [
            { title: "Portfolyo", clicks: 121 },
            { title: "YouTube kanalım", clicks: 88 },
            { title: "İletişim", clicks: 40 },
          ],
          insight: locale === "en" ? "Busiest hours are 20:00–23:00 (41% of visits)." : "En yoğun saatler 20:00–23:00 (ziyaretlerin %41'i).",
          unsubscribeUrl: "https://linkiva.space/unsubscribe?t=example",
        })
      : kind === "brokenLinks"
        ? renderBrokenLinks(locale, [
            { title: "Portfolyo", url: "https://example.com/portfolyo" },
            { title: "Etkinlik bileti", url: "https://example.com/bilet/2026" },
          ])
      : // Narrowed by the includes check above; the samples are handled in the other branches.
        renderMail(kind as MailKind, locale, { url: "https://linkiva.space/example-link", newEmail: "yeni@example.com" });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
