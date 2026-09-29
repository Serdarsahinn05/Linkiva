import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSecurity } from "@/features/account/components/account-security";
import { LogoutButton } from "@/features/account/components/logout-button";
import { Preferences } from "@/features/account/components/preferences";
import { PublishingForm } from "@/features/account/components/publishing-form";
import { PageHeader, PageReveal, Section } from "@/features/dashboard/components/page";
import { DigestToggle } from "@/features/digest/components/digest-toggle";
import { DomainForm } from "@/features/domains/components/domain-form";
import { toDomainView } from "@/features/domains/view";
import { UsernameForm } from "@/features/profile/components/username-form";
import { getOwnProfile } from "@/features/profile/queries";
import { db } from "@/lib/db";
import { features } from "@/lib/features";
import { site } from "@/lib/site";
import { requireSession } from "@/lib/session";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme-preference";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settings"))("title") };
}

export default async function SettingsPage() {
  const session = await requireSession();
  const t = await getTranslations("settings");
  const tp = await getTranslations("publishing");
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
  const locale = await getLocale();

  const [profile, accounts, sessions, domain, user] = await Promise.all([
    getOwnProfile(session.user.id),
    db.account.findMany({ where: { userId: session.user.id }, select: { providerId: true, accountId: true } }),
    // Straight from the database: Better Auth's listSessions demands a session younger than a day ("not fresh"
    // otherwise), which broke this page for everyone who stayed signed in.
    db.session.findMany({
      where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      select: { token: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    features.domains ? db.customDomain.findFirst({ where: { profile: { userId: session.user.id } } }) : null,
    // From the database, not the session: the session cookie cache can be up to five minutes old.
    db.user.findUnique({ where: { id: session.user.id }, select: { twoFactorEnabled: true } }),
  ]);
  const td = await getTranslations("domain");

  return (
    <PageReveal>
      <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
        <PageHeader title={t("title")} />
        {profile && (
          <Section title={tp("title")}>
            <UsernameForm current={profile.username} host={site.host} />
            <PublishingForm initial={{ isPublished: profile.isPublished, seoTitle: profile.seoTitle ?? "", seoDescription: profile.seoDescription ?? "" }} />
          </Section>
        )}
        {profile && features.domains && (
          <Section title={td("title")}>
            <DomainForm initial={domain ? toDomainView(domain, null) : null} />
          </Section>
        )}
        <Section title={t("appearance")}>
          <Preferences theme={theme} locale={locale} />
        </Section>
        {profile && (
          <Section title={t("notifications")}>
            <DigestToggle initial={profile.weeklyDigest} />
          </Section>
        )}
        <AccountSecurity
          email={session.user.email}
          username={profile?.username ?? session.user.email}
          hasPassword={accounts.some((a) => a.providerId === "credential")}
          googleAccountId={accounts.find((a) => a.providerId === "google")?.accountId ?? null}
          googleEnabled={features.google}
          twoFactorEnabled={user?.twoFactorEnabled === true}
          sessions={sessions
            .map((s) => ({ token: s.token, userAgent: s.userAgent ?? null, createdAt: s.createdAt.toISOString(), current: s.token === session.session.token }))
            .sort((a, b) => Number(b.current) - Number(a.current))}
        />
        <Section title={t("account")}>
          <p className="text-ink-2">{t("signedInAs", { email: session.user.email })}</p>
          <div className="-ml-3">
            <LogoutButton />
          </div>
        </Section>
      </div>
    </PageReveal>
  );
}
