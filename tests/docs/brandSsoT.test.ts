import { describe, expect, it } from "vitest";
import rule from "../../.agent/rules/design-system-source-of-truth.md?raw";

describe("brandSsoT", () => {
  it("アプリ名称をGauss Notebookとして固定する", () => {
    expect(rule).toContain("アプリ");
    expect(rule).toContain("Gauss Notebook");
    expect(rule).toContain("domain");
  });
});

