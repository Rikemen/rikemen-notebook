import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TextbookPanel from "@/components/textbook/TextbookPanel.vue";
import type { AuthUser } from "@/features/auth/types";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

const createSizedFile = (size: number) => {
  const file = new File(["pdf"], "textbook.pdf", {
    type: "application/pdf",
  });
  Object.defineProperty(file, "size", {
    value: size,
  });
  return file;
};

describe("TextbookPanel", () => {
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

  it("資料一覧・目次・プレビューを1つずつ表示する", async () => {
    const wrapper = mount(TextbookPanel, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        noteId: "note-modes",
      },
    });

    expect(wrapper.find(".textbook-list").exists()).toBe(true);
    expect(wrapper.find(".material-table-of-contents").exists()).toBe(false);
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
      },
    });

    await wrapper.get("[aria-label='目次']").trigger("click");
    await wrapper.get("[data-testid='toc-title']").setValue("関数の極限");
    await wrapper.get("[data-testid='toc-page']").setValue("3");
    await wrapper.get(".material-table-of-contents__form").trigger("submit");
    await wrapper.get("[data-testid^='toc-item-']").trigger("click");

    expect(wrapper.get("[aria-label='プレビュー']").attributes("aria-pressed")).toBe("true");
    expect(wrapper.text()).toContain("3ページ");
    expect(wrapper.findAll(".thumbnail-strip__item")[2].classes()).toContain("thumbnail-strip__item--selected");
  });

  it("同じノートで再マウントしても教材とページの選択を保持する", async () => {
    const pinia = createPinia();
    const first = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
      },
    });

    await first.findAll(".textbook-list__item")[1].trigger("click");
    await first.get("[aria-label='プレビュー']").trigger("click");
    await first.findAll(".thumbnail-strip__item")[2].trigger("click");
    first.unmount();

    const restored = mount(TextbookPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        noteId: "note-persisted",
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
    expect(restored.findAll(".textbook-list__item")[1].classes()).toContain("textbook-list__item--selected");
    expect(otherNote.findAll(".textbook-list__item")[0].classes()).toContain("textbook-list__item--selected");
  });
});
