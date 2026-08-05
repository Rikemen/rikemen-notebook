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
    expect(getDocument).toHaveBeenCalledWith({ url: "blob:https://example.com/material" });
    expect(document.pageCount).toBe(6);
    expect(pdf.getPage).toHaveBeenCalledWith(2);
    expect(page.render).toHaveBeenCalledWith(expect.objectContaining({ canvas }));
    expect(canvas.style.width).toBe("200px");
    expect(renderTask.cancel).toHaveBeenCalledOnce();

    await document.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });
});
