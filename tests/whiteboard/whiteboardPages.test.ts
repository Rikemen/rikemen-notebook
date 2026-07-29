import { describe, expect, it, vi } from "vitest";
import { addWhiteboardPage, createInitialWhiteboardState, selectWhiteboardPage } from "@/features/whiteboard/whiteboardPages";

describe("whiteboardPages", () => {
  it("初期ページを作成する", () => {
    vi.setSystemTime(new Date("2026-07-28T00:00:00.000Z"));
    const state = createInitialWhiteboardState("note-1");

    expect(state.selectedPageId).toBe("page-1");
    expect(state.pages[0]).toMatchObject({
      markdown: "# ノート\n\nここにMarkdownで記入できます。",
      noteId: "note-1",
      title: "ページ 1",
    });
  });

  it("ページ追加と選択を行う", () => {
    const state = addWhiteboardPage(createInitialWhiteboardState("note-1"), "note-1");

    expect(state.selectedPageId).toBe("page-2");
    expect(state.pages[1]?.markdown).toBe("");
    expect(selectWhiteboardPage(state, "page-1").selectedPageId).toBe("page-1");
  });
});
