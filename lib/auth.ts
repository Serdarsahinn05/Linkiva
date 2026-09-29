import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { isLocale } from "@/i18n/config";
import { localeFromRequest } from "@/i18n/detect";
import { db } from "@/lib/db";
import { env, isE2E } from "@/lib/env";
import { sendMail, sendMailQuietly } from "@/lib/mail/send";
import { allow } from "@/lib/ratelimit";
import { site } from "@/lib/site";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/auth";

type HookContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

/** Where the twoFactor plugin counts failed codes (only during sign-in, never on the enable flow's session path). */
const TWO_FACTOR_VERIFY = new Set(["/two-factor/verify-totp", "/two-factor/verify-backup-code"]);

/**
 * Ten wrong codes in a row lock the account for 15 minutes (plugin default). Getting that far means someone knows the
 * password, so the owner is told once per lock, in their own language (not the requester's). The user comes from the
 * pending sign-in's signed cookie, the same way the plugin reads it.
 */
async function noticeTwoFactorLock(ctx: HookContext) {
  const signed = await ctx.getSignedCookie(ctx.context.createAuthCookie("two_factor").name, ctx.context.secret);
  const userId = signed ? (await ctx.context.internalAdapter.findVerificationValue(signed))?.value : null;
  if (!userId) return;
  const locked = await db.twoFactor.findFirst({
    where: { userId, lockedUntil: { gt: new Date() } },
    select: { user: { select: { email: true, profile: { select: { locale: true } } } } },
  });
  if (!locked || !(await allow("two-factor-lock-mail", userId, 1, 15 * 60))) return;
  const saved = locked.user.profile?.locale;
  const locale = isLocale(saved) ? saved : localeFromRequest(ctx.request);
  await sendMailQuietly({ to: locked.user.email, kind: "twoFactorLocked", locale, url: `${site.url}/forgot-password` });
}

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {};

export const auth = betterAuth({
  appName: site.name,
  baseURL: site.url,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }, request) => {
      await sendMailQuietly({ to: user.email, kind: "passwordChanged", locale: localeFromRequest(request), url: `${site.url}/forgot-password` });
    },
    sendResetPassword: async ({ user, url }, request) => {
      await sendMail({ to: user.email, kind: "reset", locale: localeFromRequest(request), url });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }, request) => {
      // During an email change Better Auth passes the *new* address as user.email while the
      // stored address is still the old one; that difference selects the change-email copy.
      const stored = await db.user.findUnique({ where: { id: user.id }, select: { email: true } });
      const changing = stored !== null && stored.email !== user.email;
      await sendMail({
        to: user.email,
        kind: changing ? "changeEmail" : "verify",
        locale: localeFromRequest(request),
        url,
      });
    },
  },

  socialProviders: google,

  account: {
    // Implicit linking only onto locally verified accounts (Better Auth's default, stated explicitly).
    // This is what closes v1's account-takeover hole (docs/private/AUDIT.md S2).
    accountLinking: { enabled: true, requireLocalEmailVerified: true },
  },

  user: {
    // The stored address only changes after the new one is verified (docs/private/AUDIT.md S4).
    changeEmail: {
      enabled: true,
      // A verified account must approve the change from its current address first; only then does the
      // new address get its verification link. A stolen session alone cannot move the account away.
      sendChangeEmailConfirmation: async ({ user, newEmail, url }, request) => {
        await sendMail({ to: user.email, kind: "changeEmailConfirm", locale: localeFromRequest(request), url, newEmail });
      },
    },
    deleteUser: { enabled: true },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  rateLimit: {
    // Off only for the local e2e server, so repeated runs from one IP are not throttled.
    enabled: !isE2E,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 600, max: 5 },
      "/request-password-reset": { window: 600, max: 3 },
      "/send-verification-email": { window: 600, max: 3 },
      "/change-email": { window: 600, max: 3 },
    },
  },

  advanced: {
    // Vercel sets x-forwarded-for; rate limits key on its first (client) address.
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },

  hooks: {
    // Security notices: an in-app password change (resets are covered by onPasswordReset) and two-step verification
    // turned off (a stolen session plus the password could otherwise remove it silently).
    after: createAuthMiddleware(async (ctx) => {
      if (TWO_FACTOR_VERIFY.has(ctx.path)) {
        if (ctx.context.returned instanceof APIError) await noticeTwoFactorLock(ctx);
        return;
      }
      const notice = ctx.path === "/change-password" ? "passwordChanged" : ctx.path === "/two-factor/disable" ? "twoFactorOff" : null;
      if (!notice || ctx.context.returned instanceof APIError) return;
      const email = ctx.context.session?.user.email;
      if (email) await sendMailQuietly({ to: email, kind: notice, locale: localeFromRequest(ctx.request), url: `${site.url}/forgot-password` });
    }),
  },

  telemetry: { enabled: false },
  plugins: [
    // Two-step verification (TOTP + backup codes) for email/password sign-in. Google sign-in keeps Google's own.
    // Enabling, disabling and new backup codes all ask for the password. Secrets are encrypted with the auth secret.
    twoFactor({ issuer: site.name }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
