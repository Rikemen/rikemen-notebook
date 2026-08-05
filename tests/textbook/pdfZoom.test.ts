import { describe, expect, it } from "vitest";
import {
  calculatePinchZoom,
  clampPdfZoom,
  decreasePdfZoom,
  increasePdfZoom,
} from "@/features/textbook/pdfZoom";

describe("pdfZoom", () => {
  it("ズーム倍率を100%から400%へ制限する", () => {
    expect(clampPdfZoom(0.5)).toBe(1);
    expect(clampPdfZoom(2.345)).toBe(2.35);
    expect(clampPdfZoom(5)).toBe(4);
    expect(clampPdfZoom(Number.NaN)).toBe(1);
    expect(clampPdfZoom(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it("25%刻みで拡大と縮小を行う", () => {
    expect(increasePdfZoom(1)).toBe(1.25);
    expect(increasePdfZoom(4)).toBe(4);
    expect(decreasePdfZoom(1.5)).toBe(1.25);
    expect(decreasePdfZoom(1)).toBe(1);
  });

  it("2本指の距離変化を開始倍率へ反映する", () => {
    expect(calculatePinchZoom(1.5, 100, 200)).toBe(3);
    expect(calculatePinchZoom(1.5, 100, 50)).toBe(1);
    expect(calculatePinchZoom(2, 0, 200)).toBe(2);
    expect(calculatePinchZoom(2, 100, Number.NaN)).toBe(2);
  });
});
