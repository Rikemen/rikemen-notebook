import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import HomePage from "@/views/Home.vue";
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
    useRouter: () => ({
      push: vi.fn(),
    }),
  };
});

describe("design-workspace-flow", () => {
  it("未ログインHOME、ログインHOME検索、ノート画面の主要領域を確認できる", async () => {
    const pinia = createPinia();
    const home = mount(HomePage, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(home.text()).toContain("未ログインではアプリの使い方");
    useStore().setUser({
      displayName: "Rike Men",
      email: "rike@example.com",
      photoURL: null,
      uid: "user-1",
    } as User);
    await home.vm.$nextTick();
    await home.get("[data-testid='home-note-search']").setValue("微分");
    expect(home.text()).toContain("微分の基礎");

    const workspace = mount(WorkspaceView, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(workspace.text()).toContain("ホワイトボード");
    expect(workspace.text()).toContain("AIチャット");
    expect(workspace.text()).toContain("スケッチ");
    expect(workspace.find("[data-testid='whiteboard-markdown']").exists()).toBe(true);
  });

  it("ヘッダー切替から資料最大化とEscape復元まで操作できる", async () => {
    window.localStorage.clear();
    const workspace = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: true,
        },
      },
    });

    await workspace.get("[aria-label='自由配置表示']").trigger("click");
    expect(workspace.get(".workspace-view__panel-grid").classes()).toContain("workspace-view__panel-grid--free");

    await workspace.get("[data-panel-id='textbook'] [aria-label='最大化']").trigger("click");
    expect(workspace.findComponent({ name: "WorkspaceHeader" }).exists()).toBe(false);
    expect(workspace.findAll(".movable-panel")).toHaveLength(1);
    expect(workspace.get(".movable-panel").attributes("data-panel-id")).toBe("textbook");
    expect(workspace.findComponent({ name: "TextbookPanel" }).props("isMaximized")).toBe(true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await workspace.vm.$nextTick();

    expect(workspace.findComponent({ name: "WorkspaceHeader" }).exists()).toBe(true);
    expect(workspace.get("[aria-label='自由配置表示']").attributes("aria-pressed")).toBe("true");
    expect(workspace.get(".workspace-view__panel-grid").classes()).toContain("workspace-view__panel-grid--free");
    workspace.unmount();
  });
});
