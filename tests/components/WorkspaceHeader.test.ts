import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader.vue";

describe("WorkspaceHeader", () => {
  it("ドッキングと自由配置をアイコンで切り替える", async () => {
    const wrapper = mount(WorkspaceHeader, {
      props: {
        layoutMode: "docked",
      },
    });

    expect(wrapper.get("[aria-label='ドッキング表示']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.get("[aria-label='自由配置表示']").attributes("aria-pressed")).toBe("false");

    await wrapper.get("[aria-label='自由配置表示']").trigger("click");

    expect(wrapper.emitted("select-layout-mode")?.[0]).toEqual(["free"]);
  });

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

  it("未保存・保存中・失敗・保存済みを実際の保存状態で切り替える", async () => {
    const wrapper = mount(WorkspaceHeader, {
      props: {
        autosaveStatus: { errorMessage: "", savedAt: null, state: "dirty" },
      },
    });
    expect(wrapper.get("[data-testid='save-whiteboard']").text()).toBe("保存する");
    await wrapper.get("[data-testid='save-whiteboard']").trigger("click");
    expect(wrapper.emitted("save-now")).toHaveLength(1);

    await wrapper.setProps({ autosaveStatus: { errorMessage: "", savedAt: null, state: "saving" } });
    expect(wrapper.text()).toContain("保存中…");
    await wrapper.setProps({ autosaveStatus: { errorMessage: "offline", savedAt: null, state: "failed" } });
    expect(wrapper.get("[data-testid='retry-whiteboard-save']").text()).toBe("再試行");
    await wrapper.setProps({ autosaveStatus: { errorMessage: "", savedAt: "2026-08-06", state: "saved" } });
    expect(wrapper.text()).toContain("自動保存済み");
  });
});
