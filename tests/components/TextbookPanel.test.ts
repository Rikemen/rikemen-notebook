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
    expect(wrapper.get("[data-testid='thumbnail-page-25']").classes()).toContain(
      "thumbnail-strip__item--selected",
    );
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
    expect(first.get(".textbook-panel__body--preview").classes()).toContain(
      "textbook-panel__body--thumbnails-collapsed",
    );
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
    expect(wrapper.get(".textbook-panel__body--preview").classes()).toContain(
      "textbook-panel__body--preview-maximized",
    );
    expect(wrapper.get(".thumbnail-strip").classes()).toContain("thumbnail-strip--vertical");
  });

  it("ログイン時は保存済み教材を現在のノートへ復元する", async () => {
    const repository: TextbookRepository = {
      list: vi.fn().mockResolvedValue([
        {
          contentType: "application/pdf",
          createdAt: "2026-08-01T00:00:00.000Z",
          fileName: "saved.pdf",
          id: "saved-1",
          noteId: "note-saved",
          ownerUid: "user-1",
          pageCount: 3,
          sizeBytes: 1024,
          sourceUrl: "https://storage.example/saved.pdf",
          storagePath: "users/user-1/notes/note-saved/materials/saved-1/saved.pdf",
        },
      ]),
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
      save: vi.fn().mockResolvedValue({}),
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
    );
    await wrapper.get("[aria-label='資料一覧']").trigger("click");
    expect(wrapper.text()).toContain("保存済み");
  });
});
