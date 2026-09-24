"use client";

import { upload } from "@vercel/blob/client";
import { Check, CircleAlert, ImagePlus, Monitor, Moon, Sun } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { profileLabels } from "@/components/blocks/labels";
import { ProfileView } from "@/components/blocks/profile-view";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Section } from "@/features/dashboard/components/page";
import { useRegisterPreview } from "@/features/dashboard/components/preview-context";
import { SaveIndicator } from "@/features/editor/components/save-indicator";
import { useAutosave } from "@/features/editor/components/use-autosave";
import type { EditorBlock, EditorProfile, EditorSocials } from "@/features/editor/types";
import { cn } from "@/lib/cn";
import { liveBlocks } from "@/lib/schedule";
import { toWebp } from "@/lib/image";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, userUploadPrefix } from "@/lib/uploads";
import {
  appearanceSchema,
  BUTTON_KEYS,
  contrastRatio,
  FONT_KEYS,
  isThemeKey,
  resolveAppearance,
  THEME_KEYS,
  type AppearanceOverrides,
  type ThemeKey,
} from "@/themes";
import { updateAppearance } from "../actions";

const ACCENTS = ["#FF5A36", "#E0457B", "#2F6BFF", "#7CF5A8", "#F2B33D", "#3A2E26", "#111318"];
const LIGHT_BG = "#F4F4F8";
const DARK_BG = "#0B0D12";

type Props = {
  userId: string;
  uploadsEnabled: boolean;
  profile: EditorProfile;
  blocks: EditorBlock[];
  socials: EditorSocials;
};

