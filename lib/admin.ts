import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Prisma } from "@/prisma/generated/client";
import type { UserRole } from "@/prisma/generated/enums";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AuditAction } from "@/features/admin/audit-actions";

// The admin panel's access rules (ROADMAP Faz 19), in one place. Every admin page and every admin action goes through
// here; a hidden link or a client check is never the gate. Not a "use server" module: nothing here is callable
// from the browser.

/** How long a confirmed two-step code unlocks sensitive admin actions on this session. */
export const STEP_UP_MINUTES = 10;

const RANK: Record<UserRole, number> = { USER: 0, MODERATOR: 1, ADMIN: 2 };

export type StaffRole = Exclude<UserRole, "USER">;

export type Staff = {
  userId: string;
  sessionId: string;
  role: StaffRole;
  /** "@username" (or the account id when there is no page): what the audit log shows. Never an email. */
  label: string;
  twoFactor: boolean;
  /** Until when this session's step-up holds, or null. */
  steppedUpUntil: Date | null;
};

/**
 * The signed-in staff member, or null for everyone else (signed out, a normal user, an account waiting to be
 * deleted). Read past the five-minute session cookie cache and from the database each time, so an ended session or a
 * revoked role stops working at once.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, twoFactorEnabled: true, profile: { select: { username: true } }, deletion: { select: { userId: true } } },
  });
  if (!user || user.role === "USER" || user.deletion) return null;
  const step = await db.adminStepUp.findUnique({ where: { sessionId: session.session.id }, select: { verifiedAt: true } });
  const until = step ? new Date(step.verifiedAt.getTime() + STEP_UP_MINUTES * 60_000) : null;
  return {
    userId: session.user.id,
    sessionId: session.session.id,
    role: user.role,
    label: user.profile ? `@${user.profile.username}` : session.user.id,
    twoFactor: user.twoFactorEnabled === true,
    steppedUpUntil: until && until > new Date() ? until : null,
  };
});

export const atLeast = (role: StaffRole, min: StaffRole) => RANK[role] >= RANK[min];

/** For admin pages: anyone below `min` gets the site's plain 404, as if the panel did not exist. */
export async function requireStaffPage(min: StaffRole = "MODERATOR"): Promise<Staff> {
  const staff = await getStaff();
  if (!staff || !atLeast(staff.role, min)) notFound();
  return staff;
}

export type AdminDenial = "notFound" | "twoFactor" | "stepUp";

export class AdminDenied extends Error {
  constructor(readonly reason: AdminDenial) {
    super(`admin: ${reason}`);
    this.name = "AdminDenied";
  }
}

/**
 * For admin actions, first line of every one: staff of at least `min`, with two-step verification on, and (for
 * sensitive actions) a code confirmed on this session within STEP_UP_MINUTES. Throws AdminDenied otherwise.
 */
export async function requireStaff(min: StaffRole, { stepUp = false }: { stepUp?: boolean } = {}): Promise<Staff> {
  const staff = await getStaff();
  if (!staff || !atLeast(staff.role, min)) throw new AdminDenied("notFound");
  if (!staff.twoFactor) throw new AdminDenied("twoFactor");
  if (stepUp && !staff.steppedUpUntil) throw new AdminDenied("stepUp");
  return staff;
}

export type AuditEntry = {
  action: AuditAction;
  target?: { type: string; id: string; label?: string };
  reason?: string;
  meta?: Prisma.InputJsonValue;
};

/** One line in the append-only audit log. Pass `tx` to write it in the same transaction as the action it records. */
export function audit(staff: Pick<Staff, "userId" | "label">, entry: AuditEntry, tx: Prisma.TransactionClient = db) {
  return tx.adminAudit.create({
    data: {
      actorId: staff.userId,
      actorLabel: staff.label,
      action: entry.action,
      targetType: entry.target?.type,
      targetId: entry.target?.id,
      targetLabel: entry.target?.label,
      reason: entry.reason,
      meta: entry.meta ?? {},
    },
  });
}
