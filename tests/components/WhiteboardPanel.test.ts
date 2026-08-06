import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import WhiteboardPanel from "@/components/whiteboard/WhiteboardPanel.vue";
import { useWhiteboardStore } from "@/features/whiteboard/whiteboardStore";

describe("WhiteboardPanel", () => {
  it("previewで#・##・###をh1・h2・h3として本文と同時に表示する", async () => {
    const wrapper = mount(WhiteboardPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-headings" },
    });
    await wrapper.get("[data-testid='whiteboard-markdown']").setValue("# H1\n\n## H2\n\n### H3\n\n本文");
    await wrapper.get("[data-testid='preview-toggle']").trigger("click");

    expect(wrapper.get("[data-testid='whiteboard-preview'] h1").text()).toBe("H1");
    expect(wrapper.get("[data-testid='whiteboard-preview'] h2").text()).toBe("H2");
    expect(wrapper.get("[data-testid='whiteboard-preview'] h3").text()).toBe("H3");
    expect(wrapper.get("[data-testid='whiteboard-preview'] p").text()).toBe("本文");
  });

  it("手書きはstroke終了時のdraftを明示保存前からstoreへ退避する", async () => {
    const pinia = createPinia();
    const wrapper = mount(WhiteboardPanel, {
      global: { plugins: [pinia] },
      props: { noteId: "note-drawing-draft" },
    });
    await wrapper.get("[data-testid='add-handwriting']").trigger("click");
    wrapper.findComponent({ name: "HandwritingCanvas" }).vm.$emit("draft-change", {
      dataUrl: "data:image/png;base64,draft",
      strokes: [{ points: [{ x: 1, y: 2 }] }],
    });
    await wrapper.vm.$nextTick();

    const store = useWhiteboardStore(pinia);
    expect(store.documentForNote("note-drawing-draft").drawings).toHaveLength(1);
    expect(store.documentForNote("note-drawing-draft").pageState.pages[0].markdown).toContain("drawing:");
    expect(store.statusForNote("note-drawing-draft").state).toBe("dirty");
  });
  it("Markdown入力、preview切替、ページ追加を表示する", async () => {
    const wrapper = mount(WhiteboardPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-1",
      },
    });

    expect(wrapper.find("[data-testid='whiteboard-markdown']").exists()).toBe(true);
    expect(wrapper.classes()).toContain("whiteboard-panel");
    expect(wrapper.get("[data-testid='whiteboard-markdown']").classes()).toContain("whiteboard-panel__markdown");
    expect(wrapper.text()).not.toContain("手書きの数式をきれいに整形");
    expect(wrapper.text()).not.toContain("消しゴム");
    expect(wrapper.get("[data-testid='add-handwriting']").attributes("aria-label")).toBe("手書きを追加");
    expect(wrapper.get("[data-testid='add-handwriting']").text()).toBe("edit");

    await wrapper.get("[data-testid='add-whiteboard-page']").trigger("click");
    expect(wrapper.text()).toContain("ページ 2");

    await wrapper.get("[data-testid='whiteboard-markdown']").setValue("# 極限\n\n- 連続性");
    await wrapper.get("[data-testid='preview-toggle']").trigger("click");
    expect(wrapper.get("[data-testid='whiteboard-preview']").classes()).toContain("whiteboard-panel__preview");
    expect(wrapper.get("[data-testid='whiteboard-preview']").text()).toContain("極限");
    expect(wrapper.get("[data-testid='whiteboard-preview']").text()).toContain("連続性");
  });

  it("手書き画像を保存してpreviewに埋め込み、再編集できる", async () => {
    const wrapper = mount(WhiteboardPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-1",
      },
    });

    await wrapper.get("[data-testid='add-handwriting']").trigger("click");
    wrapper.findComponent({ name: "HandwritingCanvas" }).vm.$emit("save", {
      dataUrl: "data:image/png;base64,test",
      strokes: [],
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.get("[data-testid='whiteboard-preview']").find("img").attributes("src")).toBe("data:image/png;base64,test");

    expect(wrapper.find("[data-testid^='edit-drawing-']").exists()).toBe(false);
    await wrapper.get("[data-testid^='open-drawing-']").trigger("click");
    expect(wrapper.findComponent({ name: "WhiteboardDrawingDialog" }).exists()).toBe(true);
    await wrapper.get("[data-testid='edit-drawing']").trigger("click");
    expect(wrapper.findComponent({ name: "HandwritingCanvas" }).exists()).toBe(true);
  });

  it("ダイアログから手書き画像とMarkdown参照を削除する", async () => {
    const wrapper = mount(WhiteboardPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-delete",
      },
    });

    await wrapper.get("[data-testid='whiteboard-markdown']").setValue("# 残す本文");
    await wrapper.get("[data-testid='add-handwriting']").trigger("click");
    wrapper.findComponent({ name: "HandwritingCanvas" }).vm.$emit("save", {
      dataUrl: "data:image/png;base64,test",
      strokes: [],
    });
    await wrapper.vm.$nextTick();
    await wrapper.get("[data-testid^='open-drawing-']").trigger("click");
    await wrapper.get("[data-testid='delete-drawing']").trigger("click");

    expect(wrapper.find("img[alt='手書きメモ']").exists()).toBe(false);
    expect(wrapper.findComponent({ name: "WhiteboardDrawingDialog" }).exists()).toBe(false);
    await wrapper.get("[data-testid='md-toggle']").trigger("click");
    expect((wrapper.get("[data-testid='whiteboard-markdown']").element as HTMLTextAreaElement).value).toBe("# 残す本文");
  });

  it("再編集時はdrawing IDと作成日時を維持して内容を更新する", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(WhiteboardPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-edit",
      },
    });
    const store = useWhiteboardStore();

    await wrapper.get("[data-testid='add-handwriting']").trigger("click");
    wrapper.findComponent({ name: "HandwritingCanvas" }).vm.$emit("save", {
      dataUrl: "data:image/png;base64,before",
      strokes: [],
    });
    await wrapper.vm.$nextTick();
    const before = { ...store.documentForNote("note-edit").drawings[0] };

    await wrapper.get("[data-testid^='open-drawing-']").trigger("click");
    await wrapper.get("[data-testid='edit-drawing']").trigger("click");
    wrapper.findComponent({ name: "HandwritingCanvas" }).vm.$emit("save", {
      dataUrl: "data:image/png;base64,after",
      strokes: [{ points: [{ x: 1, y: 2 }] }],
    });
    await wrapper.vm.$nextTick();

    expect(store.documentForNote("note-edit").drawings[0]).toMatchObject({
      createdAt: before.createdAt,
      dataUrl: "data:image/png;base64,after",
      id: before.id,
    });
  });

  it("同じノートで再マウントしてもMarkdownを保持する", async () => {
    const pinia = createPinia();
    const first = mount(WhiteboardPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
      },
    });

    await first.get("[data-testid='whiteboard-markdown']").setValue("# 保持する内容");
    first.unmount();

    const restored = mount(WhiteboardPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
      },
    });
    const otherNote = mount(WhiteboardPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-other",
      },
    });

    expect((restored.get("[data-testid='whiteboard-markdown']").element as HTMLTextAreaElement).value).toContain("保持する内容");
    expect((otherNote.get("[data-testid='whiteboard-markdown']").element as HTMLTextAreaElement).value).not.toContain("保持する内容");
  });
});
