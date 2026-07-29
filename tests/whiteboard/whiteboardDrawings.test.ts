import { describe, expect, it } from "vitest";
import {
  createDrawingMarkdown,
  createWhiteboardDrawing,
  removeDrawingMarkdownReference,
  removeWhiteboardDrawing,
  upsertWhiteboardDrawing,
} from "@/features/whiteboard/whiteboardDrawings";

describe("whiteboardDrawings", () => {
  it("手書き画像のMarkdown参照を作る", () => {
    expect(createDrawingMarkdown("drawing-1")).toBe("![手書き](drawing:drawing-1)");
  });

  it("手書き画像を追加と更新できる", () => {
    const drawing = createWhiteboardDrawing({
      dataUrl: "data:image/png;base64,one",
      id: "drawing-1",
      nowIso: "2026-07-28T00:00:00.000Z",
      strokes: [{ points: [{ x: 1, y: 2 }] }],
    });
    const updated = {
      ...drawing,
      dataUrl: "data:image/png;base64,two",
      updatedAt: "2026-07-28T00:01:00.000Z",
    };

    expect(upsertWhiteboardDrawing([], drawing)).toEqual([drawing]);
    expect(upsertWhiteboardDrawing([drawing], updated)).toEqual([updated]);
  });

  it("対象画像とMarkdown参照だけを削除する", () => {
    const drawing = createWhiteboardDrawing({
      dataUrl: "data:image/png;base64,one",
      id: "drawing-1",
      nowIso: "2026-07-28T00:00:00.000Z",
      strokes: [],
    });
    const otherDrawing = {
      ...drawing,
      id: "drawing-2",
    };
    const markdown = [
      "# 本文",
      "",
      createDrawingMarkdown("drawing-1"),
      "",
      createDrawingMarkdown("drawing-2"),
    ].join("\n");

    expect(removeWhiteboardDrawing([drawing, otherDrawing], "drawing-1")).toEqual([otherDrawing]);
    expect(removeDrawingMarkdownReference(markdown, "drawing-1")).toBe(
      ["# 本文", "", createDrawingMarkdown("drawing-2")].join("\n"),
    );
  });
});
