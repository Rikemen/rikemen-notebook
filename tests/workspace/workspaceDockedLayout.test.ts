import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import WorkspaceView from "@/views/WorkspaceView.vue";

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

describe("workspaceDockedLayout", () => {
  it("通常表示は3カラムGrid用のドッキング構造を使う", () => {
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(wrapper.find(".workspace-view__stage").exists()).toBe(true);
    expect(wrapper.find(".workspace-view__panel-grid--docked").exists()).toBe(true);
    expect(wrapper.findAll(".movable-panel--docked")).toHaveLength(4);
    expect(wrapper.find(".movable-panel--free").exists()).toBe(false);
  });

  it("自由配置モードではabsolute用のパネルへ切り替わる", async () => {
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await wrapper.get("[aria-label='自由配置表示']").trigger("click");

    expect(wrapper.find(".workspace-view__panel-grid--free").exists()).toBe(true);
    expect(wrapper.findAll(".movable-panel--free")).toHaveLength(4);
  });

  it("ドッキング表示で2パネルだけなら均等配置classを使う", async () => {
    window.localStorage.clear();
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await wrapper.get(".workspace-panel-toggle[data-panel-id='ai-chat']").trigger("click");
    await wrapper.get(".workspace-panel-toggle[data-panel-id='diagram-code']").trigger("click");

    expect(wrapper.findAll(".movable-panel--docked")).toHaveLength(2);
    expect(wrapper.get(".workspace-view__panel-grid").classes()).toContain("workspace-view__panel-grid--count-2");
  });
});
