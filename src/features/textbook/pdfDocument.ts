import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export interface PdfPageRenderHandle {
  cancel(): void;
  promise: Promise<void>;
}

export interface LoadedPdfDocument {
  destroy(): Promise<void>;
  pageCount: number;
  renderPage(
    canvas: HTMLCanvasElement,
    pageNumber: number,
    targetWidth: number,
  ): Promise<PdfPageRenderHandle>;
}

export interface PdfDocumentLoader {
  load(sourceUrl: string): Promise<LoadedPdfDocument>;
}

interface PdfJsLoadingTask {
  destroy(): Promise<void>;
  promise: Promise<PDFDocumentProxy>;
}

type GetPdfDocument = (source: { url: string }) => PdfJsLoadingTask;

const MAX_PIXEL_RATIO = 2;
const DEFAULT_TARGET_WIDTH = 720;

const adaptRenderTask = (task: RenderTask): PdfPageRenderHandle => ({
  cancel: () => task.cancel(),
  promise: task.promise,
});

const getTargetWidth = (targetWidth: number) => {
  if (targetWidth > 0) {
    return targetWidth;
  }
  return DEFAULT_TARGET_WIDTH;
};

const configureCanvas = (
  canvas: HTMLCanvasElement,
  viewport: { height: number; width: number },
  pixelRatio: number,
) => {
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  canvas.style.width = `${Math.ceil(viewport.width / pixelRatio)}px`;
  canvas.style.height = `${Math.ceil(viewport.height / pixelRatio)}px`;
};

const createLoadedDocument = (
  document: PDFDocumentProxy,
  destroy: () => Promise<void>,
): LoadedPdfDocument => ({
  destroy,
  pageCount: document.numPages,
  renderPage: async (canvas, pageNumber, targetWidth) => {
    const page = await document.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const cssScale = getTargetWidth(targetWidth) / baseViewport.width;
    const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const viewport = page.getViewport({ scale: cssScale * pixelRatio });

    configureCanvas(canvas, viewport, pixelRatio);
    return adaptRenderTask(page.render({ canvas, viewport }));
  },
});

export const createPdfJsDocumentLoader = (getDocument: GetPdfDocument): PdfDocumentLoader => ({
  load: async (sourceUrl) => {
    const loadingTask = getDocument({ url: sourceUrl });
    const document = await loadingTask.promise;
    return createLoadedDocument(document, () => loadingTask.destroy());
  },
});

let pdfJsModulePromise: Promise<typeof import("pdfjs-dist")> | null = null;

const loadPdfJs = async () => {
  pdfJsModulePromise ??= import("pdfjs-dist");
  const pdfJs = await pdfJsModulePromise;
  pdfJs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfJs;
};

export const pdfJsDocumentLoader: PdfDocumentLoader = {
  load: async (sourceUrl) => {
    const pdfJs = await loadPdfJs();
    return createPdfJsDocumentLoader(pdfJs.getDocument).load(sourceUrl);
  },
};
