import { redirect } from "next/navigation";
import { RestoreAccount } from "@/features/account/components/restore-account";
import { pendingDeletion } from "@/features/account/deletion";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getOwnProfile } from "@/features/profile/queries";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

// The real check (proxy.ts only does an optimistic cookie check).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  // Side by side: the domain is looked up through the profile's owner, not its id.
  const [profile, domain, deletion] = await Promise.all([
    getOwnProfile(session.user.id),
    db.customDomain.findFirst({ where: { profile: { userId: session.user.id } }, select: { hostname: true, verifiedAt: true } }),
    pendingDeletion(session.user.id),
  ]);
  // Signing in during the waiting period: the account comes back only when its owner asks for it.
  if (deletion) return <RestoreAccount purgeAt={deletion.purgeAt.toISOString()} />;
  if (!profile) redirect("/onboarding");
  return (
    <DashboardShell username={profile.username} domain={domain?.verifiedAt ? domain.hostname : null}>
      {children}
    </DashboardShell>
  );
}
