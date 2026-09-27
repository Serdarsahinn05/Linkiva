import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/features/editor/templates";
import { blockDefaults, parseBlock, splitList } from "@/lib/validation/blocks";
import { resolveAppearance } from "@/themes";

describe("portfolio blocks (ROADMAP Faz 12)", () => {
  it("keeps comma lists tidy: trimmed, de-duplicated, empty items dropped", () => {
    expect(splitList(" next.js ,React,, react , postgres  sql ")).toEqual(["next.js", "React", "postgres sql"]);
    expect(parseBlock("PROJECT", { title: "Linkiva", tags: "a, b, a" })?.data).toMatchObject({ tags: "a, b" });
  });

  it("a project needs a name; its addresses must be safe and its tags few and short", () => {
    expect(parseBlock("PROJECT", { title: "" })).toBeNull();
    expect(parseBlock("PROJECT", { title: "x", repo: "javascript:alert(1)" })).toBeNull();
    expect(parseBlock("PROJECT", { title: "x", tags: "a,b,c,d,e,f,g,h,i" })).toBeNull();
    expect(parseBlock("PROJECT", { title: "x", stars: "12k" })).toBeNull();
    expect(parseBlock("PROJECT", { title: "x", repo: "github.com/a/b" })?.data).toMatchObject({ repo: "https://github.com/a/b" });
  });

  it("experience dates are a year or a month, and the end cannot come first", () => {
    expect(parseBlock("EXPERIENCE", { role: "Stajyer", start: "2025-06", end: "" })?.data).toMatchObject({ start: "2025-06", end: undefined });
    expect(parseBlock("EXPERIENCE", { role: "Stajyer", start: "2022", end: "2026" })).not.toBeNull();
    expect(parseBlock("EXPERIENCE", { role: "Stajyer", start: "2025-06", end: "2024-01" })).toBeNull();
    expect(parseBlock("EXPERIENCE", { role: "Stajyer", start: "06/2025" })).toBeNull();
  });

  it("a skill list needs at least one skill and at most 30", () => {
    expect(parseBlock("SKILLS", { items: "" })).toBeNull();
    expect(parseBlock("SKILLS", { items: Array.from({ length: 31 }, (_, i) => `s${i}`).join(",") })).toBeNull();
    expect(parseBlock("SKILLS", { title: "Diller", items: "typescript, c#" })).not.toBeNull();
  });

  it("templates add portfolio blocks only as unfinished drafts, never made-up content", () => {
    for (const type of new Set([...TEMPLATES.developer, ...TEMPLATES.designer])) {
      if (type === "PROJECT" || type === "EXPERIENCE" || type === "SKILLS") expect(parseBlock(type, blockDefaults[type]), type).toBeNull();
    }
  });

  it("the portfolio theme shows projects as tiles unless the owner picked the list", () => {
    expect(resolveAppearance("portfolyo", {})).toMatchObject({ layout: "grid", button: "outline", scene: "soft" });
    expect(resolveAppearance("portfolyo", { layout: "list" }).layout).toBe("list");
  });
});
