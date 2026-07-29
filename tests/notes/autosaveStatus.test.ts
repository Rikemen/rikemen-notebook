import { describe, expect, it } from "vitest";
import { autosaveStatusLabel, createAutosaveStatus } from "@/features/notes/autosaveStatus";

describe("autosaveStatus", () => {
  it("初期状態のラベルを返す", () => {
    expect(autosaveStatusLabel(createAutosaveStatus())).toBe("変更はありません");
  });

  it("保存状態ごとのラベルを返す", () => {
    expect(
      autosaveStatusLabel({
        errorMessage: "",
        savedAt: null,
        state: "saving",
      }),
    ).toBe("保存中");
    expect(
      autosaveStatusLabel({
        errorMessage: "",
        savedAt: "12:00",
        state: "saved",
      }),
    ).toBe("保存済み 12:00");
    expect(
      autosaveStatusLabel({
        errorMessage: "ネットワークエラー",
        savedAt: null,
        state: "failed",
      }),
    ).toBe("ネットワークエラー");
  });
});

