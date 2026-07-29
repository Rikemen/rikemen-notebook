import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("documentMetadata", () => {
  it("ブラウザタイトルをGauss Notebookにする", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain("<title>Gauss Notebook</title>");
    expect(html).not.toContain("firebase-vue3-startup-kit");
  });

  it("favicon.pngをfaviconとして参照する", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain('rel="icon"');
    expect(html).toContain('href="/favicon.png"');
    expect(html).toContain('type="image/png"');
    expect(html).not.toContain("/favicon.ico");
    expect(existsSync("public/favicon.png")).toBe(true);
  });
});
