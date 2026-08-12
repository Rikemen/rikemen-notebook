import { describe, expect, it, vi } from "vitest";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { createPdfJsDocumentLoader } from "@/features/textbook/pdfDocument";

describe("pdfDocument", () => {
  it("PDF.js文書を一度読み込み、指定幅でページをcanvas描画する", async () => {
    const renderTask = {
      cancel: vi.fn(),
      promise: Promise.resolve(),
    };
    const page = {
      cleanup: vi.fn(),
      getViewport: vi.fn(({ scale }: { scale: number }) => ({
        height: 150 * scale,
        width: 100 * scale,
      })),
      render: vi.fn().mockReturnValue(renderTask),
    };
    const pdf = {
      getPage: vi.fn().mockResolvedValue(page),
      numPages: 6,
    } as unknown as PDFDocumentProxy;
    const destroy = vi.fn().mockResolvedValue(undefined);
    const getDocument = vi.fn().mockReturnValue({ destroy, promise: Promise.resolve(pdf) });
    const loader = createPdfJsDocumentLoader(getDocument);

    const document = await loader.load("blob:https://example.com/material");
    const canvas = globalThis.document.createElement("canvas");
    const render = await document.renderPage(canvas, 2, 200);
    await render.promise;
    render.cancel();

    expect(getDocument).toHaveBeenCalledOnce();
    expect(getDocument).toHaveBeenCalledWith({
      rangeChunkSize: 1_048_576,
      url: "blob:https://example.com/material",
    });
    expect(document.pageCount).toBe(6);
    expect(pdf.getPage).toHaveBeenCalledWith(2);
    expect(page.render).toHaveBeenCalledWith(expect.objectContaining({ canvas }));
    expect(canvas.style.width).toBe("200px");
    expect(renderTask.cancel).toHaveBeenCalledOnce();
    expect(page.cleanup).toHaveBeenCalledOnce();

    await document.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("800%表示でもCanvas backing storeを安全な辺長とpixel面積へ制限する", async () => {
    const page = {
      getViewport: vi.fn(({ scale }: { scale: number }) => ({
        height: 150 * scale,
        width: 100 * scale,
      })),
      render: vi.fn().mockReturnValue({ cancel: vi.fn(), promise: Promise.resolve() }),
    };
    const pdf = {
      getPage: vi.fn().mockResolvedValue(page),
      numPages: 1,
    } as unknown as PDFDocumentProxy;
    const getDocument = vi.fn().mockReturnValue({ destroy: vi.fn(), promise: Promise.resolve(pdf) });
    const loader = createPdfJsDocumentLoader(getDocument);
    vi.stubGlobal("devicePixelRatio", 2);

    const document = await loader.load("blob:https://example.com/large-material");
    const canvas = globalThis.document.createElement("canvas");
    await document.renderPage(canvas, 1, 5_760);

    expect(canvas.style.width).toBe("5760px");
    expect(canvas.style.height).toBe("8640px");
    expect(canvas.width).toBeLessThanOrEqual(8_192);
    expect(canvas.height).toBeLessThanOrEqual(8_192);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(16_777_216);
    vi.unstubAllGlobals();
  });

  it("不正なtarget幅は既定の720pxへ戻す", async () => {
    const page = {
      getViewport: vi.fn(({ scale }: { scale: number }) => ({ height: 150 * scale, width: 100 * scale })),
      render: vi.fn().mockReturnValue({ cancel: vi.fn(), promise: Promise.resolve() }),
    };
    const pdf = { getPage: vi.fn().mockResolvedValue(page), numPages: 1 } as unknown as PDFDocumentProxy;
    const loader = createPdfJsDocumentLoader(vi.fn().mockReturnValue({ destroy: vi.fn(), promise: Promise.resolve(pdf) }));
    const document = await loader.load("blob:https://example.com/default-material");
    const canvas = globalThis.document.createElement("canvas");

    await document.renderPage(canvas, 1, Number.POSITIVE_INFINITY);

    expect(canvas.style.width).toBe("720px");
  });

  it("PDF.jsの読込進捗を通知する", async () => {
    const pdf = { getPage: vi.fn(), numPages: 1 } as unknown as PDFDocumentProxy;
    const loadingTask = { destroy: vi.fn(), onProgress: undefined as ((progress: { loaded: number; total: number }) => void) | undefined, promise: Promise.resolve(pdf) };
    const loader = createPdfJsDocumentLoader(vi.fn().mockReturnValue(loadingTask));
    const onProgress = vi.fn();

    const loading = loader.load("https://storage.example/large.pdf", { onProgress });
    loadingTask.onProgress?.({ loaded: 25, total: 100 });
    await loading;

    expect(onProgress).toHaveBeenCalledWith({ loadedBytes: 25, totalBytes: 100 });
  });

  it("AbortSignalで進行中のPDF読込を破棄する", async () => {
    let rejectLoading: (error: unknown) => void = () => undefined;
    const loadingTask = {
      destroy: vi.fn().mockResolvedValue(undefined),
      promise: new Promise<PDFDocumentProxy>((_resolve, reject) => {
        rejectLoading = reject;
      }),
    };
    loadingTask.destroy.mockImplementation(async () => rejectLoading(new Error("cancelled")));
    const loader = createPdfJsDocumentLoader(vi.fn().mockReturnValue(loadingTask));
    const controller = new AbortController();

    const loading = loader.load("https://storage.example/large.pdf", { signal: controller.signal });
    controller.abort();

    await expect(loading).rejects.toThrow();
    expect(loadingTask.destroy).toHaveBeenCalledOnce();
  });
});
