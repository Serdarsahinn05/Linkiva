"use client";

import { Download, Monitor, Smartphone, Tablet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiGoogle } from "react-icons/si";
import { useFormatter, useTranslations } from "next-intl";
import { Button, buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { Section } from "@/features/dashboard/components/page";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { parseUserAgent } from "@/lib/ua";
import { emailSchema, PASSWORD_MIN, passwordSchema } from "@/lib/validation/auth";
import { deleteAccount } from "../actions";

export type SessionInfo = { token: string; userAgent: string | null; createdAt: string; current: boolean };

type Props = {
  email: string;
  username: string;
  hasPassword: boolean;
  /** Google account id when linked (unlinking needs it), else null. */
  googleAccountId: string | null;
  googleEnabled: boolean;
  sessions: SessionInfo[];
};

const DEVICE_ICON = { MOBILE: Smartphone, TABLET: Tablet, DESKTOP: Monitor } as const;

export function AccountSecurity({ email, username, hasPassword, googleAccountId, googleEnabled, sessions: initialSessions }: Props) {
  const googleLinked = googleAccountId !== null;
  const t = useTranslations();
  const format = useFormatter();
  const toast = useToast();
  const router = useRouter();

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "pending" | "sent" | "invalid" | "error">("idle");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordState, setPasswordState] = useState<"idle" | "pending" | "done" | "wrong" | "short" | "error">("idle");

  // Sessions
  const [sessions, setSessions] = useState(initialSessions);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const SESSION_PREVIEW = 5;

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  async function changeEmail(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success || parsed.data === email) return setEmailState("invalid");
    setEmailState("pending");
    const { error } = await authClient.changeEmail({ newEmail: parsed.data, callbackURL: "/dashboard/settings" });
    setEmailState(error ? "error" : "sent");
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!passwordSchema.safeParse(newPassword).success) return setPasswordState("short");
    setPasswordState("pending");
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    if (error) return setPasswordState(error.code === "INVALID_PASSWORD" || error.status === 400 ? "wrong" : "error");
    setPasswordState("done");
    setCurrentPassword("");
    setNewPassword("");
    setSessions((list) => list.filter((s) => s.current));
  }

  async function signOutOthers() {
    const { error } = await authClient.revokeOtherSessions();
    if (error) return toast({ tone: "error", message: t("common.genericError") });
    setSessions((list) => list.filter((s) => s.current));
    toast({ tone: "success", message: t("account.signedOutOthers") });
  }

  async function revoke(token: string) {
    const { error } = await authClient.revokeSession({ token });
    if (error) return toast({ tone: "error", message: t("common.genericError") });
    setSessions((list) => list.filter((s) => s.token !== token));
  }

  async function toggleGoogle() {
    if (googleLinked) {
      const { error } = await authClient.unlinkAccount({ accountId: googleAccountId! });
      if (error) return toast({ tone: "error", message: t("common.genericError") });
      router.refresh();
    } else {
      await authClient.linkSocial({ provider: "google", callbackURL: "/dashboard/settings" });
    }
  }

  async function confirmDelete(event: React.FormEvent) {
    event.preventDefault();
    if (confirmation.trim().toLowerCase() !== username.toLowerCase()) return setDeleteError(t("account.deleteMismatch"));
    setDeleting(true);
    const result = await deleteAccount(confirmation);
    if (!result.ok) {
      setDeleting(false);
      return setDeleteError(result.error === "confirm" ? t("account.deleteMismatch") : t("common.genericError"));
    }
    await authClient.signOut().catch(() => {});
    // No refresh(): it would re-render the settings route for a user that no longer exists.
    router.replace("/");
  }

  return (
    <>
      <Section title={t("account.email")}>
        <p className="text-sm text-ink-2">
          {t("account.currentEmail")}: <span className="font-medium text-ink">{email}</span>
        </p>
        {emailState === "sent" ? (
          <Notice tone="success">{t("account.changeEmailSent", { email })}</Notice>
        ) : (
          <form onSubmit={changeEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
            <Field label={t("account.newEmail")} error={emailState === "invalid" ? t("auth.errors.email") : undefined} className="flex-1">
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="email" autoComplete="email" value={newEmail} aria-invalid={invalid} aria-describedby={describedBy} onChange={(e) => setNewEmail(e.target.value)} />
              )}
            </Field>
            <Button type="submit" variant="secondary" pending={emailState === "pending"} className="shrink-0">
              {t("account.changeEmail")}
            </Button>
          </form>
        )}
        {emailState === "error" && <Notice tone="error">{t("common.genericError")}</Notice>}
      </Section>

      <Section title={t("account.password")}>
        {hasPassword ? (
          <form onSubmit={changePassword} className="flex flex-col gap-3" noValidate>
            {passwordState === "done" && <Notice tone="success">{t("account.passwordChanged")}</Notice>}
            {passwordState === "wrong" && <Notice tone="error">{t("account.wrongPassword")}</Notice>}
            {passwordState === "error" && <Notice tone="error">{t("common.genericError")}</Notice>}
            <Field label={t("account.currentPassword")}>
              {({ id }) => (
                <PasswordInput id={id} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} showLabel={t("auth.fields.showPassword")} hideLabel={t("auth.fields.hidePassword")} />
              )}
            </Field>
            <Field label={t("account.newPassword")} hint={t("auth.fields.passwordHint", { min: PASSWORD_MIN })} error={passwordState === "short" ? t("auth.errors.passwordShort", { min: PASSWORD_MIN }) : undefined}>
              {({ id, describedBy, invalid }) => (
                <PasswordInput
                  id={id}
                  autoComplete="new-password"
                  value={newPassword}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(e) => setNewPassword(e.target.value)}
                  showLabel={t("auth.fields.showPassword")}
                  hideLabel={t("auth.fields.hidePassword")}
                />
              )}
            </Field>
            <Button type="submit" variant="secondary" pending={passwordState === "pending"} className="self-start" disabled={!currentPassword || !newPassword}>
              {t("account.changePassword")}
            </Button>
          </form>
        ) : (
          <p className="text-ink-2">{t("account.noPassword")}</p>
        )}
      </Section>

      {googleEnabled && (
        <Section title={t("account.connections")}>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-3">
              <SiGoogle size={18} aria-hidden />
              <span>
                <span className="block font-medium">{t("account.google")}</span>
                {googleLinked && <span className="block text-sm text-positive">{t("account.connected")}</span>}
              </span>
            </span>
            {googleLinked && !hasPassword ? (
              <span className="max-w-[18ch] text-right text-sm text-ink-3">{t("account.lastMethod")}</span>
            ) : (
              <Button variant={googleLinked ? "ghost" : "secondary"} size="md" onClick={toggleGoogle}>
                {googleLinked ? t("account.disconnect") : t("account.connect")}
              </Button>
            )}
          </div>
        </Section>
      )}

      <Section title={t("account.sessions")}>
        <ul className="flex flex-col divide-y divide-glass-edge">
          {(showAllSessions ? sessions : sessions.slice(0, SESSION_PREVIEW)).map((s) => {
            const ua = s.userAgent ? parseUserAgent(s.userAgent) : null;
            const Icon = DEVICE_ICON[ua?.device ?? "DESKTOP"];
            return (
              <li key={s.token} className="flex items-center gap-3 py-2.5">
                <Icon size={18} strokeWidth={1.75} className="shrink-0 text-ink-2" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{ua ? `${ua.browser} · ${ua.os}` : "—"}</span>
                  <span className="block text-sm text-ink-3">{t("account.since", { date: format.dateTime(new Date(s.createdAt), { dateStyle: "medium" }) })}</span>
                </span>
                {s.current ? (
                  <span className="text-sm text-positive">{t("account.thisDevice")}</span>
                ) : (
                  <Button variant="ghost" size="md" onClick={() => revoke(s.token)}>
                    {t("account.revoke")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          {sessions.length > SESSION_PREVIEW && !showAllSessions && (
            <Button variant="ghost" size="md" onClick={() => setShowAllSessions(true)}>
              {t("account.showAllSessions", { count: sessions.length })}
            </Button>
          )}
          {sessions.length > 1 && (
            <Button variant="secondary" size="md" onClick={signOutOthers}>
              {t("account.signOutOthers")}
            </Button>
          )}
        </div>
      </Section>

      <Section title={t("account.data")}>
        <p className="text-ink-2">{t("account.dataHint")}</p>
        {/* A file download, not a navigation. */}
        <a href="/dashboard/settings/export" download className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md, "self-start")}>
          <Download size={16} aria-hidden />
          {t("account.download")}
        </a>
      </Section>

      <Section title={t("account.danger")} className="border-negative/30">
        <p className="text-ink-2">{t("account.dangerHint")}</p>
        <Button variant="danger" size="md" className="self-start" onClick={() => setDeleteOpen(true)}>
          {t("account.deleteOpen")}
        </Button>
      </Section>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("account.deleteTitle")} closeLabel={t("account.cancel")}>
        <form onSubmit={confirmDelete} className="flex flex-col gap-4 p-5">
          <p className="text-ink-2">{t("account.dangerHint")}</p>
          <Field label={t("account.deleteConfirmLabel", { username })} error={deleteError}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} autoCapitalize="none" autoComplete="off" spellCheck={false} value={confirmation} aria-invalid={invalid} aria-describedby={describedBy} onChange={(e) => setConfirmation(e.target.value)} />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setDeleteOpen(false)}>
              {t("account.cancel")}
            </Button>
            <Button type="submit" variant="danger" size="md" pending={deleting} pendingLabel={t("account.deleting")} disabled={confirmation.trim().toLowerCase() !== username.toLowerCase()}>
              {t("account.deleteConfirm")}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
