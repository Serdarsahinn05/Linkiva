import { User } from "lucide-react";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { Tape, tiltFor } from "@/components/ui/tape";
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
 * The public profile, "Etiket" theme. Rendered by the public page *and* the editor preview, so the
 * preview is the real thing. mode="preview" renders links inert. Invalid/unfinished blocks are skipped.
 */
export function ProfileView({ profile, mode = "public", labels }: { profile: ProfileViewData; mode?: "public" | "preview"; labels: { madeWith: string } }) {
  const name = profile.displayName || profile.username;
  const blocks = profile.blocks
    .map((b) => ({ id: b.id, highlighted: b.isHighlighted, parsed: parseBlock(b.type, b.data) }))
    .filter((b): b is { id: string; highlighted: boolean; parsed: ParsedBlock } => b.parsed !== null);

  return (
    <div className="pegboard flex min-h-full flex-col items-center px-4 pt-12 pb-10">
      <div className="flex w-full max-w-[34rem] flex-1 flex-col items-center">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="size-24 overflow-hidden rounded-full border border-hairline bg-panel">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user uploads, already resized client-side
              <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-ink-3">
                <User size={40} strokeWidth={1.5} aria-hidden />
              </div>
            )}
          </div>
          <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.02em] text-balance [font-variation-settings:'wdth'_88]">{name}</h1>
          {profile.bio && <p className="max-w-[40ch] text-ink-2 text-pretty whitespace-pre-line">{profile.bio}</p>}
          {profile.socials.length > 0 && (
            <ul className="mt-1 flex flex-wrap justify-center gap-1">
              {profile.socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.platform];
                const label = SOCIAL_PLATFORMS[s.platform].label;
                return (
                  <li key={s.platform}>
                    {mode === "public" ? (
                      <a
                        href={socialUrl(s.platform, s.handle)}
                        rel="me noopener noreferrer"
                        target="_blank"
                        aria-label={label}
                        className="flex size-11 items-center justify-center rounded-[var(--radius-panel)] text-ink transition-colors hover:bg-panel"
                      >
                        <Icon size={20} aria-hidden />
                      </a>
                    ) : (
                      <span aria-label={label} className="flex size-11 items-center justify-center text-ink">
                        <Icon size={20} aria-hidden />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </header>

        <ul className="mt-8 flex w-full flex-col gap-3.5">
          {blocks.map(({ id, highlighted, parsed }) => (
            <li key={id} className="flex justify-center">
              <BlockView id={id} block={parsed} highlighted={highlighted} mode={mode} />
            </li>
          ))}
        </ul>
      </div>

      {profile.showBranding && (
        <footer className="mt-14">
          <a href={site.url} className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink" tabIndex={mode === "preview" ? -1 : undefined}>
            {labels.madeWith}
            <Tape size="sm" lang="en" translate="no">
              Linkiva
            </Tape>
          </a>
        </footer>
      )}
    </div>
  );
}

const linkTape =
  "tape tape-type w-full min-h-13 justify-center px-6 py-3 text-center text-[0.9375rem] leading-snug [overflow-wrap:anywhere] whitespace-normal";

function BlockView({ id, block, highlighted, mode }: { id: string; block: ParsedBlock; highlighted: boolean; mode: "public" | "preview" }) {
  const style = { "--tilt": tiltFor(id) } as React.CSSProperties;

  switch (block.type) {
    case "LINK":
      return mode === "public" ? (
        // Goes through /l/<id> so the click is counted server-side and works without JS.
        <a href={`/l/${id}`} className={linkTape} data-tone={highlighted ? "yellow" : undefined} style={style} rel="noopener">
          {block.data.title}
        </a>
      ) : (
        <span className={cn(linkTape, "cursor-default")} data-tone={highlighted ? "yellow" : undefined} style={style}>
          {block.data.title}
        </span>
      );
    case "HEADER":
      return (
        <h2 className="mt-4 w-full text-center">
          <Tape tone="red" size="md" tiltSeed={id} className="max-w-full whitespace-normal">
            {block.data.text}
          </Tape>
        </h2>
      );
    case "TEXT":
      return <p className="max-w-[48ch] py-1 text-center text-ink-2 text-pretty whitespace-pre-line">{block.data.text}</p>;
    case "DIVIDER":
      return <hr className="my-2 w-16 border-0 border-t border-hairline" />;
    default:
      // EMBED and EMAIL_CAPTURE render from Phase 3.
      return null;
  }
}
