import { ArrowUpRight, ChevronDown, Contact, User } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { SOCIAL_PLATFORMS, socialUrl } from "@/lib/socials";
import { parseBlock, type BlockData, type ParsedBlock } from "@/lib/validation/blocks";
import { GROUND, inkOn, readableAccent, resolveAppearance, type ResolvedAppearance } from "@/themes";
import { parseEmbed } from "@/lib/embeds";
import { displayHost } from "@/lib/validation/url";
import { Countdown } from "./countdown";
import { EmbedCard } from "./embed-card";
import type { ProfileLabels } from "./labels";
import { SOCIAL_ICONS } from "./social-icon";
import { SubscribeForm } from "./subscribe-form";
import { SupportCard } from "./support-card";

export type ProfileViewData = {
  /** Present on the public page (copy events are counted against it); absent in the editor preview. */
  id?: string;
  /** For dates shown on the page (countdown): the profile's own settings. */
  locale?: string;
  timezone?: string;
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

  const ctx: BlockContext = { profileId: mode === "public" ? profile.id : undefined, locale: profile.locale ?? "tr", timezone: profile.timezone };
  const look = resolveAppearance(profile.theme, profile.appearance);
  const sceneStyle = sceneVars(look);

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
          {groupBlocks(blocks).map((entry) => {
            const view = (b: RenderBlock) => (
              <BlockView id={b.id} block={b.parsed} highlighted={b.highlighted} mode={mode} labels={labels} ctx={ctx} loading={b.index < EAGER_BLOCKS ? "eager" : "lazy"} />
            );
            if (!("items" in entry)) {
              return (
                <li key={entry.id} className="flex justify-center">
                  {view(entry)}
                </li>
              );
            }
            // A foldable header: native <details>, so it opens without JS and with the keyboard.
            return (
              <li key={entry.header.id} className="w-full">
                <details className="group/fold w-full">
                  <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-semibold text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                    {entry.header.text}
                    <ChevronDown size={16} strokeWidth={1.75} aria-hidden className="transition-transform duration-150 group-open/fold:rotate-180" />
                  </summary>
                  <ul className="mt-2 flex w-full flex-col gap-3">
                    {entry.items.map((b) => (
                      <li key={b.id} className="flex justify-center">
                        {view(b)}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          })}
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

/** The scene's CSS variables: accent (with a readable tone per ground) and the background dim. */
function sceneVars(look: ResolvedAppearance): React.CSSProperties {
  const vars: Record<string, string> = {};
  if (look.accent) {
    const light = readableAccent(look.accent, GROUND.light);
    const dark = readableAccent(look.accent, GROUND.dark);
    Object.assign(vars, {
      "--p-accent": look.accent,
      "--p-accent-ink": inkOn(look.accent),
      "--p-fg-light": light,
      "--p-fg-ink-light": inkOn(light),
      "--p-fg-dark": dark,
      "--p-fg-ink-dark": inkOn(dark),
    });
  }
  if (look.backgroundUrl) vars["--p-dim"] = `${look.backgroundDim}%`;
  return vars as React.CSSProperties;
}

const linkClass = "p-btn glass-interactive group";

type BlockContext = { profileId?: string; locale: string; timezone?: string };
type RenderBlock = { id: string; highlighted: boolean; parsed: ParsedBlock; index: number };
type Fold = { header: { id: string; text: string }; items: RenderBlock[] };

/** A foldable header takes the blocks after it, up to the next header or divider, under a <details>. */
function groupBlocks(blocks: { id: string; highlighted: boolean; parsed: ParsedBlock }[]): (RenderBlock | Fold)[] {
  const out: (RenderBlock | Fold)[] = [];
  let fold: Fold | null = null;
  blocks.forEach((b, index) => {
    const block = { ...b, index };
    if (b.parsed.type === "HEADER" || b.parsed.type === "DIVIDER") fold = null;
    if (b.parsed.type === "HEADER" && b.parsed.data.collapsible === "1") {
      fold = { header: { id: b.id, text: b.parsed.data.text }, items: [] };
      out.push(fold);
    } else if (fold) fold.items.push(block);
    else out.push(block);
  });
  return out;
}

/** A button-shaped link through /l/<id> (counted, works without JS); inert in the editor preview. */
function LinkButton({ id, mode, children, download }: { id: string; mode: "public" | "preview"; children: React.ReactNode; download?: boolean }) {
  return mode === "public" ? (
    <a href={`/l/${id}`} className={linkClass} rel="noopener" download={download || undefined}>
      {children}
    </a>
  ) : (
    <span className={cn(linkClass, "cursor-default")}>{children}</span>
  );
}

/** Product or affiliate card: image, name, price in figures, the shop's host, and a plain "Sponsored" tag when paid. */
function ProductCard({ id, data, mode, loading, sponsoredLabel }: { id: string; data: BlockData["PRODUCT"]; mode: "public" | "preview"; loading: ImageLoading; sponsoredLabel: string }) {
  const body = (
    <>
      {data.img && (
        // eslint-disable-next-line @next/next/no-img-element -- copied to our Blob store when the card was made
        <img src={data.img} alt="" loading={loading} decoding="async" className="size-20 shrink-0 rounded-[var(--radius-control)] bg-glass-strong object-cover" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1 py-1 text-left">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 font-medium text-balance">{data.title}</span>
          {data.sponsored === "1" && <span className="shrink-0 rounded-full border border-glass-edge px-2 py-0.5 text-xs text-ink-2">{sponsoredLabel}</span>}
        </span>
        {data.desc && <span className="line-clamp-2 text-[0.875rem] text-ink-2">{data.desc}</span>}
        <span className="flex items-center gap-2 text-[0.8125rem] text-ink-3">
          {data.price && <span className="font-mono text-[0.9375rem] font-medium text-ink tabular-nums">{data.price}</span>}
          {displayHost(data.url)}
          <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden />
        </span>
      </span>
    </>
  );
  const className = "glass glass-interactive group flex w-full items-center gap-3 rounded-[var(--radius-card)] p-2";
  return mode === "public" ? (
    <a href={`/l/${id}`} className={className} rel="noopener sponsored">
      {body}
    </a>
  ) : (
    <span className={cn(className, "cursor-default")}>{body}</span>
  );
}

/** Images in the first blocks are usually on the first screen (often the LCP element): load them with the page. */
const EAGER_BLOCKS = 3;
type ImageLoading = "eager" | "lazy";

/** A link shown as a preview card: the page's image, title, description and host (read once by the owner). */
function LinkCard({ id, data, highlighted, mode, loading }: { id: string; data: BlockData["LINK"]; highlighted: boolean; mode: "public" | "preview"; loading: ImageLoading }) {
  const body = (
    <>
      {data.img && (
        // eslint-disable-next-line @next/next/no-img-element -- copied to our Blob store when the card was made
        <img src={data.img} alt="" loading={loading} decoding="async" className="aspect-[1.91/1] w-full rounded-[14px] bg-glass-strong object-cover" />
      )}
      <span className="flex flex-col gap-1 px-2.5 pt-2.5 pb-2 text-left">
        <span className="font-medium text-balance">{data.title}</span>
        {data.desc && <span className="line-clamp-2 text-[0.875rem] text-ink-2">{data.desc}</span>}
        <span className="flex items-center gap-1 text-[0.8125rem] text-ink-3">
          {displayHost(data.url)}
          <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </span>
    </>
  );
  const className = cn(
    "glass glass-interactive group flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] p-1.5",
    highlighted && "shadow-[0_0_0_1.5px_var(--c-ink)]",
  );
  return mode === "public" ? (
    <a href={`/l/${id}`} className={className} rel="noopener">
      {body}
    </a>
  ) : (
    <span className={cn(className, "cursor-default")}>{body}</span>
  );
}

function BlockView({
  id,
  block,
  highlighted,
  mode,
  labels,
  ctx,
  loading,
}: {
  id: string;
  block: ParsedBlock;
  highlighted: boolean;
  mode: "public" | "preview";
  labels: ProfileLabels;
  ctx: BlockContext;
  loading: ImageLoading;
}) {
  switch (block.type) {
    case "LINK": {
      if (block.data.card === "1") return <LinkCard id={id} data={block.data} highlighted={highlighted} mode={mode} loading={loading} />;
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
    case "IMAGE": {
      const { src, alt, title, url, w, h } = block.data;
      const frame = "glass block w-full overflow-hidden rounded-[var(--radius-card)] p-1.5";
      const image = (
        // eslint-disable-next-line @next/next/no-img-element -- owner upload, resized to WebP before upload
        <img src={src} alt={alt ?? ""} width={w} height={h} loading={loading} decoding="async" className="h-auto w-full rounded-[14px] bg-glass-strong object-cover" />
      );
      return (
        <figure className="flex w-full flex-col items-center gap-2">
          {!url ? (
            <div className={frame}>{image}</div>
          ) : mode === "public" ? (
            // Through /l/<id> like a link, so taps are counted.
            <a href={`/l/${id}`} className={cn(frame, "glass-interactive")} rel="noopener">
              {image}
            </a>
          ) : (
            <span className={frame}>{image}</span>
          )}
          {title && <figcaption className="max-w-[48ch] px-2 text-center text-[0.875rem] text-ink-2 text-pretty">{title}</figcaption>}
        </figure>
      );
    }
    case "SUPPORT": {
      const { name, iban, note, url, urlLabel } = block.data;
      return (
        <div className="glass flex w-full flex-col gap-3 rounded-[var(--radius-card)] p-4">
          <SupportCard blockId={id} profileId={ctx.profileId} name={name} iban={iban} note={note} inert={mode === "preview"} labels={labels} />
          {url && (
            <LinkButton id={id} mode={mode}>
              {urlLabel || labels.supportLink}
            </LinkButton>
          )}
        </div>
      );
    }
    case "WHATSAPP":
      return (
        <LinkButton id={id} mode={mode}>
          <SiWhatsapp size={18} aria-hidden className="absolute left-5" />
          {block.data.title || labels.whatsappDefault}
        </LinkButton>
      );
    case "CONTACT":
      return (
        <LinkButton id={id} mode={mode} download>
          <Contact size={18} strokeWidth={1.75} aria-hidden className="absolute left-5" />
          <span className="flex flex-col items-center leading-tight">
            {labels.contactAdd}
            <span className="text-[0.8125rem] font-normal opacity-70">{[block.data.name, block.data.title].filter(Boolean).join(" · ")}</span>
          </span>
        </LinkButton>
      );
    case "PRODUCT":
      return <ProductCard id={id} data={block.data} mode={mode} loading={loading} sponsoredLabel={labels.sponsored} />;
    case "COUNTDOWN":
      return (
        <Countdown
          title={block.data.title}
          target={block.data.target}
          after={block.data.after}
          afterText={block.data.afterText}
          locale={ctx.locale}
          timeZone={ctx.timezone}
          labels={labels}
        />
      );
  }
}
