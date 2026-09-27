import { ArrowUpRight, ChevronDown, Contact, FolderGit2, Link2, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { SiWhatsapp, SiYoutube } from "react-icons/si";
import type { BlockSize, SocialPlatform } from "@/prisma/generated/enums";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { SOCIAL_PLATFORMS, socialUrl } from "@/lib/socials";
import { effectiveSize, parseBlock, splitList, type BlockData, type ParsedBlock } from "@/lib/validation/blocks";
import { GROUND, inkOn, isPortfolioTheme, readableAccent, resolveAppearance, type ResolvedAppearance } from "@/themes";
import { parseEmbed } from "@/lib/embeds";
import { displayHost } from "@/lib/validation/url";
import { Countdown } from "./countdown";
import { EmbedCard } from "./embed-card";
import { ProjectCard, SectionHeading, Skills, Tags, Timeline } from "./portfolio";
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

  const look = resolveAppearance(profile.theme, profile.appearance);
  const portfolio = isPortfolioTheme(look.theme);
  const ctx: BlockContext = { profileId: mode === "public" ? profile.id : undefined, locale: profile.locale ?? "tr", timezone: profile.timezone, portfolio };
  const sceneStyle = sceneVars(look);
  const grid = look.layout === "grid";
  // Grid: 2 columns, 4 once the profile column is 35rem wide. A container query, so the editor's phone preview gets
  // the phone's columns. Visual order is DOM order (no grid-auto-flow: dense), for keyboard and screen readers.
  const listClass = grid ? "grid w-full grid-cols-2 gap-3 @min-[35rem]:grid-cols-4" : "flex w-full flex-col gap-3";
  const item = (b: RenderBlock) => (grid ? cn("flex justify-center", TILE_SPAN[b.size]) : "flex justify-center");

  const view = (b: RenderBlock) => {
    const loading = b.index < EAGER_BLOCKS ? "eager" : "lazy";
    return grid && b.size !== "WIDE" ? (
      <BlockTile id={b.id} block={b.parsed} size={b.size} highlighted={b.highlighted} mode={mode} labels={labels} loading={loading} />
    ) : (
      <BlockView id={b.id} block={b.parsed} highlighted={b.highlighted} mode={mode} labels={labels} ctx={ctx} loading={loading} />
    );
  };

  const renderEntry = (entry: Entry) => {
    if ("timeline" in entry) {
      return (
        <li key={entry.timeline[0]!.id} className="col-span-full flex w-full">
          <Timeline items={entry.timeline.map((b) => ({ id: b.id, data: b.parsed.data as BlockData["EXPERIENCE"] }))} labels={labels} locale={ctx.locale} />
        </li>
      );
    }
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
          <summary
            className={cn(
              "flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-full text-[0.8125rem] font-semibold text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden",
              portfolio ? "font-mono font-medium" : "mx-auto px-4",
            )}
          >
            {entry.header.text}
            <ChevronDown size={16} strokeWidth={1.75} aria-hidden className="transition-transform duration-150 group-open/fold:rotate-180" />
          </summary>
          <ul className={cn("mt-2", listClass)}>{entry.items.map(renderEntry)}</ul>
        </details>
      </li>
    );
  };

  const entries = groupBlocks(blocks);
  const avatar = (
    <div className={cn("glass shrink-0 overflow-hidden rounded-full p-1", portfolio ? "size-[72px] @min-[35rem]:size-[88px] @min-[56rem]:size-[104px]" : "mb-1 size-[104px]")}>
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads, already resized client-side
        <img src={profile.avatarUrl} alt="" className="size-full rounded-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center rounded-full bg-glass-strong text-ink-3">
          <User size={40} strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  );
  const socials = profile.socials.length > 0 && (
    <ul className={cn("flex flex-wrap gap-2", portfolio ? "justify-start" : "mt-2 justify-center")}>
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
  );
  const bio = profile.bio && (
    <p className={cn("text-[0.9375rem] leading-relaxed text-ink-2 text-pretty whitespace-pre-line", portfolio ? "max-w-[52ch]" : "max-w-[40ch]")}>{profile.bio}</p>
  );

  let body: React.ReactNode;
  if (portfolio) {
    // Portfolio (DESIGN.md §7): the links before the first section sit beside the name on a wide screen, and
    // neighbouring sections of only experience/skills/text share a row. Everything keeps the owner's block order.
    const { intro, sections } = portfolioSections(entries);
    body = (
      <>
        <header className="flex w-full flex-col gap-5 @min-[56rem]:grid @min-[56rem]:grid-cols-[minmax(0,1fr)_20rem] @min-[56rem]:items-end @min-[56rem]:gap-14">
          <div className="flex flex-col items-start gap-5 text-left">
            <div className="flex items-center gap-4 @min-[56rem]:gap-5">
              {avatar}
              <h1 className="min-w-0 text-[1.5rem] leading-tight font-semibold tracking-[-0.03em] text-balance [overflow-wrap:anywhere] @min-[35rem]:text-[1.75rem] @min-[56rem]:text-[2.5rem] @min-[56rem]:tracking-[-0.035em]">{name}</h1>
            </div>
            {bio}
            {socials}
          </div>
          {intro.length > 0 && <ul className="flex w-full flex-col gap-3">{intro.map(renderEntry)}</ul>}
        </header>
        <div className="mt-12 flex w-full flex-col gap-12">
          {pairNarrow(sections).map((row) =>
            row.length === 2 ? (
              <div key={row[0]!.key} className="grid w-full gap-12 @min-[56rem]:grid-cols-2 @min-[56rem]:gap-14">
                {row.map((section) => (
                  <PortfolioSection key={section.key} section={section} listClass={listClass} renderEntry={renderEntry} />
                ))}
              </div>
            ) : (
              <PortfolioSection key={row[0]!.key} section={row[0]!} listClass={listClass} renderEntry={renderEntry} />
            ),
          )}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <header className="flex flex-col items-center gap-3 text-center">
          {avatar}
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance">{name}</h1>
          {bio}
          {socials}
        </header>
        <ul className={cn("mt-10", listClass)}>{entries.map(renderEntry)}</ul>
      </>
    );
  }

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
      {/* A portfolio widens to 60rem on a large screen; its wide layout switches on at 56rem of room (container query). */}
      <div className={cn("@container flex w-full flex-1 flex-col items-center", portfolio ? "max-w-[60rem]" : "max-w-[35rem]")}>{body}</div>

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

