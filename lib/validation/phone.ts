/**
 * A phone number as international digits without "+" (what wa.me and tel: expect), or null.
 * Turkish local forms are assumed when there is no country code: "0532 …" and "532 …" → "90532…".
 */
export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!/^[+\d\s().-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

/** "905321234567" → "+90 532 123 45 67" for Turkish mobiles, "+<digits>" otherwise. */
export function formatPhone(digits: string): string {
  const tr = digits.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return tr ? `+90 ${tr[1]} ${tr[2]} ${tr[3]} ${tr[4]}` : `+${digits}`;
}
