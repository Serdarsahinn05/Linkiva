import { ArrowUpRight, ChevronDown, Contact, Link2, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { SiWhatsapp, SiYoutube } from "react-icons/si";
import type { BlockSize, SocialPlatform } from "@/prisma/generated/enums";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { SOCIAL_PLATFORMS, socialUrl } from "@/lib/socials";
import { effectiveSize, parseBlock, type BlockData, type ParsedBlock } from "@/lib/validation/blocks";
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
  /** size: tile size in the grid layout (absent = full row). */
  blocks: { id: string; type: ParsedBlock["type"]; data: unknown; isHighlighted: boolean; size?: BlockSize }[];
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
    .map((b) => ({ id: b.id, highlighted: b.isHighlighted, size: effectiveSize(b.type, b.size), parsed: parseBlock(b.type, b.data) }))
    .filter((b): b is ParsedEntry => b.parsed !== null);

  const ctx: BlockContext = { profileId: mode === "public" ? profile.id : undefined, locale: profile.locale ?? "tr", timezone: profile.timezone };
  const look = resolveAppearance(profile.theme, profile.appearance);
  const sceneStyle = sceneVars(look);
  const grid = look.layout === "grid";
  // Grid: 2 columns, 4 once the profile column is 35rem wide. A container query, so the editor's phone preview gets
  // the phone's columns. Visual order is DOM order (no grid-auto-flow: dense), for keyboard and screen readers.
  const listClass = grid ? "grid w-full grid-cols-2 gap-3 @min-[35rem]:grid-cols-4" : "flex w-full flex-col gap-3";
  const item = (b: RenderBlock) => (grid ? cn("flex justify-center", TILE_SPAN[b.size]) : "flex justify-center");

  return (
    <div
      className="profile-scene flex min-h-full flex-1 flex-col items-center px-5 pt-14 pb-10"
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
      <div className="@container flex w-full max-w-[35rem] flex-1 flex-col items-center">
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

        <ul className={cn("mt-10", listClass)}>
          {groupBlocks(blocks).map((entry) => {
            const view = (b: RenderBlock) => {
              const loading = b.index < EAGER_BLOCKS ? "eager" : "lazy";
              return grid && b.size !== "WIDE" ? (
                <BlockTile id={b.id} block={b.parsed} size={b.size} highlighted={b.highlighted} mode={mode} labels={labels} loading={loading} />
              ) : (
                <BlockView id={b.id} block={b.parsed} highlighted={b.highlighted} mode={mode} labels={labels} ctx={ctx} loading={loading} />
              );
            };
            if (!("items" in entry)) {
              return (
                <li key={entry.id} className={item(entry)}>
                  {view(entry)}
                </li>
              );
            }
            // A foldable header: native <details>, so it opens without JS and with the keyboard.
            return (
              <li key={entry.header.id} className="col-span-full w-full">
                <details className="group/fold w-full">
                  <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-semibold text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                    {entry.header.text}
                    <ChevronDown size={16} strokeWidth={1.75} aria-hidden className="transition-transform duration-150 group-open/fold:rotate-180" />
                  </summary>
                  <ul className={cn("mt-2", listClass)}>
                    {entry.items.map((b) => (
                      <li key={b.id} className={item(b)}>
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
type ParsedEntry = { id: string; highlighted: boolean; size: BlockSize; parsed: ParsedBlock };
type RenderBlock = ParsedEntry & { index: number };
type Fold = { header: { id: string; text: string }; items: RenderBlock[] };

/** A foldable header takes the blocks after it, up to the next header or divider, under a <details>. */
function groupBlocks(blocks: ParsedEntry[]): (RenderBlock | Fold)[] {
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

/** Grid cell per tile size: SMALL 1×1, LARGE 2×2 (both square), WIDE a full row. */
const TILE_SPAN: Record<BlockSize, string> = {
  SMALL: "aspect-square",
  WIDE: "col-span-full",
  LARGE: "col-span-2 row-span-2 aspect-square",
};

/**
 * A block drawn as a grid tile (only the types and sizes lib/validation/blocks.ts → allowedSizes permits). SMALL: the
 * type's icon over a one-line title (an Image block: the photo). LARGE: the block's image filling the tile, the title on
 * a glass strip over it; without an image, a bigger icon tile. A truncated title stays whole in the DOM and in `title`.
 */
function BlockTile({
  id,
  block,
  size,
  highlighted,
  mode,
  labels,
  loading,
}: {
  id: string;
  block: ParsedBlock;
  size: BlockSize;
  highlighted: boolean;
  mode: "public" | "preview";
  labels: ProfileLabels;
  loading: ImageLoading;
}) {
  let title: string;
  let image: { src: string; alt: string } | null = null;
  let Icon: LucideIcon | typeof SiWhatsapp = Link2;
  let linked = true;
  let detail: string | undefined;
  switch (block.type) {
    case "LINK":
      title = block.data.title;
      if (block.data.img) image = { src: block.data.img, alt: "" };
      break;
    case "PRODUCT":
      title = block.data.title;
      Icon = ShoppingBag;
      detail = block.data.price;
      if (block.data.img) image = { src: block.data.img, alt: "" };
      break;
    case "IMAGE":
      title = block.data.title ?? "";
      image = { src: block.data.src, alt: block.data.alt ?? "" };
      linked = Boolean(block.data.url);
      break;
    case "WHATSAPP":
      title = block.data.title || labels.whatsappDefault;
      Icon = SiWhatsapp;
      break;
    case "CONTACT":
      title = labels.contactAdd;
      Icon = Contact;
      break;
    default:
      return null;
  }
  const sponsored = block.type === "PRODUCT" && block.data.sponsored === "1";
  // Paid content keeps its label on every size (Reklam Kurulu guidance, like the product card).
  const badge = sponsored && <span className="glass absolute top-2.5 right-2.5 z-10 rounded-full px-2 py-0.5 text-xs font-normal text-ink-2">{labels.sponsored}</span>;
  const photo = size === "LARGE" || block.type === "IMAGE" ? image : null;

  const className = photo
    ? cn(
        "glass relative block size-full overflow-hidden rounded-[var(--radius-card)] p-1.5",
        linked && "glass-interactive",
        highlighted && "shadow-[0_0_0_1.5px_var(--c-ink)]",
      )
    : "p-btn p-tile glass-interactive group";
  const body = photo ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- owner upload or card image copied to our Blob store */}
      <img src={photo.src} alt={photo.alt} loading={loading} decoding="async" className="size-full rounded-[14px] bg-glass-strong object-cover" />
      {badge}
      {size === "LARGE" && (title || detail) && (
        <span className="absolute inset-x-3 bottom-3 flex items-baseline gap-2 rounded-[var(--radius-control)] bg-glass-strong px-3 py-2 text-left shadow-[inset_0_1px_0_var(--c-glass-shine)] backdrop-blur-xl">
          <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium">{title}</span>
          {detail && <span className="shrink-0 font-mono text-[0.875rem] font-medium tabular-nums">{detail}</span>}
        </span>
      )}
    </>
  ) : (
    <>
      {badge}
      <Icon size={size === "LARGE" ? 40 : 28} strokeWidth={1.5} aria-hidden className="shrink-0" />
      <span className="w-full truncate">{title}</span>
      {detail && <span className="font-mono text-[0.8125rem] tabular-nums opacity-70">{detail}</span>}
    </>
  );

  if (!linked) return <div className={className}>{body}</div>;
  const hl = highlighted ? "" : undefined;
  // A small photo tile has no visible text: its name is the photo's alt text, else its caption.
  const label = photo && size === "SMALL" ? photo.alt || title || undefined : undefined;
  return mode === "public" ? (
    <a
      href={`/l/${id}`}
      className={className}
      data-highlight={hl}
      aria-label={label}
      title={title || undefined}
      rel={sponsored ? "noopener sponsored" : "noopener"}
      download={block.type === "CONTACT" || undefined}
    >
      {body}
    </a>
  ) : (
    <span className={cn(className, "cursor-default")} data-highlight={hl}>
      {body}
    </span>
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
      if (embed) return <EmbedCard embed={embed} labels={{ play: labels.embedPlay, listen: labels.embedListen }} inert={mode === "preview"} />;
      // "Latest video": the public page swaps in the newest video (features/profile/latest-video.ts); the preview says so.
      if (mode === "preview" && block.data.latest === "1") {
        return (
          <span className="p-btn cursor-default gap-3">
            <SiYoutube size={20} aria-hidden />
            {labels.embedLatest}
          </span>
        );
      }
      return null;
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
