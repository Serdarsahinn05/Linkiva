import { env } from "@/lib/env";

/** Which optional integrations are configured, for rendering decisions on the server. */
export const features = {
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  uploads: Boolean(env.BLOB_READ_WRITE_TOKEN),
  cron: Boolean(env.CRON_SECRET),
  domains: Boolean(env.VERCEL_API_TOKEN && env.VERCEL_PROJECT_ID),
} as const;
