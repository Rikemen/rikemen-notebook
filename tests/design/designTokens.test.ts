import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("designTokens", () => {
  it("DESIGN.md由来の主要CSS変数を定義する", () => {
    const css = readFileSync("src/styles/base/tokens.css", "utf8");

    expect(css).toContain("--color-bg");
    expect(css).toContain("--color-blue");
    expect(css).toContain("--color-red");
    expect(css).toContain("--shadow-raised");
    expect(css).toContain("--radius-lg");
  });
});
