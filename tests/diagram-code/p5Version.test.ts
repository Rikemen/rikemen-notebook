import { describe, expect, it } from "vitest";
import { detectP5Version, isAllowedP5CdnUrl } from "@/features/diagram-code/p5Version";

describe("p5Version", () => {
  it("jsDelivrのp5.jsバージョンを検出する", () => {
    expect(
      detectP5Version('<script src="https://cdn.jsdelivr.net/npm/p5@2.3.0/lib/p5.js"></script>'),
    ).toBe("2.3.0");
    expect(isAllowedP5CdnUrl("https://cdn.jsdelivr.net/npm/p5@2.3.0/lib/p5.min.js")).toBe(true);
    expect(isAllowedP5CdnUrl("https://example.com/p5.js")).toBe(false);
  });
});
