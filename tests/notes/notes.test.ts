import { describe, expect, it } from "vitest";
import { initialMathNotes } from "@/features/notes/fixtures";

describe("notes", () => {
  it("数学ノートの初期データは所有者と一覧表示に必要な項目を持つ", () => {
    const note = initialMathNotes[0];

    expect(note).toMatchObject({
      favorite: true,
      ownerUid: "user-1",
      subject: "微積分",
      title: "微分の基礎",
    });
    expect(note?.tags).toContain("導関数");
    expect(note?.updatedAt).toMatch("2026-07-28");
  });
});

