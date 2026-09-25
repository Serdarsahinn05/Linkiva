import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSecurity } from "@/features/account/components/account-security";
import { LogoutButton } from "@/features/account/components/logout-button";
import { Preferences } from "@/features/account/components/preferences";
import { PublishingForm } from "@/features/account/components/publishing-form";
import { PageHeader, PageReveal, Section } from "@/features/dashboard/components/page";
import { getOwnProfile } from "@/features/profile/queries";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { features } from "@/lib/features";
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

  const [profile, accounts, sessions] = await Promise.all([
    getOwnProfile(session.user.id),
    db.account.findMany({ where: { userId: session.user.id }, select: { providerId: true, accountId: true } }),
    auth.api.listSessions({ headers: await headers() }),
  ]);

  return (
    <PageReveal>
      <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
        <PageHeader title={t("title")} />
        {profile && (
          <Section title={tp("title")}>
            <PublishingForm initial={{ isPublished: profile.isPublished, seoTitle: profile.seoTitle ?? "", seoDescription: profile.seoDescription ?? "" }} />
          </Section>
        )}
        <Section title={t("appearance")}>
          <Preferences theme={theme} locale={locale} />
        </Section>
        <AccountSecurity
          email={session.user.email}
          username={profile?.username ?? session.user.email}
          hasPassword={accounts.some((a) => a.providerId === "credential")}
          googleAccountId={accounts.find((a) => a.providerId === "google")?.accountId ?? null}
          googleEnabled={features.google}
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
