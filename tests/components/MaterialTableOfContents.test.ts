import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MaterialTableOfContents from "@/components/textbook/MaterialTableOfContents.vue";

describe("MaterialTableOfContents", () => {
  it("invalid入力を表示しvalid入力を追加する", async () => {
    const wrapper = mount(MaterialTableOfContents, {
      props: {
        items: [],
        pageCount: 6,
        selectedPage: 1,
      },
    });

    await wrapper.get("form").trigger("submit");
    expect(wrapper.text()).toContain("タイトルを入力してください。");

    await wrapper.get("[data-testid='toc-title']").setValue("関数の極限");
    await wrapper.get("[data-testid='toc-page']").setValue("3");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("add")?.[0]?.[0]).toMatchObject({
      page: 3,
      title: "関数の極限",
    });
  });

  it("階層目次をtreeとして表示し選択項目を通知する", async () => {
    const wrapper = mount(MaterialTableOfContents, {
      props: {
        items: [
          {
            children: [
              {
                children: [],
                id: "toc-child",
                page: 2,
                title: "子項目",
              },
            ],
            id: "toc-root",
            page: 1,
            title: "章",
          },
        ],
        pageCount: 6,
        selectedPage: 1,
      },
    });

    expect(wrapper.find("[role='tree']").exists()).toBe(true);
    expect(wrapper.findAll("[role='treeitem']")).toHaveLength(2);

    await wrapper.get("[data-testid='toc-item-toc-child']").trigger("click");
    expect(wrapper.emitted("navigate")?.[0]?.[0]).toMatchObject({
      id: "toc-child",
      page: 2,
    });
  });
});
