import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { localeFromRequest } from "@/i18n/detect";
import { db } from "@/lib/db";
import { env, isE2E } from "@/lib/env";
import { sendMail } from "@/lib/mail/send";
import { site } from "@/lib/site";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation/auth";

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
    // This is what closes v1's account-takeover hole (docs/AUDIT.md S2).
    accountLinking: { enabled: true, requireLocalEmailVerified: true },
  },

  user: {
    // The stored address only changes after the new one is verified (docs/AUDIT.md S4).
    changeEmail: { enabled: true },
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

  telemetry: { enabled: false },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
