import { describe, expect, it } from "vitest";
import { parseMarkdownInline, renderMarkdownPreview } from "@/features/whiteboard/markdownPreview";
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

  it("太字・斜体・下線・取り消し線をtyped inline nodeへ変換する", () => {
    const nodes = parseMarkdownInline("通常 **太字** *斜体* <u>下線</u> ~~取消~~");

    expect(nodes.map((node) => node.type)).toEqual(["text", "strong", "text", "emphasis", "text", "underline", "text", "strikethrough"]);
    expect(parseMarkdownInline("<u>**入れ子**</u>")[0]).toMatchObject({
      children: [{ children: [{ text: "入れ子", type: "text" }], type: "strong" }],
      type: "underline",
    });
  });

  it("未閉じdelimiterと任意HTML風入力をtextとして保持する", () => {
    expect(parseMarkdownInline("**未閉じ <script>alert(1)</script>")).toEqual([{ text: "**未閉じ <script>alert(1)</script>", type: "text" }]);
  });

  it("連続する引用行をquoteにし、コード内の引用記号はcodeへ残す", () => {
    const blocks = renderMarkdownPreview("> **引用**\n> 二行目\n\n```\n> code\n```", []);

    expect(blocks.map((block) => block.type)).toEqual(["quote", "code"]);
    expect(blocks[0]).toMatchObject({ type: "quote" });
    expect(blocks[1]).toMatchObject({ text: "> code", type: "code" });
  });
});
