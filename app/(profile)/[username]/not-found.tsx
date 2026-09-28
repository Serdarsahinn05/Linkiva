import { getTranslations } from "next-intl/server";
import { ProfileNotFound, type ProfileNotFoundCopy } from "@/features/profile/components/profile-not-found";
import type { Locale } from "@/i18n/config";

// Both languages are sent and the visitor's is picked in the browser: reading cookies here would make every profile
// page dynamic (docs/ARCHITECTURE.md §6).
async function copyFor(locale: Locale): Promise<ProfileNotFoundCopy> {
  const t = await getTranslations({ locale });
  return {
    title: t("profile.notFoundTitle"),
    claimable: t.raw("profile.claimable"),
    claim: t("profile.claim"),
    home: t("profile.home"),
    label: t("landing.usernameLabel"),
    placeholder: t("landing.usernamePlaceholder"),
  };
}

export default async function ProfileNotFoundPage() {
  const [tr, en] = await Promise.all([copyFor("tr"), copyFor("en")]);
  return <ProfileNotFound copy={{ tr, en }} />;
}
