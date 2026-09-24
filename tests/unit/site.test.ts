import { describe, expect, it } from "vitest";
import { profileDisplayUrl, profileUrl, site } from "@/lib/site";

describe("site urls", () => {
  it("builds profile urls from the single configured origin", () => {
    expect(profileUrl("serdar")).toBe(`${site.url}/serdar`);
    expect(profileDisplayUrl("serdar")).toBe(`${site.host}/serdar`);
    expect(site.url.endsWith("/")).toBe(false);
  });
});
