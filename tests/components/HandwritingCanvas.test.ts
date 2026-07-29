import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import HandwritingCanvas from "@/components/whiteboard/HandwritingCanvas.vue";
import { resolveCanvasPoint } from "@/features/whiteboard/handwritingCanvas";

describe("HandwritingCanvas", () => {
  it("canvas内座標へ変換する", () => {
    const canvas = {
      getBoundingClientRect: () => ({
        height: 50,
        left: 10,
        top: 20,
        width: 100,
      }),
      height: 100,
      width: 200,
    } as HTMLCanvasElement;

    expect(resolveCanvasPoint({ clientX: 60, clientY: 45 }, canvas)).toEqual({ x: 100, y: 50 });
  });

  it("手書き内容を保存イベントで返す", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const wrapper = mount(HandwritingCanvas);
    const canvas = wrapper.get("[data-testid='handwriting-canvas']");
    vi.spyOn(canvas.element as HTMLCanvasElement, "toDataURL").mockReturnValue("data:image/png;base64,test");
    vi.spyOn(canvas.element as HTMLCanvasElement, "getBoundingClientRect").mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const vm = wrapper.vm as unknown as {
      continueStroke: (event: Pick<PointerEvent, "clientX" | "clientY">) => void;
      finishStroke: () => void;
      startStroke: (event: Pick<PointerEvent, "clientX" | "clientY">) => void;
    };
    vm.startStroke({ clientX: 1, clientY: 1 });
    vm.continueStroke({ clientX: 2, clientY: 2 });
    vm.finishStroke();
    await wrapper.get(".handwriting-canvas__save").trigger("click");

    expect(wrapper.emitted("save")?.[0]?.[0]).toMatchObject({
      dataUrl: "data:image/png;base64,test",
    });
  });
});
