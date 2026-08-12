import { describe, expect, it } from "vitest";
import {
  calculatePinchZoom,
  clampMaterialZoom,
  decreaseMaterialZoom,
  DEFAULT_MATERIAL_ZOOM,
  increaseMaterialZoom,
  MAX_MATERIAL_ZOOM,
  MIN_MATERIAL_ZOOM,
  resetMaterialZoom,
} from "@/features/textbook/materialPreviewZoom";

describe("materialPreviewZoom", () => {
  it("ズーム倍率を25%から800%へ制限し、異常値は100%へ戻す", () => {
    expect(MIN_MATERIAL_ZOOM).toBe(0.25);
    expect(DEFAULT_MATERIAL_ZOOM).toBe(1);
    expect(MAX_MATERIAL_ZOOM).toBe(8);
    expect(clampMaterialZoom(0.1)).toBe(0.25);
    expect(clampMaterialZoom(2.345)).toBe(2.35);
    expect(clampMaterialZoom(9)).toBe(8);
    expect(clampMaterialZoom(Number.NaN)).toBe(1);
    expect(clampMaterialZoom(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it("25%刻みで拡大縮小し、100%へリセットする", () => {
    expect(increaseMaterialZoom(1)).toBe(1.25);
    expect(increaseMaterialZoom(8)).toBe(8);
    expect(decreaseMaterialZoom(1)).toBe(0.75);
    expect(decreaseMaterialZoom(0.25)).toBe(0.25);
    expect(resetMaterialZoom()).toBe(1);
  });

  it("2本指の距離変化を開始倍率へ反映する", () => {
    expect(calculatePinchZoom(1.5, 100, 200)).toBe(3);
    expect(calculatePinchZoom(1, 100, 25)).toBe(0.25);
    expect(calculatePinchZoom(4, 100, 300)).toBe(8);
    expect(calculatePinchZoom(2, 0, 200)).toBe(2);
    expect(calculatePinchZoom(2, 100, Number.NaN)).toBe(2);
  });
});
