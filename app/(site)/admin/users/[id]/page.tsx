import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { UserActions } from "@/features/admin/components/user-actions";
import { getUser } from "@/features/admin/queries";
import { requireStaffPage } from "@/lib/admin";

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const staff = await requireStaffPage("ADMIN");
  const user = await getUser((await params).id);
  if (!user) notFound();
  const t = await getTranslations("admin.users");
  const tr = await getTranslations("admin.roles");
  const format = await getFormatter();
  const name = user.profile?.username ?? user.id;

  const rows: [string, string][] = [
    [t("email"), user.email],
    [t("role"), user.role === "USER" ? t("userRole") : tr(user.role)],
    [t("twoFactor"), user.twoFactorEnabled ? t("on") : t("off")],
    [t("since"), format.dateTime(new Date(user.createdAt), { dateStyle: "medium" })],
    [t("page"), user.profile ? (user.profile.suspended ? t("suspended") : user.profile.isPublished ? t("published") : t("unpublished")) : t("noPage")],
  ];
  if (user.purgeAt) rows.push([t("leaving"), format.dateTime(new Date(user.purgeAt), { dateStyle: "medium" })]);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-4 sm:px-8 md:py-10">
      <Link href="/admin/users" className="flex items-center gap-2 self-start text-sm text-ink-2 hover:text-ink">
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
        {t("title")}
      </Link>
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em] break-all">{user.profile ? `@${user.profile.username}` : t("noPage")}</h1>
      <dl className="glass grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-[var(--radius-card)] p-5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-3">{k}</dt>
            <dd className="min-w-0 break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <UserActions
          userId={user.id}
          name={name}
          role={user.role}
          stepUpUntil={staff.steppedUpUntil?.toISOString() ?? null}
          canErase={user.id !== staff.userId && user.role !== "ADMIN"}
        />
      </div>
    </div>
  );
}
