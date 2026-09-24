import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { LogoutButton } from "@/features/account/components/logout-button";
import { Preferences } from "@/features/account/components/preferences";
import { PublishingForm } from "@/features/account/components/publishing-form";
import { getOwnProfile } from "@/features/profile/queries";
import { PageHeader, Section } from "@/features/dashboard/components/page";
import { requireSession } from "@/lib/session";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme-preference";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settings"))("title") };
}

export default async function SettingsPage() {
  const session = await requireSession();
  const t = await getTranslations("settings");
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
  const locale = await getLocale();
  const profile = await getOwnProfile(session.user.id);
  const tp = await getTranslations("publishing");

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-6 sm:px-8 lg:py-10">
      <PageHeader title={t("title")} />
      {profile && (
        <Section title={tp("title")}>
          <PublishingForm initial={{ isPublished: profile.isPublished, seoTitle: profile.seoTitle ?? "", seoDescription: profile.seoDescription ?? "" }} />
        </Section>
      )}
      <Section title={t("appearance")}>
        <Preferences theme={theme} locale={locale} />
      </Section>
      <Section title={t("account")}>
        <p className="text-ink-2">{t("signedInAs", { email: session.user.email })}</p>
        <p className="text-sm text-ink-3">{t("more")}</p>
        <div className="-ml-3">
          <LogoutButton />
        </div>
      </Section>
    </div>
  );
}
