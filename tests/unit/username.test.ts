import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESERVED_USERNAMES, sanitizeUsernameInput, toUsernameCandidate, usernameProblem, usernameSchema } from "@/lib/validation/username";

describe("usernameProblem", () => {
  it.each([
    ["serdar", null],
    ["serdar.dev", null],
    ["a_b-c", null],
    ["ab", "tooShort"],
    ["a".repeat(31), "tooLong"],
    [".serdar", "invalid"],
    ["serdar.", "invalid"],
    ["Serdar", "invalid"],
    ["şahin", "invalid"],
    ["ser dar", "invalid"],
    ["dashboard", "reserved"],
    ["linkiva", "reserved"],
  ])("%s → %s", (input, expected) => {
    expect(usernameProblem(input)).toBe(expected);
  });

  it("schema lowercases and trims before validating", () => {
    expect(usernameSchema.parse("  Serdar  ")).toBe("serdar");
    expect(usernameSchema.safeParse("login").success).toBe(false);
  });
});

describe("toUsernameCandidate", () => {
  it("transliterates Turkish and strips invalid characters", () => {
    expect(toUsernameCandidate("Serdar Şahin")).toBe("serdar.sahin");
    expect(toUsernameCandidate("  IŞIK  Ağaç!! ")).toBe("isik.agac");
    expect(toUsernameCandidate("..çöp--")).toBe("cop");
  });
});

describe("reserved list covers every top-level route", () => {
  // Walk app/ and collect the first real URL segment of every route (route groups are transparent).
  const topLevel = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (name.startsWith("(") && name.endsWith(")")) walk(join(dir, name));
      else if (!name.startsWith("[") && !name.startsWith("_") && !name.startsWith("@")) topLevel.add(name);
    }
  };
  walk(join(process.cwd(), "app"));

  it("has no unreserved segment", () => {
    expect([...topLevel].filter((segment) => !RESERVED_USERNAMES.has(segment))).toEqual([]);
  });
});

describe("sanitizeUsernameInput", () => {
  it("keeps edge separators while typing", () => {
    expect(sanitizeUsernameInput("serdar.")).toBe("serdar.");
    expect(sanitizeUsernameInput("Şahin Dev")).toBe("sahin.dev");
    expect(sanitizeUsernameInput("a@b#c")).toBe("abc");
  });
});

describe("accents", () => {
  it("folds non-Turkish accents instead of dropping the letter", () => {
    expect(toUsernameCandidate("José Müller")).toBe("jose.muller");
  });
});
