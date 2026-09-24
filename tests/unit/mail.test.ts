import { describe, expect, it } from "vitest";
import { MAIL_KINDS, renderMail } from "@/lib/mail/templates";

describe("renderMail", () => {
  it("fills placeholders and escapes them in every kind and locale", () => {
    for (const kind of MAIL_KINDS) {
      for (const locale of ["tr", "en"] as const) {
        const { subject, html, text } = renderMail(kind, locale, { url: "https://x.test/a?b=1&c=2", newEmail: "n@x.test" });
        expect(subject.length, `${kind}/${locale}`).toBeGreaterThan(0);
        expect(html + text).not.toMatch(/\{(url|newEmail)\}/);
        expect(html).not.toContain("?b=1&c=2");
      }
    }
  });

  it("mentions the new address in the old-address approval mail", () => {
    expect(renderMail("changeEmailConfirm", "tr", { url: "https://x.test", newEmail: "n@x.test" }).text).toContain("n@x.test");
  });

  it("omits the button when a kind has no call to action", () => {
    expect(renderMail("accountDeleted", "en").html).not.toContain("border-radius:999px;padding:15px");
  });
});
