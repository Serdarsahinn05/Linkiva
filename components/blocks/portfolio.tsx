import { FolderGit2, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { splitList, type BlockData } from "@/lib/validation/blocks";
import { displayHost } from "@/lib/validation/url";
import type { ProfileLabels } from "./labels";

/*
 * Portfolio blocks (ROADMAP Faz 12, DESIGN.md §7 Portfolyo): a project card, a work/school timeline and a skill list.
 * They follow the theme like every block (font, ground, glass); monochrome, figures and tags in Geist Mono.
 */

type Mode = "public" | "preview";

/** "2024-06" → "Haz 2024" in the profile's language; "2024" stays a year. */
function formatWhen(value: string | undefined, locale: string): string | undefined {
  if (!value) return undefined;
  const [year, month] = value.split("-");
  if (!month) return year;
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)));
}

export function Tags({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((tag) => (
        <li key={tag} className="rounded-full border border-glass-edge px-2 py-0.5 font-mono text-[0.6875rem] text-ink-2">
          {tag}
        </li>
      ))}
    </ul>
  );
}

/**
 * A project as a card (list layout, or a full-row tile). The whole card opens the project through /l (counted); when it
 * has both a live page and code, a small "Code" link opens the repository. Stretched-link pattern: no nested anchors.
 */
export function ProjectCard({ id, data, mode, labels, locale, loading }: { id: string; data: BlockData["PROJECT"]; mode: Mode; labels: ProfileLabels; locale: string; loading: "eager" | "lazy" }) {
  const target = data.url ?? data.repo;
  const linked = mode === "public" && Boolean(target);
  const tags = splitList(data.tags);
  return (
    <article className={cn("glass relative flex w-full gap-4 rounded-[var(--radius-card)] p-1.5 text-left", target && "glass-interactive group")}>
      {data.img ? (
        // eslint-disable-next-line @next/next/no-img-element -- copied to our Blob store when the card was made
        <img src={data.img} alt="" loading={loading} decoding="async" className="aspect-[4/3] w-28 shrink-0 self-start rounded-[14px] bg-glass-strong object-cover @min-[35rem]:w-44" />
      ) : (
        <span aria-hidden className="flex size-14 shrink-0 items-center justify-center self-start rounded-[14px] bg-glass-strong text-ink-3 @min-[35rem]:size-16">
          <FolderGit2 size={24} strokeWidth={1.5} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1.5 pr-3">
        <h3 className="text-[0.9375rem] font-semibold text-balance @min-[35rem]:text-base">
          {linked ? (
            <a href={`/l/${id}`} rel="noopener" className="rounded-[var(--radius-card)] after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink">
              {data.title}
            </a>
          ) : (
            data.title
          )}
        </h3>
        {data.desc && <p className="line-clamp-2 text-[0.875rem] leading-relaxed text-ink-2">{data.desc}</p>}
        <Tags items={tags} />
        {(target || data.stars) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.75rem] text-ink-3">
            {target && <span>{displayHost(target)}</span>}
            {data.stars && (
              <span className="inline-flex items-center gap-1">
                <Star size={12} strokeWidth={1.75} aria-hidden />
                {Number(data.stars).toLocaleString(locale)}
              </span>
            )}
            {data.url && data.repo && mode === "public" && (
              // Above the stretched link, so it stays its own target.
              <a href={`/l/${id}?k=repo`} rel="noopener" className="relative z-10 rounded-full text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                {labels.projectCode}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/** Consecutive experience blocks as one timeline; the current one (no end date) has the filled dot. */
export function Timeline({ items, labels, locale }: { items: { id: string; data: BlockData["EXPERIENCE"] }[]; labels: ProfileLabels; locale: string }) {
  return (
    <ol className="ml-1 flex w-full flex-col gap-6 border-l border-glass-edge pl-6 text-left">
      {items.map(({ id, data }) => {
        const start = formatWhen(data.start, locale);
        const end = data.end ? formatWhen(data.end, locale) : start ? labels.present : undefined;
        const current = !data.end;
        return (
          <li key={id} className="relative flex flex-col gap-0.5">
            <span
              aria-hidden
              className={cn(
                "absolute top-1.5 -left-[29px] size-2.5 rounded-full shadow-[0_0_0_4px_var(--c-bg)]",
                current ? "bg-ink" : "border-[1.5px] border-ink-3 bg-bg",
              )}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-semibold">{data.role}</span>
              {(start || end) && <span className="font-mono text-[0.75rem] text-ink-3 tabular-nums">{[start, end].filter(Boolean).join(" — ")}</span>}
            </div>
            {data.org && <span className="text-[0.875rem] text-ink-2">{data.org}</span>}
            {data.desc && <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2 text-pretty whitespace-pre-line">{data.desc}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** A labelled group of skills as outline chips. Left-aligned in a portfolio, centred like the rest elsewhere. */
export function Skills({ data, align }: { data: BlockData["SKILLS"]; align: "start" | "center" }) {
  return (
    <div className={cn("flex w-full flex-col gap-2", align === "center" ? "items-center text-center" : "items-start text-left")}>
      {data.title && <span className="text-[0.8125rem] text-ink-3">{data.title}</span>}
      <ul className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>
        {splitList(data.items).map((skill) => (
          <li key={skill} className="rounded-full border border-glass-edge px-3 py-1.5 font-mono text-[0.75rem]">
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A portfolio section title: small mono label with a hairline running to the edge. */
export function SectionHeading({ text }: { text: string }) {
  return (
    <h2 className="flex w-full items-center gap-3 font-mono text-[0.8125rem] font-medium text-ink-2 after:h-px after:flex-1 after:bg-glass-edge after:content-['']">{text}</h2>
  );
}
