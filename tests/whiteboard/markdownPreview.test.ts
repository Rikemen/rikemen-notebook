import { describe, expect, it } from "vitest";
import { renderMarkdownPreview } from "@/features/whiteboard/markdownPreview";
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";

const drawing: WhiteboardDrawing = {
  createdAt: "2026-07-28T00:00:00.000Z",
  dataUrl: "data:image/png;base64,abc",
  id: "drawing-1",
  strokes: [],
  updatedAt: "2026-07-28T00:00:00.000Z",
};

describe("markdownPreview", () => {
  it("見出し、リスト、コード、段落を構造化する", () => {
    const blocks = renderMarkdownPreview("# タイトル\n\n- a\n- b\n\n```\nx = 1\n```\n本文", []);

    expect(blocks.map((block) => block.type)).toEqual(["heading", "list", "code", "paragraph"]);
  });

  it("手書き画像参照をdrawing blockへ変換する", () => {
    const blocks = renderMarkdownPreview("![手書き](drawing:drawing-1)", [drawing]);

    expect(blocks[0]).toMatchObject({
      drawing,
      type: "drawing",
    });
  });
});
