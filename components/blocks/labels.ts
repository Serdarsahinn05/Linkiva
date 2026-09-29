/**
 * Visitor-facing strings of the public profile. Passed as props (not via next-intl's client provider)
 * so the profile page stays cacheable; the editor preview builds the same object from its own translator.
 */
export type ProfileLabels = {
  madeWith: string;
  /** The quiet "report this page" link at the foot of the public page. */
  report: string;
  embedPlay: string;
  embedListen: string;
  /** Editor preview only: a "latest video" embed, whose video is picked when the page renders. */
  embedLatest: string;
  subscribeTitle: string;
  subscribePlaceholder: string;
  subscribeButton: string;
  subscribeDone: string;
  subscribeInvalid: string;
  subscribeTooMany: string;
  subscribeError: string;
  whatsappDefault: string;
  contactAdd: string;
  supportCopied: string;
  supportCopyName: string;
  supportCopyIban: string;
  supportLink: string;
  sponsored: string;
  /** Tags on links behind the sensitive content warning. */
  gateAdult: string;
  gateSpoiler: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  /** Portfolio: the small link to a project's code, and the end of a current job ("2024 — now"). */
  projectCode: string;
  present: string;
};

/** Any next-intl translator (server or client) scoped to the root namespace. */
type AnyTranslator = (key: never) => string;

export function profileLabels(translator: AnyTranslator): ProfileLabels {
  // next-intl types keys as a literal union; every key used below exists in both catalogues
  // (checked by tests/unit/i18n.test.ts), so widening to string is safe here.
  const t = translator as unknown as (key: string) => string;
  return {
    madeWith: t("profile.madeWith"),
    report: t("profile.report"),
    embedPlay: t("blocks.embedPlay"),
    embedListen: t("blocks.embedListen"),
    embedLatest: t("blocks.embedLatest"),
    subscribeTitle: t("blocks.subscribeTitle"),
    subscribePlaceholder: t("blocks.subscribePlaceholder"),
    subscribeButton: t("blocks.subscribeButton"),
    subscribeDone: t("blocks.subscribeDone"),
    subscribeInvalid: t("blocks.subscribeInvalid"),
    subscribeTooMany: t("blocks.subscribeTooMany"),
    subscribeError: t("blocks.subscribeError"),
    whatsappDefault: t("blocks.whatsappDefault"),
    contactAdd: t("blocks.contactAdd"),
    supportCopied: t("blocks.supportCopied"),
    supportCopyName: t("blocks.supportCopyName"),
    supportCopyIban: t("blocks.supportCopyIban"),
    supportLink: t("blocks.supportLink"),
    sponsored: t("blocks.sponsored"),
    gateAdult: t("blocks.gateAdult"),
    gateSpoiler: t("blocks.gateSpoiler"),
    countdownDays: t("blocks.countdownDays"),
    countdownHours: t("blocks.countdownHours"),
    countdownMinutes: t("blocks.countdownMinutes"),
    countdownSeconds: t("blocks.countdownSeconds"),
    projectCode: t("blocks.projectCode"),
    present: t("blocks.present"),
  };
}
