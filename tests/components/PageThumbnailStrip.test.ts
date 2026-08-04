import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PageThumbnailStrip from "@/components/textbook/PageThumbnailStrip.vue";

const pages = Array.from({ length: 30 }, (_value, index) => index + 1);

describe("PageThumbnailStrip", () => {
  it("サムネイルを12枚ずつページ送りする", async () => {
    const wrapper = mount(PageThumbnailStrip, {
      props: {
        pages,
        selectedPage: 1,
      },
    });

    expect(wrapper.findAll(".thumbnail-strip__item")).toHaveLength(12);
    expect(wrapper.find("[data-testid='thumbnail-page-12']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='thumbnail-page-13']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='thumbnail-pagination-status']").text()).toBe("1 / 3");
    expect(wrapper.get("[aria-label='前のサムネイルページ']").attributes("disabled")).toBeDefined();

    await wrapper.get("[aria-label='次のサムネイルページ']").trigger("click");
    expect(wrapper.find("[data-testid='thumbnail-page-13']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='thumbnail-page-24']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='thumbnail-pagination-status']").text()).toBe("2 / 3");

    await wrapper.get("[aria-label='次のサムネイルページ']").trigger("click");
    expect(wrapper.findAll(".thumbnail-strip__item")).toHaveLength(6);
    expect(wrapper.find("[data-testid='thumbnail-page-25']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='thumbnail-page-30']").exists()).toBe(true);
    expect(wrapper.get("[aria-label='次のサムネイルページ']").attributes("disabled")).toBeDefined();
  });

  it("選択ページを含むサムネイルページへ自動追従する", async () => {
    const wrapper = mount(PageThumbnailStrip, {
      props: {
        pages,
        selectedPage: 1,
      },
    });

    await wrapper.setProps({ selectedPage: 25 });

    expect(wrapper.get("[data-testid='thumbnail-pagination-status']").text()).toBe("3 / 3");
    expect(wrapper.get("[data-testid='thumbnail-page-25']").attributes("aria-current")).toBe("page");
  });

  it("サムネイル選択時に実ページ番号を通知する", async () => {
    const wrapper = mount(PageThumbnailStrip, {
      props: {
        pages,
        selectedPage: 1,
      },
    });

    await wrapper.get("[aria-label='次のサムネイルページ']").trigger("click");
    await wrapper.get("[aria-label='次のサムネイルページ']").trigger("click");
    await wrapper.get("[data-testid='thumbnail-page-25']").trigger("click");

    expect(wrapper.emitted("select-page")?.[0]).toEqual([25]);
  });

  it("12ページ以下ではページ送りを表示しない", () => {
    const wrapper = mount(PageThumbnailStrip, {
      props: {
        pages: pages.slice(0, 12),
        selectedPage: 1,
      },
    });

    expect(wrapper.find("[aria-label='サムネイルページ切り替え']").exists()).toBe(false);
  });
});
