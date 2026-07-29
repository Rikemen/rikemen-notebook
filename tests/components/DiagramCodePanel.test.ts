import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import DiagramCodePanel from "@/components/diagram-code/DiagramCodePanel.vue";

describe("DiagramCodePanel", () => {
  it("初期表示は図表モード", () => {
    const wrapper = mount(DiagramCodePanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-1",
      },
    });

    expect(wrapper.find("iframe").exists()).toBe(true);
    expect(wrapper.text()).toContain("ダウンロード");
    expect(wrapper.text()).toContain("p5.js 2.3.0");
    expect(wrapper.classes()).toContain("diagram-code-panel");
    expect(wrapper.find(".diagram-code-panel__toolbar").exists()).toBe(true);
    expect(wrapper.find(".diagram-code-panel__run-row").exists()).toBe(true);
  });

  it("コードモードへ切り替えて実行できる", async () => {
    const wrapper = mount(DiagramCodePanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-1",
      },
    });

    await wrapper.findAll("[role='tab']")[1].trigger("click");

    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.text()).toContain("index.html");
    expect(wrapper.text()).toContain("style.css");
    expect(wrapper.text()).toContain("sketch.js");

    await wrapper.get(".diagram-code-panel__run").trigger("click");
    expect(wrapper.find("iframe").exists()).toBe(true);
  });

  it("同じノートで再マウントしてもコードと選択ファイルを保持する", async () => {
    const pinia = createPinia();
    const first = mount(DiagramCodePanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
      },
    });

    await first.findAll("[role='tab']")[1].trigger("click");
    await first.findAll(".code-editor-panel__files button")[2].trigger("click");
    await first.get("[data-testid='code-editor']").setValue("function setup() { createCanvas(100, 100); }");
    first.unmount();

    const restored = mount(DiagramCodePanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
      },
    });
    const otherNote = mount(DiagramCodePanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-other",
      },
    });

    expect(restored.findAll("[role='tab']")[1].attributes("aria-selected")).toBe("true");
    expect(restored.findAll(".code-editor-panel__files button")[2].attributes("aria-current")).toBe("true");
    expect((restored.get("[data-testid='code-editor']").element as HTMLTextAreaElement).value).toContain("createCanvas(100");
    expect(otherNote.find("iframe").exists()).toBe(true);
  });
});
