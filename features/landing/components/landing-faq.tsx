import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { localizedPath, pageLocale } from "@/i18n/marketing";

const QUESTIONS = ["free", "analytics", "import", "domain", "rename", "data"] as const;

/** Landing questions (landing.faq.*): one glass panel of native disclosures, the first one open. Works without JavaScript. */
export async function LandingFaq() {
  const tl = await getTranslations("landing");
  const locale = pageLocale(await getLocale());
  return (
    <div className="glass w-full divide-y divide-glass-edge rounded-[28px] px-6">
      {QUESTIONS.map((key, i) => (
        <details key={key} open={i === 0} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[1.0625rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            {tl(`faq.${key}.q`)}
            <ChevronDown size={18} aria-hidden className="shrink-0 text-ink-3 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-ink-2">
            {tl.rich(`faq.${key}.a`, {
              link: (chunks) => (
                <Link href={localizedPath("/privacy", locale)} className="text-ink underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </details>
      ))}
    </div>
  );
}
