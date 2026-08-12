import { describe, expect, it } from "vitest";
import { createPdfLoadProgress, initialPdfLoadState } from "@/features/textbook/pdfLoadState";

describe("pdfLoadState", () => {
  it("初期状態はidleである", () => {
    expect(initialPdfLoadState()).toEqual({ progress: null, status: "idle" });
  });

  it("既知の総byte数から0〜1の進捗率を作る", () => {
    expect(createPdfLoadProgress(50, 100)).toEqual({ loadedBytes: 50, ratio: 0.5, totalBytes: 100 });
    expect(createPdfLoadProgress(150, 100)?.ratio).toBe(1);
    expect(createPdfLoadProgress(-1, 100)?.ratio).toBe(0);
  });

  it("総byte数が不明な場合も読込byte数を保持する", () => {
    expect(createPdfLoadProgress(1024, 0)).toEqual({ loadedBytes: 1024, ratio: null, totalBytes: null });
  });
});
