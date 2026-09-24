/**
 * Visitor-facing strings of the public profile. Passed as props (not via next-intl's client provider)
 * so the profile page stays cacheable; the editor preview builds the same object from its own translator.
 */
export type ProfileLabels = {
  madeWith: string;
  embedPlay: string;
  embedListen: string;
  subscribeTitle: string;
  subscribePlaceholder: string;
  subscribeButton: string;
  subscribeDone: string;
  subscribeInvalid: string;
  subscribeTooMany: string;
  subscribeError: string;
};

/** Any next-intl translator (server or client) scoped to the root namespace. */
type AnyTranslator = (key: never) => string;

export function profileLabels(translator: AnyTranslator): ProfileLabels {
  // next-intl types keys as a literal union; every key used below exists in both catalogues
  // (checked by tests/unit/i18n.test.ts), so widening to string is safe here.
  const t = translator as unknown as (key: string) => string;
  return {
    madeWith: t("profile.madeWith"),
    embedPlay: t("blocks.embedPlay"),
    embedListen: t("blocks.embedListen"),
    subscribeTitle: t("blocks.subscribeTitle"),
    subscribePlaceholder: t("blocks.subscribePlaceholder"),
    subscribeButton: t("blocks.subscribeButton"),
    subscribeDone: t("blocks.subscribeDone"),
    subscribeInvalid: t("blocks.subscribeInvalid"),
    subscribeTooMany: t("blocks.subscribeTooMany"),
    subscribeError: t("blocks.subscribeError"),
  };
}
