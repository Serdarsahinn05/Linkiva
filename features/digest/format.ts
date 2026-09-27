import type { Locale } from "@/i18n/config";
import type { Insight } from "@/features/analytics/insights";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

/** Monday 00:00 UTC of the week `now` falls in: one summary per profile per such week. */
export function weekStart(now: Date): Date {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day;
}

export const asLocale = (value: string): Locale => (value === "en" ? "en" : "tr");

/** An insight as a plain sentence for mail (the analytics page renders the same copy with styled figures). */
export function insightText(insight: Insight, locale: Locale): string {
  const copy = (locale === "en" ? en : tr).analytics.insight;
  const pct = (n: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(n);
  const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const [template, values]: [string, Record<string, string>] =
    insight.kind === "sourceLink"
      ? [copy.sourceLink, { source: insight.source, link: insight.linkTitle, share: pct(insight.share) }]
      : insight.kind === "peakHours"
        ? [copy.peakHours, { from: hour(insight.from), to: hour(insight.to), share: pct(insight.share) }]
        : [insight.change > 0 ? copy.linkUp : copy.linkDown, { link: insight.linkTitle, change: pct(Math.abs(insight.change)) }];
  return template.replace(/<\/?n>/g, "").replace(/\{(\w+)\}/g, (_m, key: string) => values[key] ?? "");
}
