/** Every action name written to admin_audit (messages admin.audit.* has a label for each). */
export const AUDIT_ACTIONS = ["stepUp", "stepUpFailed", "stepUpLimited", "roleSet", "reportDismissed", "blockRemoved", "imagesRemoved", "pageSuspended", "pageUnsuspended", "userLookup", "accountErased"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const isAuditAction = (value: string): value is AuditAction => (AUDIT_ACTIONS as readonly string[]).includes(value);
