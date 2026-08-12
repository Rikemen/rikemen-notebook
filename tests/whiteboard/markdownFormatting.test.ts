import { describe, expect, it } from "vitest";
import { applyMarkdownFormatting } from "@/features/whiteboard/markdownFormatting";

describe("markdownFormatting", () => {
  it.each([
    ["bold", "本文を**対象**にする", 5, 7],
    ["italic", "本文を*対象*にする", 4, 6],
    ["underline", "本文を<u>対象</u>にする", 6, 8],
    ["strikethrough", "本文を~~対象~~にする", 5, 7],
  ] as const)("%sを選択文字へ適用して内側の選択を維持する", (action, expectedValue, expectedStart, expectedEnd) => {
    const result = applyMarkdownFormatting({ action, selectionEnd: 5, selectionStart: 3, value: "本文を対象にする" });

    expect(result).toEqual({ selectionEnd: expectedEnd, selectionStart: expectedStart, value: expectedValue });
  });

  it("同じinline書式の内側を選択すると書式を解除する", () => {
    expect(applyMarkdownFormatting({ action: "bold", selectionEnd: 4, selectionStart: 2, value: "**太字**" })).toEqual({
      selectionEnd: 2,
      selectionStart: 0,
      value: "太字",
    });
  });

  it("空選択と範囲外indexでは本文を変更しない", () => {
    expect(applyMarkdownFormatting({ action: "bold", selectionEnd: 1, selectionStart: 1, value: "本文" })).toEqual({
      selectionEnd: 1,
      selectionStart: 1,
      value: "本文",
    });
    expect(applyMarkdownFormatting({ action: "italic", selectionEnd: 20, selectionStart: -10, value: "本文" }).value).toBe("*本文*");
  });

  it("複数行の各行へ引用を適用し、再適用で解除する", () => {
    const applied = applyMarkdownFormatting({
      action: "quote",
      selectionEnd: 12,
      selectionStart: 3,
      value: "前文\n一行目\n\n二行目\n後文",
    });
    expect(applied.value).toBe("前文\n> 一行目\n> \n> 二行目\n後文");

    const removed = applyMarkdownFormatting({
      action: "quote",
      selectionEnd: applied.selectionEnd,
      selectionStart: applied.selectionStart,
      value: applied.value,
    });
    expect(removed.value).toBe("前文\n一行目\n\n二行目\n後文");
  });

  it("選択行をコードフェンスで囲み、前後本文を維持する", () => {
    const result = applyMarkdownFormatting({
      action: "code-block",
      selectionEnd: 15,
      selectionStart: 3,
      value: "前文\nconst x = 1;\n後文",
    });

    expect(result.value).toBe("前文\n```\nconst x = 1;\n```\n後文");
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe("const x = 1;");
  });
});
