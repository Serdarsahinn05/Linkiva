import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UnsubscribeForm } from "@/features/digest/components/unsubscribe-form";
import { verifyUnsubscribeToken } from "@/features/digest/token";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("unsubscribe"))("title"), robots: { index: false } };
}

/** Linked from the weekly summary mail; works without signing in (features/digest/token.ts). */
export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const t = await getTranslations("unsubscribe");
  const token = (await searchParams).t;

  if (typeof token !== "string" || !verifyUnsubscribeToken(token)) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("invalid")}</h1>
        <p className="text-ink-2">{t("invalidBody")}</p>
      </div>
    );
  }
  return <UnsubscribeForm token={token} />;
}
