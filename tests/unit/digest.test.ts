import { describe, expect, it, vi } from "vitest";

// The token module reads the auth secret; unit tests run without an environment.
vi.mock("@/lib/env", () => ({ env: { BETTER_AUTH_SECRET: "unit-test-secret-unit-test-secret-32" } }));
import { insightText, weekStart } from "@/features/digest/format";
import { unsubscribeToken, verifyUnsubscribeToken } from "@/features/digest/token";
import { renderDigest, type DigestMail } from "@/lib/mail/templates";

const sample: DigestMail = {
  views: 1284,
  clicks: 342,
  viewsTrend: 0.18,
  clicksTrend: null,
  topLinks: [{ title: "Portfolyo <b>", clicks: 121 }],
  insight: "Peak & quiet",
  unsubscribeUrl: "https://x.test/unsubscribe?t=a.b&c=1",
};

describe("unsubscribe token", () => {
  it("round-trips and rejects tampering", () => {
    const token = unsubscribeToken("profile-1");
    expect(verifyUnsubscribeToken(token)).toBe("profile-1");
    expect(verifyUnsubscribeToken(token.replace("profile-1", "profile-2"))).toBeNull();
    expect(verifyUnsubscribeToken(`${token}x`)).toBeNull();
    expect(verifyUnsubscribeToken("profile-1")).toBeNull();
    expect(verifyUnsubscribeToken(undefined)).toBeNull();
    expect(verifyUnsubscribeToken(".abc")).toBeNull();
  });
});

describe("weekStart", () => {
  it("is Monday 00:00 UTC of the same week", () => {
    expect(weekStart(new Date("2026-09-28T06:00:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z"); // Monday
    expect(weekStart(new Date("2026-10-04T23:59:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z"); // Sunday
    expect(weekStart(new Date("2026-10-01T12:00:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z"); // Thursday
  });
});

describe("insightText", () => {
  it("fills the analytics copy as plain text in both languages", () => {
    const tr = insightText({ kind: "peakHours", from: 20, to: 23, share: 0.41 }, "tr");
    expect(tr).toContain("20:00–23:00");
    expect(tr).not.toMatch(/[<>{}]/);
    const en = insightText({ kind: "linkChange", linkTitle: "Shop", change: -0.4 }, "en");
    expect(en).toContain("Shop");
    expect(en).toContain("40%");
    expect(en).not.toMatch(/[<>{}]/);
  });
});

describe("renderDigest", () => {
  it("renders figures, escapes user text and carries the opt-out link in both parts", () => {
    for (const locale of ["tr", "en"] as const) {
      const { subject, html, text } = renderDigest(locale, sample);
      expect(subject.length).toBeGreaterThan(0);
      expect(html).toContain(locale === "tr" ? "1.284" : "1,284");
      expect(html).toContain("Portfolyo &lt;b&gt;");
      expect(html).not.toContain("<b>");
      expect(html).toContain("Peak &amp; quiet");
      expect(html).toContain("unsubscribe?t=a.b&amp;c=1");
      expect(text).toContain(sample.unsubscribeUrl);
      expect(text).toContain("/dashboard/analytics");
      expect(html + text).not.toMatch(/\{(views|clicks)\}/);
    }
  });

  it("leaves out empty parts", () => {
    const { html, text } = renderDigest("en", { ...sample, topLinks: [], insight: null, viewsTrend: null });
    expect(html).not.toContain("Most clicked");
    expect(text).not.toContain("Most clicked");
    expect(text).not.toContain("vs the week before");
  });
});
