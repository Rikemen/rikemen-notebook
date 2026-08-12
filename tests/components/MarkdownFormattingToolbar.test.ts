import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownFormattingToolbar from "@/components/whiteboard/MarkdownFormattingToolbar.vue";

const labels = ["太字", "斜体", "下線", "取り消し線", "引用", "コードブロック"];
const icons = ["format_bold", "format_italic", "format_underlined", "strikethrough_s", "format_quote", "code_blocks"];

describe("MarkdownFormattingToolbar", () => {
  it("6種類のアイコン操作とアクセシブルな名前を表示する", () => {
    const wrapper = mount(MarkdownFormattingToolbar);

    expect(wrapper.attributes("role")).toBe("toolbar");
    expect(wrapper.attributes("aria-label")).toBe("Markdown書式");
    expect(wrapper.findAll("button").map((button) => button.attributes("aria-label"))).toEqual(labels);
    expect(wrapper.findAll("button").map((button) => button.text())).toEqual(icons);
    expect(wrapper.findAll("button").map((button) => button.attributes("title"))).toEqual(labels);
  });

  it("選択なしでは全操作をdisabledにする", async () => {
    const wrapper = mount(MarkdownFormattingToolbar, { props: { disabled: true } });

    expect(wrapper.findAll("button").every((button) => button.attributes("disabled") !== undefined)).toBe(true);
    await wrapper.setProps({ disabled: false });
    expect(wrapper.findAll("button").every((button) => button.attributes("disabled") === undefined)).toBe(true);
  });

  it("押したボタンのformat actionをemitする", async () => {
    const wrapper = mount(MarkdownFormattingToolbar);

    await wrapper.get("[aria-label='太字']").trigger("click");
    await wrapper.get("[aria-label='コードブロック']").trigger("click");

    expect(wrapper.emitted("format")).toEqual([["bold"], ["code-block"]]);
  });
});
