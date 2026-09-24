/**
 * Crawlers, link previewers and headless browsers never count as visits or clicks (v1 bug A2:
 * WhatsApp/Telegram/X previews were recorded as profile views).
 */
const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|whatsapp|telegram|twitterbot|linkedinbot|slackbot|discordbot|embedly|pinterest|skypeuripreview|vkshare|redditbot|applebot|bingpreview|googleother|google-inspectiontool|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pagespeed|curl\/|wget\/|python-requests|python-urllib|go-http-client|okhttp|axios\/|node-fetch|undici|httpclient|java\/|libwww|scrapy|monitor|uptime|pingdom|statuscake|vercel-screenshot/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 12) return true;
  return BOT_RE.test(userAgent);
}

/** Browser/Next prefetches are not visits. */
export function isPrefetch(headers: Headers): boolean {
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`.toLowerCase();
  return purpose.includes("prefetch") || purpose.includes("prerender") || headers.has("next-router-prefetch");
}
