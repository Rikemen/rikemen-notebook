import { describe, expect, it } from "vitest";
import {
  MAX_MATERIAL_DISPLAY_NAME_LENGTH,
  validateMaterialDisplayName,
} from "@/features/textbook/materialDisplayName";

describe("materialDisplayName", () => {
  it("前後空白を除いた資料名を返す", () => {
    expect(validateMaterialDisplayName("  解析学.pdf  ")).toEqual({
      displayName: "解析学.pdf",
      ok: true,
    });
  });

  it("空文字、長すぎる名前、制御文字を拒否する", () => {
    expect(validateMaterialDisplayName("   ").ok).toBe(false);
    expect(validateMaterialDisplayName("a".repeat(MAX_MATERIAL_DISPLAY_NAME_LENGTH + 1)).ok).toBe(false);
    expect(validateMaterialDisplayName("解析\n学.pdf").ok).toBe(false);
    expect(validateMaterialDisplayName("解析\u0000学.pdf").ok).toBe(false);
  });

  it("1文字と120文字の境界値を受け付ける", () => {
    expect(validateMaterialDisplayName("a").ok).toBe(true);
    expect(validateMaterialDisplayName("a".repeat(MAX_MATERIAL_DISPLAY_NAME_LENGTH)).ok).toBe(true);
  });
});
