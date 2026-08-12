import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";
import type { LoadedPdfDocument, PdfDocumentLoader } from "@/features/textbook/pdfDocument";
import { usePdfDocument } from "@/features/textbook/usePdfDocument";

const createDocument = (): LoadedPdfDocument => ({
  destroy: vi.fn().mockResolvedValue(undefined),
  pageCount: 4,
  renderPage: vi.fn(),
});

const mountHarness = (loader: PdfDocumentLoader) =>
  mount(
    defineComponent({
      setup: () => usePdfDocument(() => loader),
      template: "<div />",
    }),
  );

describe("usePdfDocument", () => {
  it("文書切替開始時に旧文書を破棄し、新しい進捗と状態を保持する", async () => {
    const first = createDocument();
    const second = createDocument();
    const loader: PdfDocumentLoader = {
      load: vi.fn(async (sourceUrl, options) => {
        options?.onProgress?.({ loadedBytes: 50, totalBytes: 100 });
        return sourceUrl.endsWith("first.pdf") ? first : second;
      }),
    };
    const wrapper = mountHarness(loader);

    await wrapper.vm.loadPdfDocument("https://storage.example/first.pdf");
    const loading = wrapper.vm.loadPdfDocument("https://storage.example/second.pdf");
    expect(wrapper.vm.pdfLoadState.status).toBe("loading");
    await loading;

    expect(first.destroy).toHaveBeenCalledOnce();
    expect(wrapper.vm.pdfDocument).toBe(second);
    expect(wrapper.vm.pdfLoadState).toEqual({
      progress: { loadedBytes: 50, ratio: 0.5, totalBytes: 100 },
      status: "ready",
    });
  });

  it("新しい文書の読込失敗時に旧文書を残さない", async () => {
    const first = createDocument();
    const loader: PdfDocumentLoader = {
      load: vi.fn().mockResolvedValueOnce(first).mockRejectedValueOnce(new Error("failed")),
    };
    const wrapper = mountHarness(loader);
    await wrapper.vm.loadPdfDocument("first.pdf");

    await expect(wrapper.vm.loadPdfDocument("broken.pdf")).resolves.toBeNull();

    expect(first.destroy).toHaveBeenCalledOnce();
    expect(wrapper.vm.pdfDocument).toBeNull();
    expect(wrapper.vm.pdfLoadState.status).toBe("error");
  });

  it("unmount時に現在の文書を破棄する", async () => {
    const document = createDocument();
    const wrapper = mountHarness({ load: vi.fn().mockResolvedValue(document) });
    await wrapper.vm.loadPdfDocument("document.pdf");

    wrapper.unmount();

    expect(document.destroy).toHaveBeenCalledOnce();
  });
});
