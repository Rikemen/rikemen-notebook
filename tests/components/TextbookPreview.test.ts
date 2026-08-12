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

const dispatchPointer = (element: Element, type: "pointerdown" | "pointermove" | "pointerup", pointerId: number, clientX: number) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY: 0,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  element.dispatchEvent(event);
};

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

  it("PDF.js文書の準備中はブラウザビューアを同時起動しない", () => {
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 2,
        sourceUrl: "blob:https://example.com/material-1",
        textbookTitle: "解析.pdf",
      },
    });

    expect(wrapper.find("object").exists()).toBe(false);
    expect(wrapper.text()).toContain("PDFを読み込んでいます");
  });

  it("読込失敗時だけ再試行と別画面リンクを表示する", async () => {
    const wrapper = mount(TextbookPreview, {
      props: {
        loadStatus: "error",
        page: 2,
        sourceUrl: "https://storage.example/material-1.pdf",
        textbookTitle: "解析.pdf",
      },
    });

    expect(wrapper.find("object").exists()).toBe(false);
    expect(wrapper.get("a").attributes()).toMatchObject({
      href: "https://storage.example/material-1.pdf#page=2",
      rel: "noopener noreferrer",
      target: "_blank",
    });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
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

    resizeCallback([{ contentRect: { width: 480 } } as unknown as ResizeObserverEntry], {} as ResizeObserver);
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

  it("通常previewでもPDFを25%から800%まで拡大縮小して100%へ戻す", async () => {
    const pdfDocument = createDocument();
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 1,
        pdfDocument,
        sourceUrl: "blob:https://example.com/material-zoom",
        textbookTitle: "解析.pdf",
      },
    });
    await flushPromises();

    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("100%");
    expect(wrapper.find("[aria-label='PDFを縮小']").exists()).toBe(true);
    expect(wrapper.find("[aria-label='PDFを拡大']").exists()).toBe(true);
    await wrapper.get("[aria-label='PDFを縮小']").trigger("click");
    await wrapper.get("[aria-label='PDFを縮小']").trigger("click");
    await wrapper.get("[aria-label='PDFを縮小']").trigger("click");
    await flushPromises();

    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("25%");
    expect(wrapper.get("[aria-label='PDFを縮小']").attributes("disabled")).toBeDefined();
    expect(pdfDocument.renderPage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 1, 180);

    await wrapper.get("[aria-label='PDFを100%に戻す']").trigger("click");
    await flushPromises();
    await wrapper.get("[aria-label='PDFを拡大']").trigger("click");
    await flushPromises();

    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("125%");
    expect(pdfDocument.renderPage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 1, 900);

    await wrapper.get("[aria-label='PDFを100%に戻す']").trigger("click");
    await flushPromises();
    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("100%");
    expect(pdfDocument.renderPage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 1, 720);

    for (let index = 0; index < 28; index += 1) {
      await wrapper.get("[aria-label='PDFを拡大']").trigger("click");
    }
    await flushPromises();
    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("800%");
    expect(wrapper.get("[aria-label='PDFを拡大']").attributes("disabled")).toBeDefined();
    expect(pdfDocument.renderPage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 1, 5_760);
  });

  it("明示的な無効化またはPDF未準備ではズーム操作を表示しない", async () => {
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 1,
        pdfDocument: createDocument(),
        sourceUrl: "blob:https://example.com/material-reset",
        textbookTitle: "解析.pdf",
        zoomEnabled: true,
      },
    });
    await flushPromises();
    await wrapper.get("[aria-label='PDFを拡大']").trigger("click");
    await flushPromises();

    await wrapper.setProps({ zoomEnabled: false });
    await flushPromises();
    expect(wrapper.find("[aria-label='PDFを拡大']").exists()).toBe(false);

    await wrapper.setProps({ pdfDocument: null, zoomEnabled: true });
    await flushPromises();
    expect(wrapper.find("[aria-label='PDFを拡大']").exists()).toBe(false);
  });

  it("2本指の距離変化でズームし、終了後は追跡を止める", async () => {
    const pdfDocument = createDocument();
    const wrapper = mount(TextbookPreview, {
      props: {
        page: 1,
        pdfDocument,
        sourceUrl: "blob:https://example.com/material-pinch",
        textbookTitle: "解析.pdf",
        zoomEnabled: true,
      },
    });
    await flushPromises();
    const document = wrapper.get(".textbook-preview__document");

    dispatchPointer(document.element, "pointerdown", 1, 0);
    dispatchPointer(document.element, "pointerdown", 2, 100);
    dispatchPointer(document.element, "pointermove", 2, 200);
    await flushPromises();

    expect(wrapper.get("[data-testid='pdf-zoom-status']").text()).toBe("200%");
    expect(pdfDocument.renderPage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 1, 1440);

    const renderCalls = vi.mocked(pdfDocument.renderPage).mock.calls.length;
    dispatchPointer(document.element, "pointerup", 1, 0);
    dispatchPointer(document.element, "pointermove", 2, 250);
    await flushPromises();
    expect(pdfDocument.renderPage).toHaveBeenCalledTimes(renderCalls);
  });
});
