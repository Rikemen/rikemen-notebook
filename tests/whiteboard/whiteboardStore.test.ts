import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { createDrawingMarkdown, createWhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";
import { useWhiteboardStore } from "@/features/whiteboard/whiteboardStore";

describe("whiteboardStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("画像削除時にノート内の全ページから参照を除去する", () => {
    const store = useWhiteboardStore();
    const drawing = createWhiteboardDrawing({
      dataUrl: "data:image/png;base64,one",
      id: "drawing-1",
      nowIso: "2026-07-29T00:00:00.000Z",
      strokes: [],
    });

    store.saveDrawing("note-1", drawing);
    store.updateMarkdown("note-1", `1ページ\n\n${createDrawingMarkdown("drawing-1")}`);
    store.addPage("note-1");
    store.updateMarkdown("note-1", `2ページ\n\n${createDrawingMarkdown("drawing-1")}`);
    store.deleteDrawing("note-1", "drawing-1");

    const document = store.documentForNote("note-1");
    expect(document.drawings).toEqual([]);
    expect(document.pageState.pages.map((page) => page.markdown)).toEqual(["1ページ", "2ページ"]);
  });
});
