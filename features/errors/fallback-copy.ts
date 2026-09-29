import type { Locale } from "@/i18n/config";

/**
 * Error pages that render without the next-intl provider (the public profile's boundary, app/global-error.tsx).
 * Importing messages/*.json there would ship both whole files with every profile page, so the few strings live here;
 * tests/unit/fallback-copy.test.ts keeps them equal to messages.errors.
 */
export const errorCopy: Record<Locale, { errorTitle: string; errorBody: string; retry: string; home: string }> = {
  tr: {
    errorTitle: "Bir şeyler ters gitti.",
    errorBody: "Sorun bizde. Tekrar dene; devam ederse biraz sonra yeniden gel.",
    retry: "Tekrar dene",
    home: "Ana sayfaya dön",
  },
  en: {
    errorTitle: "Something went wrong.",
    errorBody: "The problem is on our side. Try again; if it persists, come back a little later.",
    retry: "Try again",
    home: "Back to home",
  },
};
