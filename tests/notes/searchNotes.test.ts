import { describe, expect, it } from "vitest";
import { initialMathNotes } from "@/features/notes/fixtures";
import { searchNotes } from "@/features/notes/searchNotes";

describe("searchNotes", () => {
  it("空検索ではすべて返す", () => {
    expect(searchNotes(initialMathNotes, {})).toHaveLength(2);
  });

  it("タイトルで検索する", () => {
    expect(searchNotes(initialMathNotes, { keyword: "微分" }).map((note) => note.id)).toEqual(["calculus-note"]);
  });

  it("キーワードはタイトルとタグを横断検索する", () => {
    expect(searchNotes(initialMathNotes, { keyword: "線形" }).map((note) => note.id)).toEqual([]);
    expect(searchNotes(initialMathNotes, { keyword: "行列" }).map((note) => note.id)).toEqual(["linear-algebra-note"]);
  });

  it("タグで検索する", () => {
    expect(searchNotes(initialMathNotes, { tag: "行列" }).map((note) => note.id)).toEqual(["linear-algebra-note"]);
  });

  it("大文字小文字と全角半角の差を吸収して検索する", () => {
    const notes = [
      {
        ...initialMathNotes[0],
        id: "abc-note",
        tags: ["ＡＢＣ"],
        title: "Complex ABC",
      },
    ];

    expect(searchNotes(notes, { keyword: "ａｂｃ" }).map((note) => note.id)).toEqual(["abc-note"]);
  });
});
