import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_HEADER, marketingLocale } from "@/i18n/marketing";
import { domainRoute } from "@/lib/custom-domains";

/**
 * A path no route matches: Next answers it with the site's 404 page (app/global-not-found.tsx) and a 404 status. A bare
 * empty 404 would show the browser's own error screen instead.
 */
const notFound = (request: NextRequest) => NextResponse.rewrite(new URL("/_domain/not-found", request.url));

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const route = domainRoute(host, pathname);

  // A custom domain (ROADMAP Faz 11) shows its profile's pages and nothing else of the site.
  if (route.kind !== "main") {
    if (route.kind === "pass") return NextResponse.next();
    if (route.kind === "notFound") return notFound(request);
    // Loaded only for custom domains: requests to the site itself never initialise the database client here.
    const { usernameForHost } = await import("@/lib/domain-lookup");
    const username = await usernameForHost(host.split(":")[0]!.toLowerCase());
    if (!username) return notFound(request);
    return NextResponse.rewrite(new URL(`/${username}${route.path}${request.nextUrl.search}`, request.url));
  }

  // Optimistic redirect only: a missing cookie means "surely logged out". The authoritative
  // session check happens in the dashboard/onboarding server components.
  if ((pathname.startsWith("/dashboard") || pathname === "/onboarding") && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Site pages have a fixed language by address (/ Turkish, /en English); only the proxy may say so, a client-sent
  // header is dropped.
  const locale = marketingLocale(pathname);
  if (locale || request.headers.has(LOCALE_HEADER)) {
    const headers = new Headers(request.headers);
    if (locale) headers.set(LOCALE_HEADER, locale);
    else headers.delete(LOCALE_HEADER);
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

// Every request, so a custom domain is recognised on any path; Next's own static files are left alone.
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
