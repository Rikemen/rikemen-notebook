import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MinimizedDock from "@/components/workspace/MinimizedDock.vue";
import { createDefaultPanelLayout, minimizePanel } from "@/features/workspace/panelLayout";

describe("MinimizedDock", () => {
  it("最小化パネルを表示し、クリックで復元をemitする", async () => {
    const [panel] = minimizePanel(createDefaultPanelLayout(), "textbook");
    const wrapper = mount(MinimizedDock, {
      props: {
        panels: [panel],
      },
    });

    expect(wrapper.text()).toContain("資料");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("restore")?.[0]).toEqual(["textbook"]);
  });
});
