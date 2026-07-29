import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MovablePanel from "@/components/workspace/MovablePanel.vue";
import { createDefaultPanelLayout } from "@/features/workspace/panelLayout";

const mountPanel = () =>
  mount(MovablePanel, {
    props: {
      layout: createDefaultPanelLayout()[0],
      mode: "free",
    },
  });

describe("MovablePanel", () => {
  it("別タブで開く操作を表示しない", () => {
    const wrapper = mountPanel();

    expect(wrapper.find("[aria-label='別タブで開く']").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("別タブで開く");
  });

  it("自由配置でも最大化中は親領域いっぱいに表示できるstyleにする", () => {
    const layout = {
      ...createDefaultPanelLayout()[0],
      state: "maximized" as const,
    };
    const wrapper = mount(MovablePanel, {
      props: {
        layout,
        mode: "free",
      },
    });

    expect(wrapper.classes()).toContain("movable-panel--maximized");
    expect(wrapper.attributes("style")).not.toContain("transform");
    expect(wrapper.attributes("style")).not.toContain("width");
    expect(wrapper.attributes("style")).not.toContain("height");
    expect(wrapper.find("[aria-label='復元']").exists()).toBe(true);
    expect(wrapper.get(".movable-panel__body").classes()).toContain("movable-panel__body--maximized");
  });

  it("通常ドッキング表示ではabsolute座標とdragを使わない", async () => {
    const wrapper = mount(MovablePanel, {
      props: {
        layout: createDefaultPanelLayout()[0],
      },
    });

    expect(wrapper.classes()).toContain("movable-panel--docked");
    expect(wrapper.attributes("style")).toBeUndefined();

    wrapper.get("[data-testid='panel-drag-handle']").element.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, clientY: 0 }));
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 24, clientY: 18 }));
    expect(wrapper.emitted("move")).toBeUndefined();
  });

  it("ドラッグでmoveをemitする", async () => {
    const wrapper = mountPanel();

    wrapper.get("[data-testid='panel-drag-handle']").element.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, clientY: 0 }));
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 24, clientY: 18 }));

    expect(wrapper.emitted("move")?.[0]).toEqual(["textbook", { x: 24, y: 18 }]);
  });

  it("右下ハンドルでresizeをemitする", async () => {
    const wrapper = mountPanel();

    wrapper.get("[data-testid='resize-handle']").element.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, clientY: 0 }));
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 30, clientY: 40 }));
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 60 }));

    expect(wrapper.emitted("resize")?.[0]).toEqual(["textbook", { height: 750, width: 380 }]);
    expect(wrapper.emitted("resize")?.[1]).toEqual(["textbook", { height: 770, width: 400 }]);
    expect(wrapper.get("[data-testid='resize-handle']").attributes("aria-label")).toBe("パネルサイズ変更");
  });
});
