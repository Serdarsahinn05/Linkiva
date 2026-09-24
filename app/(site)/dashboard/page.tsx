import { getTranslations } from "next-intl/server";
import { Tape, Wordmark } from "@/components/ui/tape";
import { LogoutButton } from "@/features/account/components/logout-button";
import { getOwnProfile } from "@/features/profile/queries";
import { requireSession } from "@/lib/session";
import { profileDisplayUrl } from "@/lib/site";

// Phase 1 placeholder: proves the auth → onboarding → dashboard path. The editor lands in Phase 2.
export default async function DashboardPage() {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  const t = await getTranslations("dashboard");
  if (!profile) return null;

  return (
    <div className="pegboard min-h-dvh px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between">
        <Wordmark />
        <LogoutButton />
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">{t("welcome")}</h1>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-2">{t("liveAt")}</span>
          <Tape tone="red" size="lg" lang="en" translate="no" tiltSeed={profile.username} className="self-start">
            {profileDisplayUrl(profile.username)}
          </Tape>
        </div>
        <p className="text-ink-2">{t("comingSoon")}</p>
      </main>
    </div>
  );
}
