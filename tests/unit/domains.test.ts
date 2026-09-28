import { describe, expect, it } from "vitest";
import { dnsRecord, domainRoute } from "@/lib/custom-domains";
import { referrerHost } from "@/lib/tracking";
import { parseHostname } from "@/lib/validation/hostname";

describe("custom domain names (ROADMAP Faz 11)", () => {
  it("accepts what people type and keeps only the host name", () => {
    expect(parseHostname("Serdar.com")).toBe("serdar.com");
    expect(parseHostname("https://www.serdar.com/")).toBe("www.serdar.com");
    expect(parseHostname("link.serdar.com.tr.")).toBe("link.serdar.com.tr");
    expect(parseHostname("şahin.dev")).toBe("xn--ahin-45a.dev");
  });

  it("refuses anything that is not a plain public domain, or is ours", () => {
    for (const bad of ["", "serdar", "localhost", "127.0.0.1", "[::1]", "serdar.com:8080", "serdar.com/path", "serdar.com?x=1", "user@serdar.com", "-bad.com", "a..b.com", "serdar.123"]) {
      expect(parseHostname(bad), bad).toBeNull();
    }
    for (const ours of ["localhost:3000", "x.localhost", "app.vercel.app"]) expect(parseHostname(ours), ours).toBeNull();
  });
});

describe("what the proxy does with a request", () => {
  it("leaves our own host and Vercel previews alone", () => {
    expect(domainRoute("localhost:3000", "/dashboard")).toEqual({ kind: "main" });
    expect(domainRoute("linkiva-git-x.vercel.app", "/")).toEqual({ kind: "main" });
    expect(domainRoute("127.0.0.1:3000", "/")).toEqual({ kind: "main" });
  });

  it("on a custom domain: the profile's pages, the paths they call, and nothing else", () => {
    expect(domainRoute("serdar.com", "/")).toEqual({ kind: "profile", path: "" });
    expect(domainRoute("serdar.com", "/story")).toEqual({ kind: "profile", path: "/story" });
    expect(domainRoute("serdar.com", "/opengraph-image-1uj0pv")).toEqual({ kind: "profile", path: "/opengraph-image-1uj0pv" });
    for (const pass of ["/l/abc123", "/l/abc123/gate", "/api/e", "/_next/static/chunk.js", "/icon.svg", "/favicon.ico"]) expect(domainRoute("serdar.com", pass), pass).toEqual({ kind: "pass" });
    for (const blocked of ["/dashboard", "/login", "/api/auth/sign-in", "/someone-else", "/l/a/b", "/api/upload", "/privacy"]) {
      expect(domainRoute("serdar.com", blocked), blocked).toEqual({ kind: "notFound" });
    }
  });

  it("tells the owner which DNS record to add", () => {
    expect(dnsRecord("serdar.com")).toEqual({ type: "A", name: "@", value: "76.76.21.21" });
    expect(dnsRecord("serdar.com.tr")).toEqual({ type: "A", name: "@", value: "76.76.21.21" });
    expect(dnsRecord("link.serdar.com")).toEqual({ type: "CNAME", name: "link", value: "cname.vercel-dns.com" });
    expect(dnsRecord("a.b.serdar.com.tr")).toEqual({ type: "CNAME", name: "a.b", value: "cname.vercel-dns.com" });
  });

  it("does not count a click from the page's own custom domain as a traffic source", () => {
    expect(referrerHost("https://serdar.com/", ["linkiva.space", "serdar.com"])).toBeNull();
    expect(referrerHost("https://www.instagram.com/", ["linkiva.space", "serdar.com"])).toBe("instagram.com");
  });
});
