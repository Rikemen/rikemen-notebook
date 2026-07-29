import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import WhiteboardDrawingDialog from "@/components/whiteboard/WhiteboardDrawingDialog.vue";

const drawing = {
  createdAt: "2026-07-29T00:00:00.000Z",
  dataUrl: "data:image/png;base64,test",
  id: "drawing-1",
  strokes: [],
  updatedAt: "2026-07-29T00:00:00.000Z",
};

describe("WhiteboardDrawingDialog", () => {
  it("画像と編集・削除・閉じる操作を表示して通知する", async () => {
    const wrapper = mount(WhiteboardDrawingDialog, {
      props: {
        drawing,
      },
    });

    expect(wrapper.get("[role='dialog']").attributes("aria-modal")).toBe("true");
    expect(wrapper.get("img").attributes("src")).toBe(drawing.dataUrl);

    await wrapper.get("[data-testid='edit-drawing']").trigger("click");
    await wrapper.get("[data-testid='delete-drawing']").trigger("click");
    await wrapper.get("[aria-label='閉じる']").trigger("click");

    expect(wrapper.emitted("edit")).toHaveLength(1);
    expect(wrapper.emitted("delete")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("Escapeで閉じる", async () => {
    const wrapper = mount(WhiteboardDrawingDialog, {
      attachTo: document.body,
      props: {
        drawing,
      },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("close")).toHaveLength(1);
    wrapper.unmount();
  });
});
