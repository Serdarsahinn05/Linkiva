import { redirect } from "next/navigation";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getOwnProfile } from "@/features/profile/queries";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

// The real check (proxy.ts only does an optimistic cookie check).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const profile = await getOwnProfile(session.user.id);
  if (!profile) redirect("/onboarding");
  const domain = await db.customDomain.findUnique({ where: { profileId: profile.id }, select: { hostname: true, verifiedAt: true } });
  return (
    <DashboardShell username={profile.username} domain={domain?.verifiedAt ? domain.hostname : null}>
      {children}
    </DashboardShell>
  );
}
