import { describe, expect, it } from "vitest";
import { LARGE_PDF_PAGE_THRESHOLD, LARGE_PDF_SIZE_THRESHOLD_BYTES, largePdfNotice } from "@/features/textbook/largePdfPolicy";

describe("largePdfPolicy", () => {
  it("100MiBまたは500ページ以上を大容量として案内する", () => {
    expect(largePdfNotice(LARGE_PDF_SIZE_THRESHOLD_BYTES, 1)).toContain("大きなPDF");
    expect(largePdfNotice(1, LARGE_PDF_PAGE_THRESHOLD)).toContain("大きなPDF");
  });

  it("閾値未満では案内しない", () => {
    expect(largePdfNotice(LARGE_PDF_SIZE_THRESHOLD_BYTES - 1, LARGE_PDF_PAGE_THRESHOLD - 1)).toBe("");
  });
});