type Section = { key: string; heading: string | null; entries: Entry[]; narrow: boolean };

/** A portfolio section: its heading (a Header block) and the blocks up to the next one. */
function PortfolioSection({ section, listClass, renderEntry }: { section: Section; listClass: string; renderEntry: (entry: Entry) => React.ReactNode }) {
  return (
    <section className="flex w-full min-w-0 flex-col gap-3.5">
      {section.heading && <SectionHeading text={section.heading} />}
      {section.entries.length > 0 && <ul className={section.narrow ? "flex w-full flex-col gap-5" : listClass}>{section.entries.map(renderEntry)}</ul>}
    </section>
  );
}

const NARROW_TYPES = new Set<ParsedBlock["type"]>(["EXPERIENCE", "SKILLS", "TEXT"]);

/** Leading plain link buttons (the "intro"), then sections split at every (non-folding) Header block. */
function portfolioSections(entries: Entry[]): { intro: Entry[]; sections: Section[] } {
  let i = 0;
  const intro: Entry[] = [];
  while (i < entries.length) {
    const entry = entries[i]!;
    if (!("parsed" in entry) || entry.parsed.type !== "LINK" || entry.parsed.data.card === "1") break;
    intro.push(entry);
    i++;
  }
  const sections: Section[] = [];
  let current: Section | null = null;
  for (; i < entries.length; i++) {
    const entry = entries[i]!;
    if ("parsed" in entry && entry.parsed.type === "HEADER") {
      current = { key: entry.id, heading: entry.parsed.data.text, entries: [], narrow: false };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { key: `lead-${"id" in entry ? entry.id : i}`, heading: null, entries: [], narrow: false };
      sections.push(current);
    }
    current.entries.push(entry);
  }
  for (const section of sections) {
    section.narrow = section.entries.length > 0 && section.entries.every((e) => "timeline" in e || ("parsed" in e && NARROW_TYPES.has(e.parsed.type)));
  }
  return { intro, sections };
}

