import { Download, Minus, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { TrafficChart } from "@/features/analytics/components/traffic-chart";
import { getAnalytics, isRange, RANGES, type Row } from "@/features/analytics/queries";
import { PageHeader, Section } from "@/features/dashboard/components/page";
import { getOwnProfile } from "@/features/profile/queries";
import { cn } from "@/lib/cn";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("analytics"))("title") };
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/dashboard/analytics">) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) return null;

  const { range: rawRange } = await searchParams;
  const range = isRange(rawRange) ? rawRange : "30d";
  const locale = await getLocale();
  const t = await getTranslations("analytics");
  const tNav = await getTranslations("nav");
  const format = await getFormatter();
  const data = await getAnalytics(profile, range, locale);
  const pct = (n: number) => format.number(n, { style: "percent", maximumFractionDigits: 1 });

  const stats = [
    { key: "views", label: t("views"), value: format.number(data.totals.views), trend: data.trend.views, relative: true },
    { key: "visitors", label: t("visitors"), value: format.number(data.totals.visitors), trend: data.trend.visitors, relative: true },
    { key: "clicks", label: t("clicks"), value: format.number(data.totals.clicks), trend: data.trend.clicks, relative: true },
    // CTR's trend is a difference in percentage points, not a relative change.
    { key: "ctr", label: t("ctr"), value: pct(data.totals.ctr), trend: data.trend.ctr, relative: false },
  ];

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
      <PageHeader title={t("title")}>
        <div className="flex items-center gap-2">
        {/* Audience has no slot in the 5-tab mobile bar; it is reached from here on phones. */}
        <Link href="/dashboard/audience" className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md, "px-3 lg:hidden")}>
          <Users size={16} aria-hidden />
          {tNav("audience")}
        </Link>
        {data.totals.views > 0 && (
          // A file download, not a navigation.
          <a href={`/dashboard/analytics/export?range=${range}`} download className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md, "max-sm:px-3")}>
            <Download size={16} aria-hidden />
            <span className="max-sm:sr-only">{t("export")}</span>
          </a>
        )}
        </div>
      </PageHeader>

      {/* Range tabs are links: shareable, back-button friendly, no client state. */}
      <nav aria-label={t("title")} className="glass-flat flex w-fit rounded-full p-1">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/dashboard/analytics?range=${r}`}
            aria-current={r === range ? "page" : undefined}
            className={cn(
              "flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
              r === range ? "bg-glass-strong text-ink shadow-[inset_0_1px_0_var(--c-glass-shine)]" : "text-ink-2 hover:text-ink",
            )}
          >
            {t(`ranges.${r}`)}
          </Link>
        ))}
      </nav>

      {/* Stat strip: one glass band, not a grid of cards (DESIGN.md §7). */}
      <section className="glass grid grid-cols-2 overflow-hidden rounded-[var(--radius-card)] lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.key} className={cn("flex flex-col gap-1.5 p-5", i % 2 === 1 && "border-l border-glass-edge", i >= 2 && "max-lg:border-t max-lg:border-glass-edge", i === 2 && "lg:border-l lg:border-glass-edge")}>
            <span className="text-sm text-ink-2">{s.label}</span>
            <span className="font-mono text-[1.75rem] leading-none font-medium tracking-[-0.02em] tabular-nums">{s.value}</span>
            <TrendBadge value={s.trend} relative={s.relative} empty={t("noCompare")} title={t("vsPrevious")} format={(n) => (s.relative ? pct(Math.abs(n)) : `${format.number(Math.abs(n) * 100, { maximumFractionDigits: 1 })} pp`)} />
          </div>
        ))}
      </section>

      {data.totals.views === 0 && data.totals.clicks === 0 ? (
        <Section>
          <p className="py-10 text-center text-ink-2">{t("empty")}</p>
        </Section>
      ) : (
        <>
          <Section title={t("chartTitle")}>
            <div className="flex items-center gap-4 text-sm text-ink-2">
              <Legend className="bg-info text-info" label={t("views")} />
              <Legend className="bg-positive text-positive" label={t("clicks")} />
            </div>
            <TrafficChart data={data.series} labels={{ views: t("views"), clicks: t("clicks") }} />
          </Section>

          <Section title={t("links")}>
            {data.links.every((l) => l.clicks === 0) ? (
              <p className="text-ink-2">{t("noClicks")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.links.map((link) => (
                  <li key={link.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1.5">
                    <span className="truncate font-medium">{link.title}</span>
                    <span className="font-mono text-sm tabular-nums">{format.number(link.clicks)}</span>
                    <span className="w-14 text-right font-mono text-sm text-ink-3 tabular-nums">{pct(link.ctr)}</span>
                    <Bar share={data.totals.clicks > 0 ? link.clicks / data.totals.clicks : 0} className="col-span-3 bg-positive" />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title={t("sources")}>
              <RowList rows={data.sources.map((r) => (r.key === "direct" ? { ...r, label: t("direct") } : r))} pct={pct} />
            </Section>
            <Section title={t("countries")}>
              <RowList rows={data.countries} pct={pct} empty={t("unknown")} />
            </Section>
            <Section title={t("devices")}>
              <RowList rows={data.devices.map((r) => ({ ...r, label: t(`deviceNames.${r.key as "MOBILE" | "DESKTOP" | "TABLET"}`) }))} pct={pct} />
              <h3 className="pt-2 text-[0.9375rem] font-semibold text-ink-2">{t("os")}</h3>
              <RowList rows={data.os} pct={pct} />
            </Section>
            <Section title={t("browsers")}>
              <RowList rows={data.browsers} pct={pct} />
            </Section>
          </div>
        </>
      )}

      <p className="text-center text-sm text-ink-3">
        {t("privacy")}{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
          {t("privacyLink")}
        </Link>
      </p>
    </div>
  );
}

/** Semantic neon: up is green, down is red, nothing to compare is neutral (DESIGN.md §3). */
function TrendBadge({ value, relative, empty, title, format }: { value: number | null; relative: boolean; empty: string; title: string; format: (n: number) => string }) {
  if (value === null) return <span className="text-xs text-ink-3">{empty}</span>;
  const flat = Math.abs(value) < (relative ? 0.005 : 0.0005);
  const Icon = flat ? Minus : value > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      title={title}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs tabular-nums",
        flat ? "text-ink-3" : value > 0 ? "neon text-positive" : "neon text-negative",
      )}
    >
      <Icon size={13} aria-hidden />
      {flat ? "0" : `${value > 0 ? "+" : "−"}${format(value)}`}
    </span>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className={cn("neon size-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function Bar({ share, className }: { share: number; className: string }) {
  return (
    <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-glass-strong">
      <span className={cn("block h-full rounded-full", className)} style={{ width: `${Math.max(share * 100, share > 0 ? 2 : 0)}%` }} />
    </span>
  );
}

function RowList({ rows, pct, empty }: { rows: Row[]; pct: (n: number) => string; empty?: string }) {
  if (rows.length === 0) return <p className="text-ink-3">{empty ?? "—"}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1.5">
          <span className="truncate">{row.label}</span>
          <span className="font-mono text-sm tabular-nums">{row.value}</span>
          <span className="w-14 text-right font-mono text-sm text-ink-3 tabular-nums">{pct(row.share)}</span>
          <Bar share={row.share} className="col-span-3 bg-info" />
        </li>
      ))}
    </ul>
  );
}
