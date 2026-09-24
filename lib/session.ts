import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/** Current session or null, deduplicated per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For pages: redirects to /login without a session. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** For server actions: throws instead of redirecting, so the action can return a typed error. */
export async function requireUser() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session.user;
}
