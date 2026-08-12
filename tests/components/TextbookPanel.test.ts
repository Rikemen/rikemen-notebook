import { createPinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TextbookPanel from "@/components/textbook/TextbookPanel.vue";
import type { AuthUser } from "@/features/auth/types";
import type { LoadedPdfDocument, PdfDocumentLoader } from "@/features/textbook/pdfDocument";
import type { TextbookRepository } from "@/features/textbook/textbookRepository";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

const createSizedFile = (size: number, type = "application/pdf") => {
  const file = new File(["pdf"], type === "application/pdf" ? "textbook.pdf" : "textbook.txt", {
    type,
  });
  Object.defineProperty(file, "size", {
    value: size,
  });
  return file;
};

const createPdfLoader = (pageCount = 1): PdfDocumentLoader => ({
  load: vi.fn().mockResolvedValue({
    destroy: vi.fn().mockResolvedValue(undefined),
    pageCount,
    renderPage: vi.fn().mockResolvedValue({
      cancel: vi.fn(),
      promise: Promise.resolve(),
    }),
  } satisfies LoadedPdfDocument),
});

describe("TextbookPanel", () => {
  it("未登録時はダミーを表示せず空状態から始まる", () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-empty",
      },
    });

    expect(wrapper.text()).toContain("PDFを追加してください");
    expect(wrapper.text()).not.toContain("微分積分学（偏微分から応用）");
    expect(wrapper.get("[aria-label='目次']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[aria-label='プレビュー']").attributes("disabled")).toBeDefined();
  });

  it("未ログイン時は10MBまでの一時利用を表示する", () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-1",
      },
    });

    expect(wrapper.text()).toContain("未ログインでは10MBまで一時利用できます");
    expect(wrapper.text()).toContain("上限: 10MB");
  });

  it("ログイン時は5GBまでの保存利用を表示する", () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        currentUser: user,
        noteId: "note-1",
      },
    });

    expect(wrapper.text()).toContain("教材履歴に保存されます");
    expect(wrapper.text()).toContain("上限: 5GB");
  });

  it("上限超過ファイルを拒否する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-1",
      },
    });
    const input = wrapper.get("input");
    const file = createSizedFile(10 * 1024 * 1024 + 1);

    Object.defineProperty(input.element, "files", {
      value: [file],
    });
    await input.trigger("change");

    expect(wrapper.text()).toContain("10MB以下のPDFを選択してください");
    expect(wrapper.emitted("select-file")).toBeUndefined();
  });

  it.each([
    { file: createSizedFile(0), message: "空のPDFは選択できません" },
    { file: createSizedFile(1024, "text/plain"), message: "PDF形式のファイルを選択してください" },
  ])("不正なファイルを拒否する", async ({ file, message }) => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-invalid",
      },
    });
    const input = wrapper.get("input");

    Object.defineProperty(input.element, "files", {
      value: [file],
    });
    await input.trigger("change");

    expect(wrapper.text()).toContain(message);
    expect(wrapper.emitted("select-file")).toBeUndefined();
  });

  it("副導線からもPDF選択inputを開く", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-picker",
      },
    });
    const input = wrapper.get("[data-testid='textbook-file']");
    const click = vi.spyOn(input.element as HTMLInputElement, "click");

    await wrapper.get("[data-testid='textbook-file-trigger']").trigger("click");

    expect(click).toHaveBeenCalledOnce();
  });

  it("資料一覧・目次・プレビューを1つずつ表示する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-modes",
        pdfLoader: createPdfLoader(),
      },
    });

    const input = wrapper.get("input");
    const file = createSizedFile(2 * 1024 * 1024);
    Object.defineProperty(input.element, "files", {
      value: [file],
    });
    await input.trigger("change");

    expect(wrapper.find(".textbook-preview").exists()).toBe(true);
    expect(wrapper.find(".material-table-of-contents").exists()).toBe(false);
    await wrapper.get("[aria-label='資料一覧']").trigger("click");
    expect(wrapper.find(".textbook-list").exists()).toBe(true);
    expect(wrapper.find(".textbook-preview").exists()).toBe(false);

    await wrapper.get("[aria-label='目次']").trigger("click");
    expect(wrapper.find(".textbook-list").exists()).toBe(false);
    expect(wrapper.find(".material-table-of-contents").exists()).toBe(true);

    await wrapper.get("[aria-label='プレビュー']").trigger("click");
    expect(wrapper.find(".material-table-of-contents").exists()).toBe(false);
    expect(wrapper.find(".textbook-preview").exists()).toBe(true);
    expect(wrapper.find("[data-testid='textbook-file']").exists()).toBe(false);
  });

  it("有効なPDFを現在のノートの資料一覧へ追加する", async () => {
    const pinia = createPinia();
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-upload",
        pdfLoader: createPdfLoader(),
      },
    });
    const input = wrapper.get("input");
    const file = createSizedFile(2 * 1024 * 1024);

    Object.defineProperty(input.element, "files", {
      value: [file],
    });
    await input.trigger("change");

    expect(wrapper.text()).toContain("textbook.pdf");
    expect(wrapper.emitted("select-file")?.[0]).toEqual([file]);

    const otherNote = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-other",
      },
    });
    expect(otherNote.text()).not.toContain("textbook.pdf");
  });

  it("追加した目次から指定ページのプレビューへ移動する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-toc",
        pdfLoader: createPdfLoader(6),
      },
    });

    const input = wrapper.get("input");
    Object.defineProperty(input.element, "files", {
      value: [createSizedFile(2 * 1024 * 1024)],
    });
    await input.trigger("change");
    await flushPromises();
    await wrapper.get("[aria-label='目次']").trigger("click");
    await wrapper.get("[data-testid='toc-title']").setValue("関数の極限");
    await wrapper.get("[data-testid='toc-page']").setValue("3");
    await wrapper.get(".material-table-of-contents__form").trigger("submit");
    await wrapper.get("[data-testid^='toc-item-']").trigger("click");

    expect(wrapper.get("[aria-label='プレビュー']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.text()).toContain("3ページ");
    expect(wrapper.findAll(".thumbnail-strip__item")[2].classes()).toContain("thumbnail-strip__item--selected");
  });

  it("25ページ目以降をページ送りから選択して上部へ表示する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-pagination",
        pdfLoader: createPdfLoader(30),
      },
    });
    const input = wrapper.get("input");
    Object.defineProperty(input.element, "files", {
      value: [createSizedFile(2 * 1024 * 1024)],
    });

    await input.trigger("change");
    await flushPromises();
    await wrapper.get("[aria-label='次のサムネイルページ']").trigger("click");
    await wrapper.get("[aria-label='次のサムネイルページ']").trigger("click");
    await wrapper.get("[data-testid='thumbnail-page-25']").trigger("click");
    await flushPromises();

    expect(wrapper.get(".textbook-preview h3").text()).toContain("25ページ");
    expect(wrapper.get("[data-testid='thumbnail-page-25']").classes()).toContain("thumbnail-strip__item--selected");
  });

  it("同じノートで再マウントしても教材とページの選択を保持する", async () => {
    const pinia = createPinia();
    const first = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
        pdfLoader: createPdfLoader(6),
      },
    });

    const input = first.get("input");
    Object.defineProperty(input.element, "files", {
      value: [createSizedFile(2 * 1024 * 1024)],
    });
    await input.trigger("change");
    await flushPromises();
    await first.get("[aria-label='プレビュー']").trigger("click");
    await first.findAll(".thumbnail-strip__item")[2].trigger("click");
    first.unmount();

    const restored = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
        pdfLoader: createPdfLoader(6),
      },
    });
    const otherNote = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-other",
      },
    });

    expect(restored.get("[aria-label='プレビュー']").attributes("aria-pressed")).toBe("true");
    expect(restored.findAll(".thumbnail-strip__item")[2].classes()).toContain("thumbnail-strip__item--selected");
    await restored.get("[aria-label='資料一覧']").trigger("click");
    expect(restored.findAll(".textbook-list__item")[0].classes()).toContain("textbook-list__item--selected");
    expect(otherNote.findAll(".textbook-list__item")).toHaveLength(0);
  });

  it("サムネイルの折りたたみ状態を同じノートで保持する", async () => {
    const pinia = createPinia();
    const first = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-thumbnails",
        pdfLoader: createPdfLoader(6),
      },
    });
    const input = first.get("input");
    Object.defineProperty(input.element, "files", {
      value: [createSizedFile(2 * 1024 * 1024)],
    });
    await input.trigger("change");
    await flushPromises();

    await first.get("[aria-label='サムネイルを最小化']").trigger("click");
    expect(first.get(".textbook-panel__body--preview").classes()).toContain("textbook-panel__body--thumbnails-collapsed");
    first.unmount();

    const restored = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-thumbnails",
        pdfLoader: createPdfLoader(6),
      },
    });
    await flushPromises();

    expect(restored.find(".thumbnail-strip__grid").exists()).toBe(false);
    expect(restored.find("[aria-label='サムネイルを表示']").exists()).toBe(true);
  });

  it("最大化時はサムネイルを左レール向けの縦表示にする", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        isMaximized: true,
        noteId: "note-maximized",
        pdfLoader: createPdfLoader(6),
      },
    });
    const input = wrapper.get("input");
    Object.defineProperty(input.element, "files", {
      value: [createSizedFile(2 * 1024 * 1024)],
    });

    await input.trigger("change");
    await flushPromises();

    expect(wrapper.classes()).toContain("textbook-panel--maximized");
    expect(wrapper.get(".textbook-panel__body--preview").classes()).toContain("textbook-panel__body--preview-maximized");
    expect(wrapper.get(".thumbnail-strip").classes()).toContain("thumbnail-strip--vertical");
  });

  it("通常previewでもPDFズーム操作を表示する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-normal-zoom", pdfLoader: createPdfLoader(2) },
    });
    const input = wrapper.get("input");
    Object.defineProperty(input.element, "files", { value: [createSizedFile(1024)] });

    await input.trigger("change");
    await flushPromises();

    expect(wrapper.find("[aria-label='PDFズーム']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("100%");
  });

  it("ログイン時は保存済み教材を現在のノートへ復元する", async () => {
    const repository: TextbookRepository = {
      list: vi.fn().mockResolvedValue([
        {
          contentType: "application/pdf",
          createdAt: "2026-08-01T00:00:00.000Z",
          fileName: "saved.pdf",
          id: "saved-1",
          kind: "pdf",
          noteId: "note-saved",
          ownerUid: "user-1",
          pageCount: 3,
          sizeBytes: 1024,
          sourceUrl: "https://storage.example/saved.pdf",
          storagePath: "users/user-1/notes/note-saved/materials/saved-1/saved.pdf",
        },
      ]),
      rename: vi.fn(),
      save: vi.fn(),
    };
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        currentUser: user,
        noteId: "note-saved",
        pdfLoader: createPdfLoader(3),
        repository,
      },
    });

    await flushPromises();

    expect(repository.list).toHaveBeenCalledWith("user-1", "note-saved");
    expect(wrapper.text()).toContain("saved.pdf");
    await wrapper.get("[aria-label='プレビュー']").trigger("click");
    await flushPromises();
    expect(wrapper.find("canvas").exists()).toBe(true);
    expect(wrapper.find("object").exists()).toBe(false);
  });

  it("ログイン時だけ選択したPDFをrepositoryへ保存する", async () => {
    const repository: TextbookRepository = {
      list: vi.fn().mockResolvedValue([]),
      rename: vi.fn(),
      save: vi.fn(async (input) => {
        if (input.kind === "bookmark") return {} as never;
        return {
          contentType: "application/pdf" as const,
          createdAt: "2026-08-08T00:00:00.000Z",
          fileName: input.file.name,
          id: input.id,
          kind: "pdf" as const,
          noteId: input.noteId,
          ownerUid: user.uid,
          pageCount: input.pageCount ?? 1,
          sizeBytes: input.file.size,
          sourceUrl: "https://storage.example/saved.pdf",
          storagePath: `users/${user.uid}/notes/${input.noteId}/materials/${input.id}/${input.file.name}`,
        };
      }),
    };
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        currentUser: user,
        noteId: "note-save",
        pdfLoader: createPdfLoader(),
        repository,
      },
    });
    await flushPromises();
    const input = wrapper.get("input");
    const file = createSizedFile(2 * 1024 * 1024);
    Object.defineProperty(input.element, "files", { value: [file] });

    await input.trigger("change");
    await flushPromises();

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        noteId: "note-save",
      }),
      user,
      expect.objectContaining({ onProgress: expect.any(Function), signal: expect.any(AbortSignal) }),
    );
    await wrapper.get("[aria-label='資料一覧']").trigger("click");
    expect(wrapper.text()).toContain("保存済み");
  });

  it("PNG・JPG・JPEGをPDF loaderへ渡さず画像としてpreviewする", async () => {
    const pdfLoader = createPdfLoader();
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-image", pdfLoader },
    });
    const input = wrapper.get("[data-testid='textbook-file']");
    const file = new File(["image"], "graph.png", { type: "image/png" });
    Object.defineProperty(input.element, "files", { value: [file] });

    await input.trigger("change");
    await flushPromises();

    expect(pdfLoader.load).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: "ImageMaterialPreview" }).exists()).toBe(true);
    expect(wrapper.get(".image-material-preview img").attributes("alt")).toBe("graph.png");
    expect(wrapper.findComponent({ name: "PageThumbnailStrip" }).exists()).toBe(false);
  });

  it("最大化した画像はサムネイル列なしでpreview全面を使う", async () => {
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { isMaximized: true, noteId: "note-image-maximized", pdfLoader: createPdfLoader() },
    });
    const input = wrapper.get("[data-testid='textbook-file']");
    const file = new File(["image"], "graph.png", { type: "image/png" });
    Object.defineProperty(input.element, "files", { value: [file] });

    await input.trigger("change");
    await flushPromises();

    const body = wrapper.get(".textbook-panel__body--preview");
    expect(body.classes()).toContain("textbook-panel__body--image-preview");
    expect(body.classes()).toContain("textbook-panel__body--preview-maximized");
    expect(wrapper.findComponent({ name: "PageThumbnailStrip" }).exists()).toBe(false);
    expect(wrapper.find("[aria-label='画像ズーム']").exists()).toBe(true);
  });

  it("HTTP(S)ブックマークを保存しnoopener付きの別タブリンクにする", async () => {
    const repository: TextbookRepository = {
      list: vi.fn().mockResolvedValue([]),
      rename: vi.fn(),
      save: vi.fn().mockResolvedValue({
        createdAt: "2026-08-08T00:00:00.000Z",
        id: "bookmark-1",
        kind: "bookmark",
        noteId: "note-bookmark",
        ownerUid: user.uid,
        title: "公式ドキュメント",
        url: "https://example.com/docs#intro",
      }),
    };
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { currentUser: user, noteId: "note-bookmark", repository },
    });
    await flushPromises();
    const controls = wrapper.findComponent({ name: "MaterialAddControls" });
    await controls.findAll("[role='tab']")[1].trigger("click");
    const inputs = controls.findAll("input");
    await inputs[0].setValue("公式ドキュメント");
    await inputs[1].setValue("https://example.com/docs#intro");
    await controls.get("form").trigger("submit");
    await flushPromises();

    const bookmark = wrapper.get(".textbook-list__item[href]");
    expect(bookmark.attributes("href")).toBe("https://example.com/docs#intro");
    expect(bookmark.attributes("target")).toBe("_blank");
    expect(bookmark.attributes("rel")).toBe("noopener noreferrer");
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ kind: "bookmark", noteId: "note-bookmark" }), user);
  });

  it("危険なschemeのブックマークを追加しない", async () => {
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { noteId: "note-invalid-bookmark" },
    });
    const controls = wrapper.findComponent({ name: "MaterialAddControls" });
    await controls.findAll("[role='tab']")[1].trigger("click");
    await controls.findAll("input")[1].setValue("javascript:alert(1)");
    await controls.get("form").trigger("submit");

    expect(wrapper.text()).toContain("httpまたはhttpsのURL");
    expect(wrapper.find(".textbook-list__item[href]").exists()).toBe(false);
  });

  it("保存済み資料の表示名を楽観更新しRepositoryへ保存する", async () => {
    const repository: TextbookRepository = {
      list: vi.fn().mockResolvedValue([{
        contentType: "application/pdf",
        createdAt: "2026-08-01T00:00:00.000Z",
        fileName: "original.pdf",
        id: "rename-1",
        kind: "pdf",
        noteId: "note-rename",
        ownerUid: user.uid,
        pageCount: 2,
        sizeBytes: 1024,
        sourceUrl: "https://storage.example/original.pdf",
        storagePath: "users/user-1/notes/note-rename/materials/rename-1/original.pdf",
      }]),
      rename: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(),
    };
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { currentUser: user, noteId: "note-rename", pdfLoader: createPdfLoader(2), repository },
    });
    await flushPromises();

    await wrapper.get("[aria-label='original.pdfの資料名を変更']").trigger("click");
    await wrapper.get("[aria-label='資料名']").setValue("解析学.pdf");
    await wrapper.get("[aria-label='資料名']").trigger("keydown.enter");
    await flushPromises();

    expect(wrapper.text()).toContain("解析学.pdf");
    expect(repository.rename).toHaveBeenCalledWith(
      { displayName: "解析学.pdf", id: "rename-1", noteId: "note-rename" },
      user,
    );
  });

  it("100MiBまたは500ページのPDFに大容量案内を表示する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: { plugins: [createPinia()] },
      props: { currentUser: user, noteId: "note-large", pdfLoader: createPdfLoader(500) },
    });
    const input = wrapper.get("[data-testid='textbook-file']");
    Object.defineProperty(input.element, "files", { value: [createSizedFile(100 * 1024 * 1024)] });

    await input.trigger("change");
    await flushPromises();
    await wrapper.get("[aria-label='資料一覧']").trigger("click");

    expect(wrapper.text()).toContain("大きなPDF");
  });
});
