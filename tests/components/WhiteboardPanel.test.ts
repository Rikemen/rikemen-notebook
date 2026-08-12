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

  it("選択文字へtoolbar書式を適用し、focusと選択範囲を維持してdirtyにする", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(WhiteboardPanel, {
      global: { plugins: [pinia] },
      props: { noteId: "note-formatting" },
      attachTo: document.body,
    });
    const textarea = wrapper.get<HTMLTextAreaElement>("[data-testid='whiteboard-markdown']");
    await textarea.setValue("選択する本文");
    textarea.element.focus();
    textarea.element.setSelectionRange(0, 2);
    await textarea.trigger("select");

    const toolbar = wrapper.get("[aria-label='Markdown書式']");
    expect(toolbar.findAll("button").every((button) => button.attributes("disabled") === undefined)).toBe(true);
    await toolbar.get("[aria-label='太字']").trigger("click");
    await wrapper.vm.$nextTick();

    expect(textarea.element.value).toBe("**選択**する本文");
    expect(document.activeElement).toBe(textarea.element);
    expect(textarea.element.selectionStart).toBe(2);
    expect(textarea.element.selectionEnd).toBe(4);
    expect(useWhiteboardStore(pinia).statusForNote("note-formatting").state).toBe("dirty");

    await wrapper.get("[data-testid='preview-toggle']").trigger("click");
    expect(wrapper.get("[data-testid='whiteboard-preview'] strong").text()).toBe("選択");
    expect(
      wrapper
        .get("[aria-label='Markdown書式']")
        .findAll("button")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
    wrapper.unmount();
  });

  it("書式toolbarをpreview切替の右、手書き操作の左へ配置する", () => {
    const wrapper = mount(WhiteboardPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-toolbar-order" },
    });
    const children = Array.from(wrapper.get(".whiteboard-panel__toolbar").element.children);

    expect(children[0]?.classList).toContain("whiteboard-panel__segments");
    expect(children[1]?.classList).toContain("markdown-formatting-toolbar");
    expect(children[2]?.classList).toContain("whiteboard-panel__draw");
    expect(wrapper.get("[aria-label='太字']").attributes("disabled")).toBeDefined();
  });

  it("previewから編集へ戻ると以前の選択範囲を破棄する", async () => {
    const wrapper = mount(WhiteboardPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-selection-reset" },
    });
    const textarea = wrapper.get<HTMLTextAreaElement>("[data-testid='whiteboard-markdown']");
    await textarea.setValue("選択する本文");
    textarea.element.setSelectionRange(0, 2);
    await textarea.trigger("select");
    expect(wrapper.get("[aria-label='太字']").attributes("disabled")).toBeUndefined();

    await wrapper.get("[data-testid='preview-toggle']").trigger("click");
    expect(wrapper.get("[aria-label='Markdown書式']").findAll("button")).toHaveLength(6);
    expect(wrapper.get("[aria-label='太字']").attributes("disabled")).toBeDefined();
    await wrapper.get("[data-testid='md-toggle']").trigger("click");

    expect(wrapper.get("[aria-label='太字']").attributes("disabled")).toBeDefined();
  });

  it("inline書式と引用を意味的要素で表示し、任意HTMLを実行しない", async () => {
    const wrapper = mount(WhiteboardPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-safe-preview" },
    });
    await wrapper.get("[data-testid='whiteboard-markdown']").setValue("> **太字**と<u>下線</u>\n\n*斜体* ~~取消~~ <script>alert(1)</script>");
    await wrapper.get("[data-testid='preview-toggle']").trigger("click");

    const preview = wrapper.get("[data-testid='whiteboard-preview']");
    expect(preview.get("blockquote strong").text()).toBe("太字");
    expect(preview.get("blockquote u").text()).toBe("下線");
    expect(preview.get("p em").text()).toBe("斜体");
    expect(preview.get("p del").text()).toBe("取消");
    expect(preview.find("script").exists()).toBe(false);
    expect(preview.text()).toContain("<script>alert(1)</script>");
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
