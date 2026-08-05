import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import WorkspaceView from "@/views/WorkspaceView.vue";
import { useStore } from "@/store/index";
import { useTextbookPanelStore } from "@/features/textbook/textbookPanelStore";

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

describe("workspaceMockAcceptance", () => {
  it("ヘッダー、教材、ホワイトボード、AI、図表コード、最小化置き場を持つ", async () => {
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(wrapper.find("header.workspace-header").exists()).toBe(true);
    expect(wrapper.find("[aria-label='ノートワークスペース']").exists()).toBe(true);
    expect(wrapper.find("[data-panel-id='textbook']").exists()).toBe(true);
    expect(wrapper.find("[data-panel-id='whiteboard']").exists()).toBe(true);
    expect(wrapper.find("[data-panel-id='ai-chat']").exists()).toBe(true);
    expect(wrapper.find("[data-panel-id='diagram-code']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='whiteboard-markdown']").exists()).toBe(true);

    await wrapper.find("[data-panel-id='textbook'] [aria-label='最小化']").trigger("click");
    expect(wrapper.find("[aria-label='最小化パネル']").exists()).toBe(true);
  });

  it("4パネルを閉じて再表示しても内容を保持する", async () => {
    window.localStorage.clear();
    const pinia = createPinia();
    setActivePinia(pinia);
    useStore().setUser({
      displayName: "Rike Men",
      email: "rike@example.com",
      photoURL: null,
      uid: "user-1",
    } as User);
    const textbookStore = useTextbookPanelStore();
    textbookStore.addMaterial("calculus-note", {
      id: "material-persisted",
      pageCount: 3,
      sizeLabel: "1.0 MB",
      sourceUrl: "blob:https://example.com/material-persisted",
      status: "temporary",
      title: "閉じても残る資料.pdf",
      uploadedAt: "2026/08/01",
    });
    textbookStore.setMode("calculus-note", "preview");
    textbookStore.selectPage("calculus-note", 3);
    const wrapper = mount(WorkspaceView, {
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.get("[data-testid='whiteboard-markdown']").setValue("# 閉じても残るノート");
    await wrapper.get("[data-testid='ai-prompt']").setValue("閉じても残る質問");
    await wrapper.findAll("[role='tab']")[1].trigger("click");
    await wrapper.get("[data-testid='code-editor']").setValue("function persistedSketch() {}");

    const panelIds = ["textbook", "whiteboard", "ai-chat", "diagram-code"];
    for (const panelId of panelIds) {
      await wrapper.get(`.movable-panel[data-panel-id='${panelId}'] [aria-label='閉じる']`).trigger("click");
    }

    expect(wrapper.findAll(".movable-panel")).toHaveLength(0);
    for (const panelId of panelIds) {
      expect(wrapper.get(`.workspace-panel-toggle[data-panel-id='${panelId}']`).attributes("aria-pressed")).toBe("false");
      await wrapper.get(`.workspace-panel-toggle[data-panel-id='${panelId}']`).trigger("click");
    }

    expect((wrapper.get("[data-testid='whiteboard-markdown']").element as HTMLTextAreaElement).value).toContain("閉じても残るノート");
    expect(wrapper.findAll(".thumbnail-strip__item")[2].classes()).toContain("thumbnail-strip__item--selected");
    await wrapper.get("[data-panel-id='textbook'] [aria-label='資料一覧']").trigger("click");
    expect(wrapper.findAll(".textbook-list__item")[0].classes()).toContain("textbook-list__item--selected");
    expect((wrapper.get("[data-testid='ai-prompt']").element as HTMLInputElement).value).toBe("閉じても残る質問");
    expect((wrapper.get("[data-testid='code-editor']").element as HTMLTextAreaElement).value).toBe("function persistedSketch() {}");
  });
});
