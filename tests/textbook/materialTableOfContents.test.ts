import { describe, expect, it } from "vitest";
import {
  addMaterialTocItem,
  createMaterialTocItem,
  type MaterialTocItem,
} from "@/features/textbook/materialTableOfContents";

describe("materialTableOfContents", () => {
  it("有効なタイトルとページ番号から目次項目を作る", () => {
    expect(createMaterialTocItem({ page: 3, title: " 関数の極限 " }, 6, () => "toc-1")).toEqual({
      item: {
        children: [],
        id: "toc-1",
        page: 3,
        title: "関数の極限",
      },
      ok: true,
    });
  });

  it.each([
    [{ page: 1, title: " " }, "タイトルを入力してください。"],
    [{ page: 0, title: "極限" }, "ページ番号は1以上の整数で入力してください。"],
    [{ page: -1, title: "極限" }, "ページ番号は1以上の整数で入力してください。"],
    [{ page: 1.5, title: "極限" }, "ページ番号は1以上の整数で入力してください。"],
    [{ page: 7, title: "極限" }, "ページ番号は6以下で入力してください。"],
  ])("不正な入力 %o を拒否する", (input, message) => {
    expect(createMaterialTocItem(input, 6, () => "toc-1")).toEqual({
      message,
      ok: false,
    });
  });

  it("既存treeを変更せずにルート項目を追加する", () => {
    const existing: MaterialTocItem[] = [
      {
        children: [],
        id: "toc-1",
        page: 1,
        title: "導入",
      },
    ];
    const next = addMaterialTocItem(existing, {
      children: [],
      id: "toc-2",
      page: 2,
      title: "定義",
    });

    expect(next).toHaveLength(2);
    expect(existing).toHaveLength(1);
  });
});
