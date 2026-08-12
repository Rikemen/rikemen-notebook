import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import NoteDeleteConfirmDialog from "@/components/notes/NoteDeleteConfirmDialog.vue";

let wrapper: VueWrapper | null = null;

const mountDialog = (attachTo?: Element) => {
  wrapper = mount(NoteDeleteConfirmDialog, {
    attachTo,
    props: {
      noteTitle: "微分の基礎",
    },
  });

  return wrapper;
};

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe("NoteDeleteConfirmDialog", () => {
  it("削除対象と取り消せない影響をdialogとして表示する", () => {
    const dialogWrapper = mountDialog();
    const dialog = dialogWrapper.get("[role='dialog']");
    const titleId = dialog.attributes("aria-labelledby");

    expect(dialog.attributes("aria-modal")).toBe("true");
    expect(titleId).toBe("note-delete-confirm-dialog-title");
    expect(dialogWrapper.get(`#${titleId}`).text()).toBe("本当に削除していいですか？");
    expect(dialogWrapper.text()).toContain("微分の基礎");
    expect(dialogWrapper.text()).toContain("PDF・画像・手書き・AIチャット");
    expect(dialogWrapper.text()).toContain("取り消せません");
  });

  it("キャンセルではcloseだけをemitする", async () => {
    const dialogWrapper = mountDialog();

    await dialogWrapper.get("[data-testid='cancel-note-delete']").trigger("click");

    expect(dialogWrapper.emitted("close")).toHaveLength(1);
    expect(dialogWrapper.emitted("confirm")).toBeUndefined();
  });

  it("背景クリックではcloseだけをemitする", async () => {
    const dialogWrapper = mountDialog();

    await dialogWrapper.get("[role='dialog']").trigger("click");

    expect(dialogWrapper.emitted("close")).toHaveLength(1);
    expect(dialogWrapper.emitted("confirm")).toBeUndefined();
  });

  it("Escapeではcloseだけをemitし、unmount後は反応しない", () => {
    const onClose = vi.fn();
    wrapper = mount(NoteDeleteConfirmDialog, {
      props: {
        noteTitle: "微分の基礎",
        onClose,
      },
    });
    const dialogWrapper = wrapper;

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialogWrapper.emitted("confirm")).toBeUndefined();

    dialogWrapper.unmount();
    wrapper = null;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("削除するではconfirmを1回emitする", async () => {
    const dialogWrapper = mountDialog();

    await dialogWrapper.get("[data-testid='confirm-note-delete']").trigger("click");

    expect(dialogWrapper.emitted("confirm")).toHaveLength(1);
    expect(dialogWrapper.emitted("close")).toBeUndefined();
  });

  it("表示直後はキャンセルへフォーカスする", () => {
    const dialogWrapper = mountDialog(document.body);
    const cancelButton = dialogWrapper.get<HTMLButtonElement>("[data-testid='cancel-note-delete']");

    expect(document.activeElement).toBe(cancelButton.element);
  });
});
