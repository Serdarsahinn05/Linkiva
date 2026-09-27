import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; Vercel's API is a fake that records what it was asked.
const actingUser = vi.hoisted(() => ({ id: "" }));
const vercel = vi.hoisted(() => ({ added: [] as string[], removed: [] as string[], refuse: new Set<string>(), live: new Set<string>() }));
vi.mock("@/lib/session", () => ({ requireUser: async () => ({ id: actingUser.id }), UnauthorizedError: class extends Error {} }));
vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }), cookies: async () => new Map() }));
vi.mock("@/lib/features", () => ({ features: { domains: true, google: false, uploads: false, cron: false } }));
vi.mock("@/lib/vercel-domains", () => {
  class DomainUnavailableError extends Error {}
  return {
    DomainUnavailableError,
    addDomain: async (name: string) => {
      if (vercel.refuse.has(name)) throw new DomainUnavailableError(name);
      vercel.added.push(name);
    },
    domainStatus: async (name: string) => ({ verified: vercel.live.has(name), misconfigured: !vercel.live.has(name), verification: [] }),
    removeDomain: async (name: string) => void vercel.removed.push(name),
  };
});

const { db } = await import("@/lib/db");
const domains = await import("@/features/domains/actions");
const { proxy } = await import("@/proxy");
const { NextRequest } = await import("next/server");

const suffix = Date.now().toString(36);
const ids = { alice: `dom-a-${suffix}`, bob: `dom-b-${suffix}` };
const host = (name: string) => `${name}-${suffix}.example`;

beforeAll(async () => {
  for (const [name, id] of Object.entries(ids)) {
    await db.user.create({ data: { id, name, email: `${id}@example.com`, emailVerified: true, profile: { create: { username: id } } } });
  }
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("custom domains belong to one profile (ROADMAP Faz 11)", () => {
  it("adds the owner's domain, unverified, and only one per profile", async () => {
    actingUser.id = ids.alice;
    const added = await domains.addCustomDomain(`https://${host("alice")}/`);
    expect(added).toMatchObject({ ok: true, data: { hostname: host("alice"), verified: false, record: { type: "A", name: "@" } } });
    expect(vercel.added).toContain(host("alice"));
    expect(await domains.addCustomDomain(host("alice2"))).toEqual({ ok: false, error: "exists" });
  });

  it("a name someone else holds and a name Vercel refuses get the same answer", async () => {
    actingUser.id = ids.bob;
    expect(await domains.addCustomDomain(host("alice"))).toEqual({ ok: false, error: "unavailable" });
    vercel.refuse.add(host("taken"));
    expect(await domains.addCustomDomain(host("taken"))).toEqual({ ok: false, error: "unavailable" });
    expect(await domains.addCustomDomain("localhost")).toEqual({ ok: false, error: "invalid" });
  });

  it("checking and removing only ever touch the caller's own domain", async () => {
    actingUser.id = ids.bob; // has none
    expect(await domains.checkCustomDomain()).toEqual({ ok: false, error: "notFound" });
    expect(await domains.removeCustomDomain()).toEqual({ ok: false, error: "notFound" });
    expect(vercel.removed).not.toContain(host("alice"));
    expect(await db.customDomain.count({ where: { hostname: host("alice") } })).toBe(1);
  });

  it("serves the profile only once verified, and only its own pages", async () => {
    const request = (path: string) => new NextRequest(`http://${host("alice")}${path}`, { headers: { host: host("alice") } });
    const rewrite = async (path: string) => {
      const res = await proxy(request(path));
      return { status: res.status, to: res.headers.get("x-middleware-rewrite") };
    };
    const notFound = new URL("/_domain/not-found", `http://${host("alice")}`).href;
    expect(await rewrite("/")).toEqual({ status: 200, to: notFound }); // not verified yet: the site's 404 page

    actingUser.id = ids.alice;
    vercel.live.add(host("alice"));
    expect(await domains.checkCustomDomain()).toMatchObject({ ok: true, data: { verified: true } });
    // The proxy remembers a miss for a minute; a fresh host name stands in for "a minute later".
    await db.customDomain.update({ where: { hostname: host("alice") }, data: { hostname: host("alice-live") } });
    const live = (path: string) => proxy(new NextRequest(`http://${host("alice-live")}${path}`, { headers: { host: host("alice-live") } }));
    expect(new URL((await live("/")).headers.get("x-middleware-rewrite")!).pathname).toBe(`/${ids.alice}`);
    expect(new URL((await live("/story")).headers.get("x-middleware-rewrite")!).pathname).toBe(`/${ids.alice}/story`);
    expect(new URL((await live("/dashboard")).headers.get("x-middleware-rewrite")!).pathname).toBe("/_domain/not-found");
    expect(new URL((await live(`/${ids.bob}`)).headers.get("x-middleware-rewrite")!).pathname).toBe("/_domain/not-found");
    expect((await live("/l/some-block")).headers.get("x-middleware-rewrite")).toBeNull(); // passes through
  });

  it("removes the owner's domain from Vercel and from the profile", async () => {
    actingUser.id = ids.alice;
    expect(await domains.removeCustomDomain()).toEqual({ ok: true, data: null });
    expect(vercel.removed).toContain(host("alice-live"));
    expect(await db.customDomain.count({ where: { profile: { userId: ids.alice } } })).toBe(0);
  });
});
