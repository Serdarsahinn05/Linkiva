"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { ThemePreference } from "@/lib/theme-preference";
import { setLocalePreference, setThemePreference } from "../actions";

/** Glass segmented control: the selected option is a lifted glass pill. */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; icon?: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="glass-flat inline-flex rounded-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-200",
            value === option.value ? "bg-glass-strong text-ink shadow-[inset_0_1px_0_var(--c-glass-shine),0_2px_8px_-4px_rgb(0_0_0/0.3)]" : "text-ink-2 hover:text-ink",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
