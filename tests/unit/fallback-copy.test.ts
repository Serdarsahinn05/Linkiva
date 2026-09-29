import { describe, expect, it } from "vitest";
import { errorCopy } from "@/features/errors/fallback-copy";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

describe("errorCopy", () => {
  it("matches messages.errors in both languages", () => {
    for (const [locale, messages] of [["tr", tr], ["en", en]] as const) {
      const { errorTitle, errorBody, retry, home } = messages.errors;
      expect(errorCopy[locale]).toEqual({ errorTitle, errorBody, retry, home });
    }
  });
});
