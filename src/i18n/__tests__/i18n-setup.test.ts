import { describe, it, expect } from "vitest";
import i18n, { supportedLngs, namespaces } from "../index";

describe("i18n setup", () => {
  it("supports Traditional Chinese and English", () => {
    expect(supportedLngs).toContain("zh-Hant");
    expect(supportedLngs).toContain("en");
  });

  it("has English resource bundles for all namespaces", () => {
    for (const ns of namespaces) {
      expect(i18n.hasResourceBundle("en", ns)).toBe(true);
    }
  });

  it("falls back to Traditional Chinese, then English", () => {
    expect(i18n.options.fallbackLng).toEqual(["zh-Hant", "en"]);
  });
});
