import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { countOpenReports } from "@/features/admin/queries";
import { requireStaffPage } from "@/lib/admin";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("admin"))("title"), robots: { index: false, follow: false } };
}

// The gate for every admin page (proxy.ts only turns away requests without a session cookie). Everyone who is not
// staff gets the site's 404. Staff without two-step verification see only how to turn it on.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaffPage();
  const t = await getTranslations("admin");

  if (!staff.twoFactor) {
    return (
      <main id="main" className="flex min-h-dvh items-center justify-center px-4">
        <div className="glass flex w-full max-w-md flex-col gap-4 rounded-[var(--radius-card)] p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">{t("twoFactorTitle")}</h1>
          <p className="text-ink-2">{t("twoFactorBody")}</p>
          <Link href="/dashboard/settings" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md, "self-start")}>
            {t("twoFactorAction")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AdminShell role={staff.role} stepUpUntil={staff.steppedUpUntil?.toISOString() ?? null} openReports={await countOpenReports()}>
      {children}
    </AdminShell>
  );
}
