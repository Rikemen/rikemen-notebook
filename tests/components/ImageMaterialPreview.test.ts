import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ImageMaterialPreview from "@/components/textbook/ImageMaterialPreview.vue";

describe("ImageMaterialPreview", () => {
  it("画像を25%から800%まで拡大縮小して100%へ戻す", async () => {
    const wrapper = mount(ImageMaterialPreview, {
      props: { sourceUrl: "blob:https://example.com/graph", title: "graph.png" },
    });

    expect(wrapper.get("[data-testid='image-zoom-status']").text()).toBe("100%");
    expect(wrapper.get("[data-testid='image-zoom-stage']").attributes("style")).toContain("width: 100%");

    for (let index = 0; index < 3; index += 1) {
      await wrapper.get("[aria-label='画像を縮小']").trigger("click");
    }
    expect(wrapper.get("[data-testid='image-zoom-status']").text()).toBe("25%");
    expect(wrapper.get("[data-testid='image-zoom-stage']").attributes("style")).toContain("width: 25%");
    expect(wrapper.get("[aria-label='画像を縮小']").attributes("disabled")).toBeDefined();

    await wrapper.get("[aria-label='画像を100%に戻す']").trigger("click");
    expect(wrapper.get("[data-testid='image-zoom-status']").text()).toBe("100%");

    for (let index = 0; index < 28; index += 1) {
      await wrapper.get("[aria-label='画像を拡大']").trigger("click");
    }
    expect(wrapper.get("[data-testid='image-zoom-status']").text()).toBe("800%");
    expect(wrapper.get("[data-testid='image-zoom-stage']").attributes("style")).toContain("width: 800%");
    expect(wrapper.get("[aria-label='画像を拡大']").attributes("disabled")).toBeDefined();
  });

  it("画像sourceが変わると100%へ戻す", async () => {
    const wrapper = mount(ImageMaterialPreview, {
      props: { sourceUrl: "blob:https://example.com/before", title: "before.png" },
    });
    await wrapper.get("[aria-label='画像を拡大']").trigger("click");
    expect(wrapper.get("[data-testid='image-zoom-status']").text()).toBe("125%");

    await wrapper.setProps({ sourceUrl: "blob:https://example.com/after", title: "after.png" });

    expect(wrapper.get("[data-testid='image-zoom-status']").text()).toBe("100%");
    expect(wrapper.get("img").attributes("alt")).toBe("after.png");
  });

  it("sourceがない場合はズーム操作を表示しない", () => {
    const wrapper = mount(ImageMaterialPreview, { props: { sourceUrl: "", title: "未選択" } });

    expect(wrapper.find("[aria-label='画像ズーム']").exists()).toBe(false);
    expect(wrapper.text()).toContain("プレビューする画像を選択してください");
  });
});
