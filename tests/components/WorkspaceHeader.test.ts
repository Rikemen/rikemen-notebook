import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader.vue";

describe("WorkspaceHeader", () => {
  it("4つのパネル表示ボタンと既存の操作を持つ", async () => {
    const wrapper = mount(WorkspaceHeader, {
      props: {
        currentUser: {
          displayName: "Rike Men",
          email: "rike@example.com",
          photoURL: null,
          uid: "user-1",
        },
        panelVisibility: {
          "ai-chat": true,
          "diagram-code": false,
          textbook: true,
          whiteboard: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Gauss Notebook");
    expect(wrapper.text()).not.toContain("ノート一覧");
    expect(wrapper.text()).not.toContain("マイノート");
    expect(wrapper.text()).not.toContain("テンプレート");
    expect(wrapper.text()).not.toContain("AIアシスタント");
    expect(wrapper.text()).not.toContain("使い方");
    expect(wrapper.text()).toContain("資料");
    expect(wrapper.findAll(".workspace-panel-toggle")).toHaveLength(4);
    expect(wrapper.get(".workspace-panel-toggle[data-panel-id='textbook']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.get(".workspace-panel-toggle[data-panel-id='diagram-code']").attributes("aria-pressed")).toBe("false");
    expect(wrapper.find("[aria-label='元に戻す']").exists()).toBe(true);
    expect(wrapper.find("[aria-label='やり直す']").exists()).toBe(true);
    expect(wrapper.text()).toContain("自動保存済み");
    expect(wrapper.text()).toContain("共有");
    expect(wrapper.text()).toContain("R");

    await wrapper.get(".workspace-panel-toggle[data-panel-id='diagram-code']").trigger("click");
    expect(wrapper.emitted("toggle-panel")?.[0]).toEqual(["diagram-code"]);
  });
});
