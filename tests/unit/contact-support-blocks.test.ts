import { describe, expect, it } from "vitest";
import { detectBlock } from "@/features/editor/detect-block";
import { liveBlocks } from "@/lib/schedule";
import { parseBlock } from "@/lib/validation/blocks";
import { formatIban, normalizeIban } from "@/lib/validation/iban";
import { formatPhone, normalizePhone } from "@/lib/validation/phone";
import { buildVcard, vcardFileName } from "@/lib/vcard";

// A published sample IBAN with a correct check digit.
const IBAN = "TR330006100519786457841326";

describe("IBAN", () => {
  it("accepts a valid IBAN in any common spelling", () => {
    expect(normalizeIban(IBAN)).toBe(IBAN);
    expect(normalizeIban("tr33 0006 1005 1978 6457 8413 26")).toBe(IBAN);
    expect(normalizeIban("TR33-0006-1005-1978-6457-8413-26")).toBe(IBAN);
  });

  it("accepts other countries too", () => {
    expect(normalizeIban("DE89 3704 0044 0532 0130 00")).toBe("DE89370400440532013000");
    expect(normalizeIban("GB29NWBK60161331926819")).toBe("GB29NWBK60161331926819");
    expect(normalizeIban("NL91ABNA0417164300")).toBe("NL91ABNA0417164300");
  });

  it("rejects a wrong check digit, length or shape", () => {
    expect(normalizeIban("TR340006100519786457841326")).toBeNull();
    expect(normalizeIban("TR33000610051978645784132")).toBeNull();
    expect(normalizeIban("DE88370400440532013000")).toBeNull();
    expect(normalizeIban("1234567890123456")).toBeNull();
    expect(normalizeIban("")).toBeNull();
  });

  it("groups by four for reading", () => {
    expect(formatIban(IBAN)).toBe("TR33 0006 1005 1978 6457 8413 26");
  });
});

describe("phone", () => {
  it("reads Turkish local forms and international numbers", () => {
    expect(normalizePhone("0532 123 45 67")).toBe("905321234567");
    expect(normalizePhone("532 123 45 67")).toBe("905321234567");
    expect(normalizePhone("+90 (532) 123-45-67")).toBe("905321234567");
    expect(normalizePhone("0049 30 1234567")).toBe("49301234567");
    expect(normalizePhone("+1 415 555 0100")).toBe("14155550100");
  });

  it("refuses text and impossible lengths", () => {
    expect(normalizePhone("call me")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("+0 532 123 45 67")).toBeNull();
  });

  it("formats Turkish mobiles for display", () => {
    expect(formatPhone("905321234567")).toBe("+90 532 123 45 67");
    expect(formatPhone("14155550100")).toBe("+14155550100");
  });
});

describe("vCard", () => {
  it("escapes text values and uses CRLF lines", () => {
    const card = buildVcard({ name: "Ayşe; Yılmaz", org: "A, B", phone: "905321234567", email: "a@example.com", website: "https://a.example/" });
    expect(card).toContain("FN:Ayşe\\; Yılmaz\r\n");
    expect(card).toContain("ORG:A\\, B\r\n");
    expect(card).toContain("TEL;TYPE=CELL:+905321234567\r\n");
    expect(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(card.endsWith("END:VCARD\r\n")).toBe(true);
  });

  it("keeps a new line in a field from starting a new property", () => {
    expect(buildVcard({ name: "A\nEMAIL:evil@example.com", email: "a@example.com" })).not.toMatch(/\r\nEMAIL:evil/);
  });

  it("makes an ASCII file name", () => {
    expect(vcardFileName("Şükrü Işık")).toBe("sukru-isik.vcf");
    expect(vcardFileName("???")).toBe("contact.vcf");
  });
});

describe("contact and support block schemas", () => {
  it("support needs an IBAN or a link, and stores the IBAN normalised", () => {
    expect(parseBlock("SUPPORT", { name: "Ayşe", iban: "tr33 0006 1005 1978 6457 8413 26" })?.data).toMatchObject({ iban: IBAN });
    expect(parseBlock("SUPPORT", { name: "Ayşe", url: "papara.com/ayse" })?.data).toMatchObject({ url: "https://papara.com/ayse" });
    expect(parseBlock("SUPPORT", { name: "Ayşe" })).toBeNull();
    expect(parseBlock("SUPPORT", { name: "Ayşe", iban: "TR00" })).toBeNull();
    expect(parseBlock("SUPPORT", { name: "Ayşe", url: "javascript:alert(1)" })).toBeNull();
  });

  it("whatsapp stores digits only", () => {
    expect(parseBlock("WHATSAPP", { phone: "0532 123 45 67", message: "Merhaba" })?.data).toEqual({ phone: "905321234567", message: "Merhaba" });
    expect(parseBlock("WHATSAPP", { phone: "wa.me/905321234567" })).toBeNull();
  });

  it("contact needs a way to reach the person", () => {
    expect(parseBlock("CONTACT", { name: "Ayşe", email: "ayse@example.com" })).not.toBeNull();
    expect(parseBlock("CONTACT", { name: "Ayşe" })).toBeNull();
    expect(parseBlock("CONTACT", { name: "Ayşe", email: "not-an-email" })).toBeNull();
  });

  it("product needs a safe link and keeps the sponsored flag", () => {
    expect(parseBlock("PRODUCT", { title: "Tişört", url: "shop.example.com/t", price: "₺249", sponsored: "1" })?.data).toMatchObject({ url: "https://shop.example.com/t", sponsored: "1" });
    expect(parseBlock("PRODUCT", { title: "Tişört", url: "javascript:alert(1)" })).toBeNull();
    expect(parseBlock("PRODUCT", { title: "Tişört", url: "shop.example.com", img: "https://evil.example/a.png" })).toBeNull();
  });

  it("countdown needs a real date and defaults to hiding when it ends", () => {
    expect(parseBlock("COUNTDOWN", { title: "Konser", target: "2030-01-01T18:00:00.000Z" })?.data).toMatchObject({ after: "hide" });
    expect(parseBlock("COUNTDOWN", { title: "Konser", target: "yarın" })).toBeNull();
  });

  it("an ended countdown set to hide leaves the page; one showing text stays", () => {
    const past = "2000-01-01T00:00:00.000Z";
    const blocks = [
      { id: "a", type: "COUNTDOWN", data: { title: "x", target: past }, startsAt: null, endsAt: null },
      { id: "b", type: "COUNTDOWN", data: { title: "x", target: past, after: "text", afterText: "Başladı" }, startsAt: null, endsAt: null },
    ];
    expect(liveBlocks(blocks).map((b) => b.id)).toEqual(["b"]);
  });
});

describe("pasting a WhatsApp link", () => {
  it("becomes a WhatsApp button with its prefilled message", () => {
    expect(detectBlock("https://wa.me/905321234567?text=Merhaba")).toEqual({ kind: "WHATSAPP", phone: "905321234567", message: "Merhaba" });
    expect(detectBlock("api.whatsapp.com/send?phone=905321234567")).toEqual({ kind: "WHATSAPP", phone: "905321234567" });
    expect(detectBlock("https://wa.me/")?.kind).toBe("LINK");
  });
});
