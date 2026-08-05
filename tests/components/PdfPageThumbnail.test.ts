import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import PdfPageThumbnail from "@/components/textbook/PdfPageThumbnail.vue";
import type { LoadedPdfDocument, PdfPageRenderHandle } from "@/features/textbook/pdfDocument";

describe("PdfPageThumbnail", () => {
  it("指定された実PDFページをサムネイルcanvasへ描画する", async () => {
    const pdfDocument: LoadedPdfDocument = {
      destroy: vi.fn().mockResolvedValue(undefined),
      pageCount: 5,
      renderPage: vi.fn().mockResolvedValue({
        cancel: vi.fn(),
        promise: Promise.resolve(),
      }),
    };
    const wrapper = mount(PdfPageThumbnail, {
      props: {
        page: 3,
        pdfDocument,
      },
    });

    await flushPromises();

    expect(wrapper.find("canvas").exists()).toBe(true);
    expect(pdfDocument.renderPage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 3, 96);
  });

  it("描画準備中に一覧から外れてもキャンセル例外を未処理にしない", async () => {
    let resolveRender: (handle: PdfPageRenderHandle) => void = () => undefined;
    let rejectTask: (reason?: unknown) => void = () => undefined;
    const renderPromise = new Promise<void>((_resolve, reject) => {
      rejectTask = reject;
    });
    const cancel = vi.fn(() => rejectTask(new Error("cancelled")));
    const pdfDocument: LoadedPdfDocument = {
      destroy: vi.fn().mockResolvedValue(undefined),
      pageCount: 30,
      renderPage: vi.fn(
        () =>
          new Promise<PdfPageRenderHandle>((resolve) => {
            resolveRender = resolve;
          }),
      ),
    };
    const wrapper = mount(PdfPageThumbnail, {
      props: {
        page: 1,
        pdfDocument,
      },
    });
    await flushPromises();

    wrapper.unmount();
    resolveRender({ cancel, promise: renderPromise });
    await flushPromises();

    expect(cancel).toHaveBeenCalledOnce();
  });
});
