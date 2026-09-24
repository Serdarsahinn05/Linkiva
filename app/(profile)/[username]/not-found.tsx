import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Tape } from "@/components/ui/tape";
import { defaultLocale } from "@/i18n/config";

// A free username is an invitation, not an error.
export default async function ProfileNotFound() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "profile" });
  return (
    <main className="pegboard flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-start gap-5">
        <Tape tone="grey" size="lg" lang="en" translate="no" tiltSeed="404">
          404
        </Tape>
        <h1 className="text-4xl font-extrabold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">{t("notFoundTitle")}</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="tape tape-type min-h-11 px-5" data-tone="red">
            {t("claim")}
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center px-3 underline underline-offset-4">
            {t("home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
