import { ArrowUpRight, User } from "lucide-react";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { SOCIAL_PLATFORMS, socialUrl } from "@/lib/socials";
import { parseBlock, type ParsedBlock } from "@/lib/validation/blocks";
import { SOCIAL_ICONS } from "./social-icon";

export type ProfileViewData = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  showBranding: boolean;
  blocks: { id: string; type: ParsedBlock["type"]; data: unknown; isHighlighted: boolean }[];
  socials: { platform: SocialPlatform; handle: string }[];
};

/**
 * The public profile, default "Cam" theme. Rendered by the public page *and* the editor preview, so the
 * preview is the real thing. mode="preview" renders links inert. Invalid/unfinished blocks are skipped.
 * The ambient light comes from the surrounding layout (or the preview frame).
 */
export function ProfileView({ profile, mode = "public", labels }: { profile: ProfileViewData; mode?: "public" | "preview"; labels: { madeWith: string } }) {
  const name = profile.displayName || profile.username;
  const blocks = profile.blocks
    .map((b) => ({ id: b.id, highlighted: b.isHighlighted, parsed: parseBlock(b.type, b.data) }))
    .filter((b): b is { id: string; highlighted: boolean; parsed: ParsedBlock } => b.parsed !== null);

  return (
    <div className="flex min-h-full flex-col items-center px-5 pt-14 pb-10">
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
              <BlockView id={id} block={parsed} highlighted={highlighted} mode={mode} />
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

const linkClass =
  "glass glass-interactive group flex min-h-[60px] w-full items-center justify-center rounded-[var(--radius-card)] px-12 py-3 text-center text-[0.9375rem] leading-snug font-medium [overflow-wrap:anywhere]";

function BlockView({ id, block, highlighted, mode }: { id: string; block: ParsedBlock; highlighted: boolean; mode: "public" | "preview" }) {
  switch (block.type) {
    case "LINK": {
      // Highlighted links carry a soft monochrome glow, not a colour (DESIGN.md §7).
      const className = cn(linkClass, highlighted && "bg-glass-strong shadow-[inset_0_1px_0_var(--c-glass-shine),0_0_0_1px_var(--c-glass-edge),0_0_32px_-8px_var(--c-ink)]");
      const arrow = (
        <ArrowUpRight
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="absolute right-5 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
        />
      );
      return mode === "public" ? (
        // Goes through /l/<id> so the click is counted server-side and works without JS.
        <a href={`/l/${id}`} className={className} rel="noopener">
          {block.data.title}
          {arrow}
        </a>
      ) : (
        <span className={cn(className, "cursor-default")}>
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
    default:
      // EMBED and EMAIL_CAPTURE render from Phase 3.
      return null;
  }
}
