import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import CodeEditorPanel from "@/components/diagram-code/CodeEditorPanel.vue";
import { createDefaultP5Project } from "@/features/diagram-code/p5Project";

describe("CodeEditorPanel", () => {
  it("ファイル選択と編集イベントをemitする", async () => {
    const project = createDefaultP5Project();
    const wrapper = mount(CodeEditorPanel, {
      props: {
        project,
        selectedPath: "index.html",
      },
    });

    await wrapper.findAll("button")[1].trigger("click");
    await wrapper.get("[data-testid='code-editor']").setValue("<!doctype html>");

    expect(wrapper.emitted("select-file")?.[0]).toEqual(["style.css"]);
    expect(wrapper.emitted("update-file")?.[0]).toEqual(["index.html", "<!doctype html>"]);
    expect(wrapper.classes()).toContain("code-editor-panel");
    expect(wrapper.find(".code-editor-panel__files").exists()).toBe(true);
    expect(wrapper.get("[data-testid='code-editor']").classes()).toContain("code-editor-panel__editor");
    expect(wrapper.get("[data-testid='code-editor']").attributes("data-language")).toBe("html");
    expect(wrapper.find("[aria-label='JavaScriptファイルを追加']").exists()).toBe(true);
  });
});
