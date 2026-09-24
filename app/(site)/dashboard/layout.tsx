import { redirect } from "next/navigation";
import { getOwnProfile } from "@/features/profile/queries";
import { requireSession } from "@/lib/session";

// The real check (proxy.ts only does an optimistic cookie check).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!(await getOwnProfile(session.user.id))) redirect("/onboarding");
  return children;
}
