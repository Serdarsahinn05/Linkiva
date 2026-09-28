"use client";

import { Check, Copy, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

type Mode = "enable" | "disable" | "codes";
type Step = "password" | "scan" | "backup";

/** "JBSWY3DPEHPK3PXP" → "JBSW Y3DP EHPK 3PXP": easier to type into an app by hand. */
const groups = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

/**
 * Two-step verification (Better Auth twoFactor, TOTP + backup codes). Every change asks for the password again.
 * Turning it on: password → scan the QR (or type the key) → confirm one code → save the backup codes.
 */
export function TwoFactor({ enabled, hasPassword, googleLinked }: { enabled: boolean; hasPassword: boolean; googleLinked: boolean }) {
  const t = useTranslations("account.twoFactor");
  const tc = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ uri?: string; codes: string[] }>({ codes: [] });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState<"key" | "codes" | null>(null);

  function open(next: Mode) {
    setMode(next);
    setStep("password");
    setPassword("");
    setCode("");
    setSetup({ codes: [] });
    setError(undefined);
  }

  function close() {
    // Turned on (codes shown) or given up half way: either way the page re-reads the real state.
    setMode(null);
    router.refresh();
  }

  const failure = (e: { status: number; code?: string }) =>
    e.status === 429 ? tc("auth.login.tooMany") : e.code === "INVALID_PASSWORD" || e.status === 400 || e.status === 401 ? tc("account.wrongPassword") : tc("common.genericError");

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    if (mode === "enable") {
      const { data, error } = await authClient.twoFactor.enable({ password });
      setPending(false);
      if (error || !data || !("totpURI" in data)) return setError(error ? failure(error) : tc("common.genericError"));
      setSetup({ uri: data.totpURI, codes: data.backupCodes });
      setStep("scan");
    } else if (mode === "disable") {
      const { error } = await authClient.twoFactor.disable({ password });
      setPending(false);
      if (error) return setError(failure(error));
      toast({ tone: "success", message: t("turnedOff") });
      close();
    } else {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password });
      setPending(false);
      if (error || !data) return setError(error ? failure(error) : tc("common.genericError"));
      setSetup({ codes: data.backupCodes });
      setStep("backup");
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const { error } = await authClient.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") });
    setPending(false);
    if (error) return setError(error.status === 429 ? tc("auth.login.tooMany") : tc("auth.twoFactor.badCode"));
    setStep("backup");
  }

  async function copy(text: string, what: "key" | "codes") {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  }

  function download() {
    const file = new Blob([`${t("fileHeading")}\n\n${setup.codes.join("\n")}\n`], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: "linkiva-backup-codes.txt" });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const secret = setup.uri ? (new URL(setup.uri).searchParams.get("secret") ?? "") : "";

  if (!hasPassword) return <p className="text-ink-2">{t("noPassword")}</p>;

  return (
    <>
      {enabled ? (
        <>
          <p className="text-ink-2">
            <span className="font-medium text-positive">{t("on")}</span> · {t("onHint")}
          </p>
          {googleLinked && <p className="text-sm text-ink-3">{t("googleNote")}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="md" onClick={() => open("codes")}>
              {t("newCodes")}
            </Button>
            <Button variant="ghost" size="md" onClick={() => open("disable")}>
              {t("turnOff")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-ink-2">{t("offHint")}</p>
          <Button variant="secondary" size="md" className="self-start" onClick={() => open("enable")}>
            {t("turnOn")}
          </Button>
        </>
      )}

      <Dialog open={mode !== null} onClose={close} title={mode ? t(`dialog.${mode}`) : ""} closeLabel={tc("account.cancel")}>
        {step === "password" && (
          <form onSubmit={submitPassword} className="flex flex-col gap-4 p-5">
            <p className="text-ink-2">{t(`passwordHint.${mode ?? "enable"}`)}</p>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label={tc("account.currentPassword")}>
              {({ id }) => (
                <PasswordInput
                  id={id}
                  data-autofocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showLabel={tc("auth.fields.showPassword")}
                  hideLabel={tc("auth.fields.hidePassword")}
                />
              )}
            </Field>
            <Button type="submit" variant={mode === "disable" ? "danger" : "primary"} size="md" className="self-end" pending={pending} disabled={!password}>
              {mode === "disable" ? t("turnOff") : tc("common.continue")}
            </Button>
          </form>
        )}

        {step === "scan" && (
          <form onSubmit={submitCode} className="flex flex-col gap-4 p-5">
            <p className="text-ink-2">{t("scanHint")}</p>
            <div className="self-center rounded-[var(--radius-card)] bg-white p-4 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.4)]">
              <QRCodeSVG value={setup.uri ?? ""} size={176} level="M" marginSize={0} title={t("qrLabel")} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-glass-edge px-3 py-2">
              <span className="min-w-0">
                <span className="block text-sm text-ink-3">{t("manualKey")}</span>
                <code data-testid="totp-secret" className="block font-mono text-sm break-words">
                  {groups(secret)}
                </code>
              </span>
              <Button variant="ghost" size="md" onClick={() => copy(secret, "key")} aria-label={t("copyKey")}>
                {copied === "key" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              </Button>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label={tc("auth.twoFactor.code")}>
              {({ id }) => (
                <Input
                  id={id}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={7}
                  className="font-mono tracking-[0.2em]"
                />
              )}
            </Field>
            <Button type="submit" size="md" className="self-end" pending={pending} disabled={code.replace(/\s/g, "").length !== 6}>
              {t("confirm")}
            </Button>
          </form>
        )}

        {step === "backup" && (
          <div className="flex flex-col gap-4 p-5">
            {mode === "enable" && <Notice tone="success">{t("turnedOn")}</Notice>}
            <p className="text-ink-2">{t("codesHint")}</p>
            <ul data-testid="backup-codes" className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-[var(--radius-control)] border border-glass-edge p-4 font-mono text-[0.9375rem]">
              {setup.codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="md" onClick={() => copy(setup.codes.join("\n"), "codes")}>
                {copied === "codes" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                {copied === "codes" ? t("copied") : t("copyCodes")}
              </Button>
              <Button variant="secondary" size="md" onClick={download}>
                <Download size={16} aria-hidden />
                {t("downloadCodes")}
              </Button>
              <Button size="md" className="ml-auto" onClick={close}>
                {t("saved")}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
