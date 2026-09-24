import { env } from "@/lib/env";

/** Which optional integrations are configured, for rendering decisions on the server. */
export const features = {
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
} as const;
