import Link from "next/link";
import { useTranslations } from "next-intl";

const link = "font-medium text-ink underline underline-offset-4 hover:no-underline";

/**
 * The line under sign-up and publishing forms. Accepting the Terms is a contract term; the privacy notice only
 * informs (KVKK aydınlatma is not consent), so the two are worded differently. Onboarding shows it too because a
 * Google sign-in can create an account without ever seeing the sign-up form.
 */
export function TermsConsent({ action }: { action: "register" | "publish" }) {
  const t = useTranslations("legal.consent");
  return (
    <p className="text-sm text-ink-2">
      {t.rich(action, {
        terms: (chunks) => (
          <Link href="/terms" target="_blank" className={link}>
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href="/privacy" target="_blank" className={link}>
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
