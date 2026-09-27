/**
 * Any country's IBAN in any common spelling ("tr33 0006 1005 …", "DE89-3704-…") → compact upper case, or null.
 * Checked by ISO 13616 shape (country letters, two check digits, 11–30 characters) and the mod-97 check digits,
 * which catch almost every typo. A few known lengths are enforced exactly on top.
 */
export function normalizeIban(input: string): string | null {
  const iban = input.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return null;
  const length = KNOWN_LENGTHS[iban.slice(0, 2)];
  if (length && iban.length !== length) return null;
  // Move the first four characters to the end, letters → numbers (A=10…), remainder mod 97 must be 1.
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  return remainder === 1 ? iban : null;
}

// Lengths of the countries our users are most likely to have accounts in (ISO 13616 registry).
const KNOWN_LENGTHS: Record<string, number> = { TR: 26, DE: 22, NL: 18, FR: 27, GB: 22, AT: 20, BE: 16, CH: 21, ES: 24, IT: 27, AZ: 28 };

/** Groups of four for reading aloud and copying by eye: "TR33 0006 1005 …". */
export const formatIban = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();
