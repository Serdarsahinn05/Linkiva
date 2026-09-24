"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { Segmented } from "@/components/ui/segmented";
import type { ThemePreference } from "@/lib/theme-preference";
import { setLocalePreference, setThemePreference } from "../actions";

export function Preferences({ theme, locale }: { theme: ThemePreference; locale: Locale }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [, startTransition] = useTransition();

  function applyTheme(next: ThemePreference) {
    // Apply instantly, then persist; the layout reads the cookie on the next request.
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    startTransition(() => setThemePreference(next));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium">{t("theme")}</span>
        <Segmented
          label={t("theme")}
          value={theme}
          onChange={applyTheme}
          options={[
            { value: "system", label: t("themes.system"), icon: <Monitor size={16} aria-hidden /> },
            { value: "light", label: t("themes.light"), icon: <Sun size={16} aria-hidden /> },
            { value: "dark", label: t("themes.dark"), icon: <Moon size={16} aria-hidden /> },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium">{t("language")}</span>
        <Segmented
          label={t("language")}
          value={locale}
          onChange={(next) =>
            startTransition(async () => {
              await setLocalePreference(next);
              router.refresh();
            })
          }
          options={[
            { value: "tr", label: t("languages.tr") },
            { value: "en", label: t("languages.en") },
          ]}
        />
      </div>
    </div>
  );
}
