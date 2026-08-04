import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TextbookPreview from "@/components/textbook/TextbookPreview.vue";
import type { LoadedPdfDocument } from "@/features/textbook/pdfDocument";

const createDocument = (): LoadedPdfDocument => ({
  destroy: vi.fn().mockResolvedValue(undefined),
  pageCount: 4,
  renderPage: vi.fn().mockResolvedValue({
    cancel: vi.fn(),
    promise: Promise.resolve(),
  }),
});

describe("TextbookPreview", () => {
  it("PDF.jsで選択した実PDFページをcanvasへ描画する", async () => {
    const pdfDocument = createDocument();
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 2,
        pdfDocument,
        sourceUrl: "blob:https://example.com/material-1",
        textbookTitle: "解析.pdf",
      },
    });

    await flushPromises();

    expect(wrapper.find("canvas").exists()).toBe(true);
    expect(pdfDocument.renderPage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 2, 720);
    expect(wrapper.find("object").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("関数の極限");
    expect(wrapper.text()).not.toContain("平均変化の概念");
  });

  it("PDF.js文書の準備前はブラウザビューアへフォールバックする", () => {
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 2,
        sourceUrl: "blob:https://example.com/material-1",
        textbookTitle: "解析.pdf",
      },
    });

    expect(wrapper.get("object").attributes("data")).toBe("blob:https://example.com/material-1#page=2");
  });

  it("資料エリアの幅変更時に旧描画を止めて幅いっぱいに再描画する", async () => {
    let resizeCallback: ResizeObserverCallback = () => undefined;
    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      disconnect() {}

      observe() {}
    }
    const cancel = vi.fn();
    const pdfDocument = createDocument();
    vi.mocked(pdfDocument.renderPage).mockResolvedValue({
      cancel,
      promise: Promise.resolve(),
    });
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 2,
        pdfDocument,
        sourceUrl: "blob:https://example.com/material-1",
        textbookTitle: "解析.pdf",
      },
    });
    await flushPromises();

    resizeCallback(
      [{ contentRect: { width: 480 } } as unknown as ResizeObserverEntry],
      {} as ResizeObserver,
    );
    await flushPromises();

    expect(cancel).toHaveBeenCalled();
    expect(pdfDocument.renderPage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 2, 480);
    wrapper.unmount();
    vi.unstubAllGlobals();
  });

  it("source未選択時は空状態を表示する", () => {
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 1,
        sourceUrl: "",
        textbookTitle: "資料が選択されていません",
      },
    });

    expect(wrapper.find("object").exists()).toBe(false);
    expect(wrapper.text()).toContain("プレビューするPDFを選択してください");
  });
});
