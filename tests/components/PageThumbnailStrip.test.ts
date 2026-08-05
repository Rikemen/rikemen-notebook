import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PageThumbnailStrip from "@/components/textbook/PageThumbnailStrip.vue";

const pages = Array.from({ length: 30 }, (_value, index) => index + 1);

describe("PageThumbnailStrip", () => {
  it("サムネイル一覧を折りたたんで選択ページ情報だけを残す", async () => {
    const wrapper = mount(PageThumbnailStrip, {
      props: {
        collapsed: false,
        pages,
        selectedPage: 7,
      },
    });

    const toggle = wrapper.get("[aria-label='サムネイルを最小化']");
    expect(toggle.attributes("aria-expanded")).toBe("true");
    expect(wrapper.find(".thumbnail-strip__grid").exists()).toBe(true);

    await toggle.trigger("click");

    expect(wrapper.emitted("update:collapsed")?.[0]).toEqual([true]);
    await wrapper.setProps({ collapsed: true });
    expect(wrapper.find(".thumbnail-strip__grid").exists()).toBe(false);
    expect(wrapper.find("[aria-label='サムネイルページ切り替え']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='thumbnail-selection-status']").text()).toContain("7 / 30");
    expect(wrapper.get("[aria-label='サムネイルを表示']").attributes("aria-expanded")).toBe("false");
  });

  it("最大化用の縦レールへ切り替える", () => {
    const wrapper = mount(PageThumbnailStrip, {
      props: {
        orientation: "vertical",
        pages,
        selectedPage: 1,
      },
    });

    expect(wrapper.classes()).toContain("thumbnail-strip--vertical");
    expect(wrapper.findAll(".thumbnail-strip__item")).toHaveLength(12);
    expect(wrapper.get("[data-testid='thumbnail-page-1']").attributes("aria-current")).toBe("page");
  });

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
