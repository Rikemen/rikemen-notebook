import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import WorkspaceView from "@/views/WorkspaceView.vue";
import { useStore } from "@/store/index";

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");

  return {
    ...actual,
    useRoute: () => ({
      params: {
        noteId: "calculus-note",
      },
    }),
  };
});

describe("WorkspaceView", () => {
  it("選択ノート名と4パネルを表示する", async () => {
    const pinia = createPinia();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a><slot /></a>",
          },
        },
      },
    });
    const store = useStore();
    store.setUser({
      displayName: "Rike Men",
      email: "rike@example.com",
      photoURL: null,
      uid: "user-1",
    } as User);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("微分の基礎");
    expect(wrapper.text()).toContain("資料");
    expect(wrapper.text()).toContain("ホワイトボード");
    expect(wrapper.text()).toContain("AIチャット");
    expect(wrapper.text()).toContain("スケッチ");
  });

  it("パネルを閉じてヘッダーから再表示する", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
      },
    });
    const panelToggle = () => wrapper.get(".workspace-panel-toggle[data-panel-id='whiteboard']");

    expect(panelToggle().attributes("aria-pressed")).toBe("true");
    await wrapper.get("[data-panel-id='whiteboard'] [aria-label='閉じる']").trigger("click");

    expect(wrapper.find(".movable-panel[data-panel-id='whiteboard']").exists()).toBe(false);
    expect(panelToggle().attributes("aria-pressed")).toBe("false");

    await panelToggle().trigger("click");

    expect(wrapper.find(".movable-panel[data-panel-id='whiteboard']").exists()).toBe(true);
    expect(panelToggle().attributes("aria-pressed")).toBe("true");
  });

  it("最小化したパネルをヘッダーから通常表示へ戻す", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.get("[data-panel-id='ai-chat'] [aria-label='最小化']").trigger("click");
    expect(wrapper.get(".workspace-panel-toggle[data-panel-id='ai-chat']").attributes("aria-pressed")).toBe("false");

    await wrapper.get(".workspace-panel-toggle[data-panel-id='ai-chat']").trigger("click");
    expect(wrapper.find(".movable-panel[data-panel-id='ai-chat']").exists()).toBe(true);
    expect(wrapper.get(".workspace-panel-toggle[data-panel-id='ai-chat']").attributes("aria-pressed")).toBe("true");
  });

  it("最大化中はパネル以外のワークスペース操作を隠す", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.get("[data-panel-id='whiteboard'] [aria-label='最大化']").trigger("click");

    expect(wrapper.classes()).toContain("workspace-view--maximized");
    expect(wrapper.findComponent({ name: "WorkspaceHeader" }).exists()).toBe(false);
    expect(wrapper.find(".workspace-view__toolbar").exists()).toBe(false);
    expect(wrapper.findComponent({ name: "MinimizedDock" }).exists()).toBe(false);
    expect(wrapper.findAll(".movable-panel")).toHaveLength(1);
    expect(wrapper.get(".movable-panel").attributes("data-panel-id")).toBe("whiteboard");
    expect(wrapper.get(".workspace-view__panel-grid").classes()).toContain("workspace-view__panel-grid--maximized");
    expect(wrapper.findAll(".movable-panel__body--maximized")).toHaveLength(1);
    expect(wrapper.find("[aria-label='復元']").exists()).toBe(true);
  });

  it("資料パネルの最大化状態をTextbookPanelへ渡す", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.findComponent({ name: "TextbookPanel" }).props("isMaximized")).toBe(false);

    await wrapper.get("[data-panel-id='textbook'] [aria-label='最大化']").trigger("click");

    expect(wrapper.findComponent({ name: "TextbookPanel" }).props("isMaximized")).toBe(true);
  });

  it("ヘッダーから表示モードを切り替えて旧ツールバーを残さない", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.find(".workspace-view__toolbar").exists()).toBe(false);
    expect(wrapper.get("[aria-label='ドッキング表示']").attributes("aria-pressed")).toBe("true");

    await wrapper.get("[aria-label='自由配置表示']").trigger("click");

    expect(wrapper.get("[aria-label='自由配置表示']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.get(".workspace-view__panel-grid").classes()).toContain("workspace-view__panel-grid--free");
  });

  it("Escapeで最大化パネルを復元する", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.get("[data-panel-id='whiteboard'] [aria-label='最大化']").trigger("click");
    expect(wrapper.classes()).toContain("workspace-view--maximized");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();

    expect(wrapper.classes()).not.toContain("workspace-view--maximized");
    expect(wrapper.findComponent({ name: "WorkspaceHeader" }).exists()).toBe(true);
    expect(wrapper.findAll(".movable-panel")).toHaveLength(4);
  });
});
