import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/ui/surface";
import { LanguageSuggestion } from "@/features/locale/components/language-switch";
import { localizedPath, pageLocale, type MarketingPage } from "@/i18n/marketing";
import { site } from "@/lib/site";
import type { LegalBlock, LegalDoc } from "../types";
import { SiteFooter } from "./site-footer";

/** Plain text with the contact address turned into a mail link. */
function Text({ children }: { children: string }) {
  return children.split(site.email).flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={`mailto:${site.email}`} className="font-medium text-ink underline underline-offset-4 hover:no-underline">
            {site.email}
          </a>,
          part,
        ],
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return (
      <p className="max-w-[68ch] leading-relaxed text-ink-2">
        <Text>{block}</Text>
      </p>
    );
  }
  return (
    <ul className="flex max-w-[68ch] list-disc flex-col gap-2 pl-5 leading-relaxed text-ink-2 marker:text-ink-3">
      {block.list.map((item) => (
        <li key={item.slice(0, 48)}>
          <Text>{item}</Text>
        </li>
      ))}
    </ul>
  );
}

/** /privacy and /terms: one glass sheet with a table of contents, in the visitor's language. */
export async function LegalDocument({ doc, page }: { doc: LegalDoc; page: MarketingPage }) {
  const t = await getTranslations("legal");
  const locale = pageLocale(await getLocale());
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <LanguageSuggestion page={page} />
      <header className="mx-auto w-full max-w-2xl py-2">
        <Link href={localizedPath("/", locale)} className="inline-block rounded-full">
          <Wordmark />
        </Link>
      </header>
      <main id="main" className="glass mx-auto mt-8 mb-16 flex w-full max-w-2xl flex-col gap-8 rounded-[28px] p-6 sm:p-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-[2.25rem] leading-tight font-semibold tracking-[-0.03em] text-balance">{doc.title}</h1>
          <p className="text-sm text-ink-3">{doc.updated}</p>
        </div>
        {doc.intro.map((p, i) => (
          <p key={p.slice(0, 48)} className={i === 0 ? "max-w-[68ch] text-lg leading-relaxed text-ink-2" : "max-w-[68ch] leading-relaxed text-ink"}>
            <Text>{p}</Text>
          </p>
        ))}
        <nav aria-labelledby="contents" className="glass-flat flex flex-col gap-3 rounded-[var(--radius-card)] p-5">
          <h2 id="contents" className="text-sm font-medium text-ink-3">
            {t("contents")}
          </h2>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.9375rem] marker:font-mono marker:text-ink-3">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="rounded-sm text-ink-2 hover:text-ink focus-visible:text-ink">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="flex scroll-mt-6 flex-col gap-3">
            <h2 id={`${section.id}-title`} className="text-xl font-semibold tracking-[-0.02em] text-balance">
              {section.title}
            </h2>
            {section.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}
      </main>
      <SiteFooter page={page} />
    </div>
  );
}
