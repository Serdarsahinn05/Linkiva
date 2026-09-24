import { env } from "@/lib/env";
import { MAIL_KINDS, renderMail, type MailKind } from "@/lib/mail/templates";

/** Development only: renders a transactional mail in the browser, e.g. /api/dev/mail?kind=reset&locale=en. */
export function GET(request: Request) {
  if (env.NODE_ENV === "production") return new Response("Not found", { status: 404 });

  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") as MailKind | null;
  if (!kind || !MAIL_KINDS.includes(kind)) {
    const links = MAIL_KINDS.map((k) => `<li><a href="?kind=${k}">${k}</a> · <a href="?kind=${k}&locale=en">en</a></li>`).join("");
    return new Response(`<ul style="font:16px/2 system-ui">${links}</ul>`, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const locale = params.get("locale") === "en" ? "en" : "tr";
  const { html } = renderMail(kind, locale, { url: "https://linkiva.space/example-link", newEmail: "yeni@example.com" });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
