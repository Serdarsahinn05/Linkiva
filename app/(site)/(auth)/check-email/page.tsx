import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResendVerification } from "@/features/auth/components/resend-verification";
import { emailSchema } from "@/lib/validation/auth";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.checkEmail"))("title") };
}

export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const t = await getTranslations("auth.checkEmail");
  const parsed = emailSchema.safeParse((await searchParams).email);
  const email = parsed.success ? parsed.data : null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{t("title")}</h1>
      <p className="text-ink">
        {email
          ? t.rich("body", { email, strong: (chunks) => <strong>{chunks}</strong> })
          : t("bodyNoEmail")}
      </p>
      <p className="text-sm text-ink-2">{t("spam")}</p>
      {email && <ResendVerification email={email} />}
    </div>
  );
}
