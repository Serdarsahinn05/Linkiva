import { z } from "zod";

// Optional in development so the app boots without every third-party account.
const optional = z.string().trim().optional().transform((v) => (v ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  RESEND_API_KEY: optional,
  MAIL_FROM: z.string().default("Linkiva <hello@linkiva.space>"),
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  BLOB_READ_WRITE_TOKEN: optional,
  TRACKING_SALT_SECRET: z.string().min(16).default("dev-only-tracking-salt-secret"),
  /** Set by the Playwright web server only; lifts auth rate limits. Ignored in production. */
  E2E: z.enum(["1"]).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables (see .env.example):\n${issues}`);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.TRACKING_SALT_SECRET === "dev-only-tracking-salt-secret") {
  throw new Error("TRACKING_SALT_SECRET must be set in production");
}

export const env = parsed.data;
