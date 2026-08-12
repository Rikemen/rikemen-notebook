import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const styles = readFileSync("src/styles/components/whiteboard-panel.css", "utf8");

describe("whiteboardPreviewStyles", () => {
  it("本文からh3・h2・h1を2pt刻みで大きくする", () => {
    expect(styles).toContain("font-size: calc(0.92rem + 2pt)");
    expect(styles).toContain("font-size: calc(0.92rem + 4pt)");
    expect(styles).toContain("font-size: calc(0.92rem + 6pt)");
  });

  it("コードブロックの上下余白と行高を確保する", () => {
    expect(styles).toContain("padding-block: var(--space-4)");
    expect(styles).toContain(".whiteboard-panel__preview pre > code");
    expect(styles).toContain("line-height: 1.7");
  });
});
