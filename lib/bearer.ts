import { timingSafeEqual } from "node:crypto";

/** True when the Authorization header is exactly `Bearer <secret>`, compared in constant time. */
export function hasBearer(header: string | null, secret: string): boolean {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