export function AppearanceForm({ userId, uploadsEnabled, profile, blocks, socials }: Props) {
  const t = useTranslations();
  const { state: saveState, schedule } = useAutosave(400);
  const [theme, setTheme] = useState<ThemeKey>(isThemeKey(profile.theme) ? profile.theme : "cam");
  const [overrides, setOverrides] = useState<AppearanceOverrides>(appearanceSchema.safeParse(profile.appearance).data ?? {});
  const [showBranding, setShowBranding] = useState(profile.showBranding);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  const look = resolveAppearance(theme, overrides);

  function save(next: { theme?: ThemeKey; overrides?: AppearanceOverrides; showBranding?: boolean }) {
    const merged = { theme: next.theme ?? theme, appearance: next.overrides ?? overrides, showBranding: next.showBranding ?? showBranding };
    schedule("appearance", async () => (await updateAppearance(merged)).ok);
  }

  function pickTheme(key: ThemeKey) {
    // A new theme starts clean; only the owner's background image is kept.
    const next: AppearanceOverrides = overrides.backgroundUrl ? { backgroundUrl: overrides.backgroundUrl } : {};
    setTheme(key);
    setOverrides(next);
    save({ theme: key, overrides: next });
  }

  function override(patch: AppearanceOverrides) {
    const next = { ...overrides, ...patch };
    setOverrides(next);
    save({ overrides: next });
  }

  async function pickBackground(file: File) {
    setUploadError(undefined);
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return setUploadError(t("editor.avatar.wrongType"));
    if (file.size > AVATAR_MAX_BYTES * 3) return setUploadError(t("editor.avatar.tooBig"));
    setUploading(true);
    try {
      const blob = await upload(`${userUploadPrefix(userId)}background.webp`, await toWebp(file, 2048), {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "image/webp",
      });
      override({ backgroundUrl: blob.url });
    } catch {
      setUploadError(t("editor.avatar.failed"));
    } finally {
      setUploading(false);
    }
  }

  // Outline buttons put the accent directly on the page: warn when it would be hard to read.
  const lowContrast =
    look.accent !== null &&
    look.button === "outline" &&
    (look.mode === "light" ? [LIGHT_BG] : look.mode === "dark" ? [DARK_BG] : [LIGHT_BG, DARK_BG]).some((bg) => contrastRatio(look.accent!, bg) < 3);

  const preview = (
    <ProfileView
      profile={{
        ...profile,
        theme,
        appearance: overrides,
        showBranding,
        displayName: profile.displayName || null,
        bio: profile.bio || null,
        // Same rule as the public page: hidden and out-of-schedule blocks are not shown.
        blocks: liveBlocks(blocks.filter((b) => b.isVisible)),
        socials: Object.entries(socials).map(([platform, handle]) => ({ platform: platform as SocialPlatform, handle: handle ?? "" })),
      }}
      mode="preview"
      labels={profileLabels(t)}
    />
  );
  useRegisterPreview(preview);

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:py-10">
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader title={t("appearance.title")}>
          <SaveIndicator state={saveState} />
        </PageHeader>

        <Section title={t("appearance.theme")}>
          <div role="radiogroup" aria-label={t("appearance.theme")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEME_KEYS.map((key) => {
              const mini = resolveAppearance(key, {});
              const selected = key === theme;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickTheme(key)}
                  className={cn(
                    "group flex flex-col gap-2 rounded-[var(--radius-card)] p-1.5 text-left transition-shadow",
                    selected ? "shadow-[0_0_0_2px_var(--c-ink)]" : "hover:shadow-[0_0_0_1px_var(--c-glass-edge)]",
                  )}
                >
                  <ThemeSwatch look={mini} />
                  <span className="flex items-center justify-between px-1.5 pb-1">
                    <span>
                      <span className="block text-sm font-semibold">{t(`appearance.themes.${key}`)}</span>
                      <span className="block text-xs text-ink-3">{t(`appearance.themeHints.${key}`)}</span>
                    </span>
                    {selected && <Check size={16} strokeWidth={2} aria-hidden />}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t("appearance.customize")}>
          <Option label={t("appearance.mode")}>
            <Segmented
              label={t("appearance.mode")}
              value={look.mode}
              onChange={(mode) => override({ mode })}
              options={[
                { value: "system", label: t("appearance.modes.system"), icon: <Monitor size={16} aria-hidden /> },
                { value: "light", label: t("appearance.modes.light"), icon: <Sun size={16} aria-hidden /> },
                { value: "dark", label: t("appearance.modes.dark"), icon: <Moon size={16} aria-hidden /> },
              ]}
            />
          </Option>

          <Option label={t("appearance.font")}>
            <Segmented label={t("appearance.font")} value={look.font} onChange={(font) => override({ font })} options={FONT_KEYS.map((f) => ({ value: f, label: t(`appearance.fonts.${f}`) }))} />
          </Option>

          <Option label={t("appearance.button")}>
            <Segmented label={t("appearance.button")} value={look.button} onChange={(button) => override({ button })} options={BUTTON_KEYS.map((b) => ({ value: b, label: t(`appearance.buttons.${b}`) }))} />
          </Option>

          <Option label={t("appearance.accent")} hint={t("appearance.accentHint")}>
            <div role="radiogroup" aria-label={t("appearance.accent")} className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={look.accent === null}
                aria-label={t("appearance.accentNone")}
                title={t("appearance.accentNone")}
                onClick={() => override({ accent: null })}
                className={cn("glass-flat relative size-10 overflow-hidden rounded-full", look.accent === null && "shadow-[0_0_0_2px_var(--c-bg),0_0_0_4px_var(--c-ink)]")}
              >
                <span aria-hidden className="absolute top-1/2 left-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink-3" />
              </button>
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={look.accent?.toLowerCase() === color.toLowerCase()}
                  aria-label={color}
                  title={color}
                  onClick={() => override({ accent: color })}
                  style={{ background: color }}
                  className={cn(
                    "size-10 rounded-full border border-glass-edge",
                    look.accent?.toLowerCase() === color.toLowerCase() && "shadow-[0_0_0_2px_var(--c-bg),0_0_0_4px_var(--c-ink)]",
                  )}
                />
              ))}
              <label className="glass-flat relative flex h-10 cursor-pointer items-center gap-2 rounded-full pr-4 pl-1 text-sm">
                <input
                  type="color"
                  value={look.accent ?? "#888888"}
                  onChange={(e) => override({ accent: e.target.value.toUpperCase() })}
                  className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                />
                {t("appearance.accentCustom")}
              </label>
            </div>
            {lowContrast && (
              <p className="flex items-center gap-1.5 text-sm text-warning">
                <CircleAlert size={15} aria-hidden />
                {t("appearance.lowContrast")}
              </p>
            )}
          </Option>

          <Option label={t("appearance.background")}>
            {uploadsEnabled ? (
              <div className="flex flex-wrap items-center gap-3">
                {overrides.backgroundUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- owner upload thumbnail
                  <img src={overrides.backgroundUrl} alt="" className="h-16 w-12 rounded-[var(--radius-control)] border border-glass-edge object-cover" />
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept={AVATAR_TYPES.join(",")}
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void pickBackground(file);
                  }}
                />
                <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}>
                  {uploading ? <span className="dots" aria-hidden /> : <ImagePlus size={16} aria-hidden />}
                  {uploading ? t("editor.avatar.uploading") : t("appearance.backgroundChoose")}
                </button>
                {overrides.backgroundUrl && !uploading && (
                  <button type="button" onClick={() => override({ backgroundUrl: null })} className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
                    {t("appearance.backgroundRemove")}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-3">{t("appearance.backgroundDisabled")}</p>
            )}
            {uploadError && <Notice tone="error">{uploadError}</Notice>}
          </Option>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("appearance.branding")}</p>
              <p className="text-sm text-ink-3">{t("appearance.brandingHint")}</p>
            </div>
            <Switch
              checked={showBranding}
              label={t("appearance.branding")}
              onChange={(next) => {
                setShowBranding(next);
                save({ showBranding: next });
              }}
            />
          </div>
        </Section>
      </div>

      <aside aria-label={t("editor.previewTitle")} className="hidden lg:block">
        <div className="sticky top-6">
          <div className="glass rounded-[44px] p-2.5">
            <div className="h-[760px] overflow-y-auto overscroll-contain rounded-[36px] [scrollbar-width:none]">{preview}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Option({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-sm text-ink-3">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** A miniature of a theme, drawn with the real theme CSS. */
function ThemeSwatch({ look }: { look: ReturnType<typeof resolveAppearance> }) {
  return (
    <div
      aria-hidden
      className="profile-scene flex h-32 !min-h-0 shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-glass-edge px-4"
      data-theme={look.mode === "system" ? undefined : look.mode}
      data-scene={look.scene}
      data-font={look.font}
      data-button={look.button}
      style={(look.accent ? { "--p-accent": look.accent, "--p-accent-ink": "#fff" } : {}) as React.CSSProperties}
    >
      <div className="scene-light" />
      <span className="mb-1 text-[0.8125rem] font-semibold">Aa</span>
      <span className="p-btn !min-h-0 h-4 !rounded-[6px] !p-0" />
      <span className="p-btn !min-h-0 h-4 !rounded-[6px] !p-0" />
      <span className="p-btn !min-h-0 h-4 !rounded-[6px] !p-0 opacity-80" />
    </div>
  );
}
