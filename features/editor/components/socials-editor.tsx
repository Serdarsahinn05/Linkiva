"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { SOCIAL_ICONS } from "@/components/blocks/social-icon";
import { Input } from "@/components/ui/field";
import { SOCIAL_ORDER, SOCIAL_PLATFORMS, socialDisplay } from "@/lib/socials";
import type { EditorSocials } from "../types";

type Props = {
  socials: EditorSocials;
  /** Saves one platform; resolves with the stored value, or undefined when it was invalid. */
  onSave: (platform: SocialPlatform, value: string) => Promise<string | null | undefined>;
};

/** Social accounts, collapsed by default. Saved on blur; the stored form replaces what was typed. */
export function SocialsEditor({ socials, onSave }: Props) {
  const t = useTranslations("editor");
  const [drafts, setDrafts] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [invalid, setInvalid] = useState<Partial<Record<SocialPlatform, boolean>>>({});
  const count = Object.keys(socials).length;

  return (
    <details className="group rounded-[var(--radius-panel)] border border-hairline bg-panel">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          {t("socials")}
          {count > 0 && <span className="ml-2 font-normal text-ink-2">({count})</span>}
        </span>
        <ChevronDown size={18} strokeWidth={1.75} className="transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-col gap-3 border-t border-hairline p-4">
        <p className="text-sm text-ink-2">{t("socialsHint")}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SOCIAL_ORDER.map((platform) => {
            const Icon = SOCIAL_ICONS[platform];
            const label = SOCIAL_PLATFORMS[platform].label;
            const stored = socials[platform];
            const value = drafts[platform] ?? (stored ? socialDisplay(platform, stored) : "");
            return (
              <li key={platform} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon size={18} className="shrink-0 text-ink-2" aria-hidden />
                  <Input
                    aria-label={label}
                    placeholder={label}
                    value={value}
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={invalid[platform] || undefined}
                    onChange={(e) => setDrafts((d) => ({ ...d, [platform]: e.target.value }))}
                    onBlur={async () => {
                      const draft = drafts[platform];
                      if (draft === undefined) return;
                      const result = await onSave(platform, draft);
                      setInvalid((s) => ({ ...s, [platform]: result === undefined }));
                      if (result !== undefined) setDrafts((d) => ({ ...d, [platform]: undefined }));
                    }}
                  />
                </div>
                {invalid[platform] && <p className="pl-7 text-sm text-danger">{t("socialInvalid", { platform: label })}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