/** Consecutive narrow sections go side by side in pairs on a wide screen; the rest take the full width. */
function pairNarrow(sections: Section[]): Section[][] {
  const rows: Section[][] = [];
  for (let i = 0; i < sections.length; i++) {
    const [a, b] = [sections[i]!, sections[i + 1]];
    if (a.narrow && b?.narrow) {
      rows.push([a, b]);
      i++;
    } else rows.push([a]);
  }
  return rows;
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

type BlockContext = { profileId?: string; locale: string; timezone?: string; portfolio: boolean };
type ParsedEntry = { id: string; highlighted: boolean; size: BlockSize; parsed: ParsedBlock };
type RenderBlock = ParsedEntry & { index: number };
type TimelineEntry = { timeline: RenderBlock[] };
type Fold = { header: { id: string; text: string }; items: Entry[] };
type Entry = RenderBlock | Fold | TimelineEntry;

/**
 * A foldable header takes the blocks after it, up to the next header or divider, under a <details>. Consecutive
 * experience blocks become one timeline (in or out of a fold).
 */
function groupBlocks(blocks: ParsedEntry[]): Entry[] {
  const out: Entry[] = [];
  let fold: Fold | null = null;
  blocks.forEach((b, index) => {
    const block = { ...b, index };
    if (b.parsed.type === "HEADER" || b.parsed.type === "DIVIDER") fold = null;
    if (b.parsed.type === "HEADER" && b.parsed.data.collapsible === "1") {
      fold = { header: { id: b.id, text: b.parsed.data.text }, items: [] };
      out.push(fold);
      return;
    }
    const list = fold ? fold.items : out;
    const last = list.at(-1);
    if (b.parsed.type === "EXPERIENCE" && last && "timeline" in last) last.timeline.push(block);
    else list.push(b.parsed.type === "EXPERIENCE" ? { timeline: [block] } : block);
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
    case "PROJECT":
      title = block.data.title;
      Icon = FolderGit2;
      detail = block.data.stars ? `★ ${block.data.stars}` : undefined;
      linked = Boolean(block.data.url ?? block.data.repo);
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

  const textTile = !photo && size === "LARGE" && block.type === "PROJECT" ? { desc: block.data.desc, tags: splitList(block.data.tags) } : null;
  const className = photo
    ? cn(
        "glass relative block size-full overflow-hidden rounded-[var(--radius-card)] p-1.5",
        linked && "glass-interactive",
        highlighted && "shadow-[0_0_0_1.5px_var(--c-ink)]",
      )
    : cn("p-btn p-tile glass-interactive group", textTile && "items-start p-5 @min-[56rem]:p-6");
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
  ) : textTile ? (
    // A large project without a picture: its words fill the tile instead of one small icon in a big empty box.
    <>
      <Icon size={28} strokeWidth={1.5} aria-hidden className="shrink-0" />
      <span className="mt-auto flex w-full flex-col gap-2 text-left">
        <span className="text-[1.125rem] leading-snug font-semibold text-balance @min-[56rem]:text-[1.375rem]">{title}</span>
        {textTile.desc && <span className="line-clamp-3 text-[0.875rem] leading-relaxed font-normal opacity-75">{textTile.desc}</span>}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Tags items={textTile.tags} />
          {detail && <span className="font-mono text-[0.75rem] tabular-nums opacity-70">{detail}</span>}
        </span>
      </span>
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
      if (ctx.portfolio) return <SectionHeading text={block.data.text} />;
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
    case "PROJECT":
      return <ProjectCard id={id} data={block.data} mode={mode} labels={labels} locale={ctx.locale} loading={loading} />;
    case "EXPERIENCE":
      return <Timeline items={[{ id, data: block.data }]} labels={labels} locale={ctx.locale} />;
    case "SKILLS":
      return <Skills data={block.data} align={ctx.portfolio ? "start" : "center"} />;
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
