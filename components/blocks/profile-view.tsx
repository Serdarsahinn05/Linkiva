import { ArrowUpRight, User } from "lucide-react";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { SOCIAL_PLATFORMS, socialUrl } from "@/lib/socials";
import { parseBlock, type ParsedBlock } from "@/lib/validation/blocks";
import { inkOn, resolveAppearance } from "@/themes";
import { parseEmbed } from "@/lib/embeds";
import { EmbedCard } from "./embed-card";
import type { ProfileLabels } from "./labels";
import { SOCIAL_ICONS } from "./social-icon";
import { SubscribeForm } from "./subscribe-form";

export type ProfileViewData = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  showBranding: boolean;
  theme: string;
  appearance: unknown;
  blocks: { id: string; type: ParsedBlock["type"]; data: unknown; isHighlighted: boolean }[];
  socials: { platform: SocialPlatform; handle: string }[];
};

/**
 * The public profile in its theme (themes/index.ts). Rendered by the public page *and* the editor preview, so the
 * preview is the real thing. mode="preview" renders links inert. Invalid/unfinished blocks are skipped.
 * The profile owns its whole scene (ground, light, font, button style, forced mode), so previews match.
 */
export function ProfileView({ profile, mode = "public", labels }: { profile: ProfileViewData; mode?: "public" | "preview"; labels: ProfileLabels }) {
  const name = profile.displayName || profile.username;
  const blocks = profile.blocks
    .map((b) => ({ id: b.id, highlighted: b.isHighlighted, parsed: parseBlock(b.type, b.data) }))
    .filter((b): b is { id: string; highlighted: boolean; parsed: ParsedBlock } => b.parsed !== null);

  const look = resolveAppearance(profile.theme, profile.appearance);
  const sceneStyle = (look.accent ? { "--p-accent": look.accent, "--p-accent-ink": inkOn(look.accent) } : {}) as React.CSSProperties;

  return (
    <div
      className="profile-scene flex min-h-full flex-col items-center px-5 pt-14 pb-10"
      data-theme={look.mode === "system" ? undefined : look.mode}
      data-scene={look.scene}
      data-font={look.font}
      data-button={look.button}
      style={sceneStyle}
    >
      {look.backgroundUrl ? (
        <div className="scene-image" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- owner upload, cover image */}
          <img src={look.backgroundUrl} alt="" />
        </div>
      ) : (
        <div className="scene-light" aria-hidden />
      )}
      <div className="flex w-full max-w-[35rem] flex-1 flex-col items-center">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="glass mb-1 size-[104px] overflow-hidden rounded-full p-1">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user uploads, already resized client-side
              <img src={profile.avatarUrl} alt="" className="size-full rounded-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full bg-glass-strong text-ink-3">
                <User size={40} strokeWidth={1.5} aria-hidden />
              </div>
            )}
          </div>
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance">{name}</h1>
          {profile.bio && <p className="max-w-[40ch] text-[0.9375rem] leading-relaxed text-ink-2 text-pretty whitespace-pre-line">{profile.bio}</p>}
          {profile.socials.length > 0 && (
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {profile.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.platform];
                const label = SOCIAL_PLATFORMS[s.platform].label;
                const className = "glass glass-interactive flex size-11 items-center justify-center rounded-full text-ink";
                return (
                  <li key={s.platform}>
                    {mode === "public" ? (
                      <a href={socialUrl(s.platform, s.handle)} rel="me noopener noreferrer" target="_blank" aria-label={label} className={className}>
                        <Icon size={18} aria-hidden />
                      </a>
                    ) : (
                      <span aria-label={label} className={className}>
                        <Icon size={18} aria-hidden />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </header>

        <ul className="mt-10 flex w-full flex-col gap-3">
          {blocks.map(({ id, highlighted, parsed }) => (
            <li key={id} className="flex justify-center">
              <BlockView id={id} block={parsed} highlighted={highlighted} mode={mode} labels={labels} />
            </li>
          ))}
        </ul>
      </div>

      {profile.showBranding && (
        <footer className="mt-14">
          <a
            href={site.url}
            tabIndex={mode === "preview" ? -1 : undefined}
            className="glass inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-ink shadow-[0_0_8px_var(--c-ink)]" />
            {labels.madeWith}{" "}
            <span lang="en" translate="no" className="font-semibold text-ink">
              Linkiva
            </span>
          </a>
        </footer>
      )}
    </div>
  );
}

const linkClass = "p-btn glass-interactive group";

function BlockView({ id, block, highlighted, mode, labels }: { id: string; block: ParsedBlock; highlighted: boolean; mode: "public" | "preview"; labels: ProfileLabels }) {
  switch (block.type) {
    case "LINK": {
      // Highlight styling depends on the button style (globals.css .p-btn[data-highlight]).
      const className = linkClass;
      const hl = highlighted ? "" : undefined;
      const arrow = (
        <ArrowUpRight
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="absolute right-5 opacity-45 transition-[transform,opacity] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-90"
        />
      );
      return mode === "public" ? (
        // Goes through /l/<id> so the click is counted server-side and works without JS.
        <a href={`/l/${id}`} className={className} data-highlight={hl} rel="noopener">
          {block.data.title}
          {arrow}
        </a>
      ) : (
        <span className={cn(className, "cursor-default")} data-highlight={hl}>
          {block.data.title}
          {arrow}
        </span>
      );
    }
    case "HEADER":
      return <h2 className="mt-5 mb-0.5 w-full text-center text-[0.8125rem] font-semibold text-ink-2">{block.data.text}</h2>;
    case "TEXT":
      return <p className="max-w-[48ch] py-1 text-center text-[0.9375rem] text-ink-2 text-pretty whitespace-pre-line">{block.data.text}</p>;
    case "DIVIDER":
      return <hr className="my-3 w-12 border-0 border-t border-glass-edge" />;
    case "EMBED": {
      const embed = parseEmbed(block.data.url);
      return embed ? <EmbedCard embed={embed} labels={{ play: labels.embedPlay, listen: labels.embedListen }} inert={mode === "preview"} /> : null;
    }
    case "EMAIL_CAPTURE":
      return <SubscribeForm blockId={id} title={block.data.title} labels={labels} inert={mode === "preview"} />;
  }
}
