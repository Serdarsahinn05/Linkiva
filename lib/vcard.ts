export type Contact = { name: string; title?: string; org?: string; phone?: string; email?: string; website?: string };

// vCard 3.0 (RFC 2426) text values escape backslash, comma, semicolon and newlines.
const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");

/** A contact card phones can add to their address book. `phone` is international digits (lib/validation/phone.ts). */
export function buildVcard(contact: Contact): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escape(contact.name)}`, `N:${escape(contact.name)};;;;`];
  if (contact.org) lines.push(`ORG:${escape(contact.org)}`);
  if (contact.title) lines.push(`TITLE:${escape(contact.title)}`);
  if (contact.phone) lines.push(`TEL;TYPE=CELL:+${contact.phone}`);
  if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(contact.email)}`);
  if (contact.website) lines.push(`URL:${contact.website}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

/** A safe file name for the download: letters and digits only. */
export const vcardFileName = (name: string) =>
  `${
    name
      .replace(/ı/g, "i")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "contact"
  }.vcf`;
