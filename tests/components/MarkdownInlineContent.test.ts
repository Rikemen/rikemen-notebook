import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownInlineContent from "@/components/whiteboard/MarkdownInlineContent.vue";
import { parseMarkdownInline } from "@/features/whiteboard/markdownPreview";

describe("MarkdownInlineContent", () => {
  it("typed nodeを意味的なinline要素として再帰描画する", () => {
    const wrapper = mount(MarkdownInlineContent, {
      props: { nodes: parseMarkdownInline("<u>**太字**</u> *斜体* ~~取消~~") },
    });

    expect(wrapper.get("u strong").text()).toBe("太字");
    expect(wrapper.get("em").text()).toBe("斜体");
    expect(wrapper.get("del").text()).toBe("取消");
  });

  it("任意HTML風文字列を要素へ展開しない", () => {
    const wrapper = mount(MarkdownInlineContent, {
      props: { nodes: [{ text: "<script>alert(1)</script>", type: "text" }] },
    });

    expect(wrapper.find("script").exists()).toBe(false);
    expect(wrapper.text()).toBe("<script>alert(1)</script>");
  });
});
