import type { ReportReason } from "@/prisma/generated/enums";

/** The order visitors see the reasons in: the most common and most harmful first, "other" last. */
export const REPORT_REASONS: ReportReason[] = ["SCAM", "ILLEGAL", "ADULT", "HATE", "IMPERSONATION", "COPYRIGHT", "SPAM", "OTHER"];

/** Resolved reports (and the reporter's email with them) are deleted after this long by the daily clean-up. */
export const REPORT_KEEP_DAYS = 180;
