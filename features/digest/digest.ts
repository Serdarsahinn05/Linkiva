import { computeInsights } from "@/features/analytics/insights";
import { getAnalytics, getAnalyticsExtras } from "@/features/analytics/queries";
import { db } from "@/lib/db";
import { sendBatch, type OutgoingMail } from "@/lib/mail/send";
import { renderDigest, type DigestMail } from "@/lib/mail/templates";
import { asLocale, insightText, weekStart } from "./format";
import { unsubscribeOneClickUrl, unsubscribePageUrl } from "./token";

/** One run sends at most one Resend batch; the rest go out on the next daily run of the same week. */
export const DIGEST_BATCH = 100;
/** Profiles summarised in parallel (each summary is a dozen aggregate queries). */
const PARALLEL = 5;

/** Last 7 days of one profile, or null when nobody visited (no mail is sent then). */
export async function buildDigest(profile: { id: string; timezone: string; locale: string }): Promise<DigestMail | null> {
  const locale = asLocale(profile.locale);
  const [data, extras] = await Promise.all([getAnalytics(profile, "7d", locale), getAnalyticsExtras(profile, "7d")]);
  if (data.totals.views === 0) return null;
  const insight = computeInsights({
    totalViews: data.totals.views,
    sources: data.sources,
    links: data.links,
    sourceLinks: extras.sourceLinks,
    heatmap: extras.heatmap,
    previousLinkClicks: extras.previousLinkClicks,
  })[0];
  return {
    views: data.totals.views,
    clicks: data.totals.clicks,
    viewsTrend: data.trend.views,
    clicksTrend: data.trend.clicks,
    topLinks: data.links.filter((l) => l.clicks > 0).slice(0, 3),
    insight: insight ? insightText(insight, locale) : null,
    unsubscribeUrl: unsubscribePageUrl(profile.id),
  };
}

export type DigestRun = { claimed: number; sent: number; noVisits: number };

/**
 * The weekly summary, called by the daily cron. Each profile is claimed with a conditional update before anything
 * is computed, so two overlapping runs never mail the same person twice in a week. A profile without visits is
 * claimed too (no mail, and no recomputing every day). When the batch is refused, the claims of the unsent mails are
 * released for the next run.
 */
export async function runWeeklyDigest({ now = new Date(), profileIds }: { now?: Date; profileIds?: string[] } = {}): Promise<DigestRun> {
  const since = weekStart(now);
  const due = { OR: [{ digestSentAt: null }, { digestSentAt: { lt: since } }] };
  const candidates = await db.profile.findMany({
    // profileIds narrows a run to some profiles (integration tests share the local database).
    where: { weeklyDigest: true, user: { emailVerified: true, deletion: { is: null } }, ...due, ...(profileIds ? { id: { in: profileIds } } : {}) },
    select: { id: true, timezone: true, locale: true, digestSentAt: true, user: { select: { email: true } } },
    orderBy: { digestSentAt: { sort: "asc", nulls: "first" } },
    take: DIGEST_BATCH,
  });

  const run: DigestRun = { claimed: 0, sent: 0, noVisits: 0 };
  const outgoing: { profileId: string; previous: Date | null; mail: OutgoingMail }[] = [];
  for (let i = 0; i < candidates.length; i += PARALLEL) {
    await Promise.all(
      candidates.slice(i, i + PARALLEL).map(async (profile) => {
        const { count } = await db.profile.updateMany({ where: { id: profile.id, weeklyDigest: true, ...due }, data: { digestSentAt: now } });
        if (count === 0) return; // another run got here first, or the owner just opted out
        run.claimed++;
        const digest = await buildDigest(profile);
        if (!digest) {
          run.noVisits++;
          return;
        }
        const mail = renderDigest(asLocale(profile.locale), digest);
        outgoing.push({
          profileId: profile.id,
          previous: profile.digestSentAt,
          mail: {
            ...mail,
            to: profile.user.email,
            headers: { "List-Unsubscribe": `<${unsubscribeOneClickUrl(profile.id)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
          },
        });
      }),
    );
  }

  try {
    await sendBatch("digest", outgoing.map((o) => o.mail));
  } catch (error) {
    await Promise.all(outgoing.map((o) => db.profile.updateMany({ where: { id: o.profileId, digestSentAt: now }, data: { digestSentAt: o.previous } })));
    throw error;
  }
  run.sent = outgoing.length;
  return run;
}
