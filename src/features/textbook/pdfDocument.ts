/* eslint-disable max-statements */
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export interface PdfPageRenderHandle {
  cancel(): void;
  promise: Promise<void>;
}

export interface LoadedPdfDocument {
  destroy(): Promise<void>;
  pageCount: number;
  renderPage(canvas: HTMLCanvasElement, pageNumber: number, targetWidth: number): Promise<PdfPageRenderHandle>;
}

export interface PdfDocumentLoadProgress {
  loadedBytes: number;
  totalBytes: number;
}

export interface PdfDocumentLoadOptions {
  onProgress?: (progress: PdfDocumentLoadProgress) => void;
  signal?: AbortSignal;
}

export interface PdfDocumentLoader {
  load(sourceUrl: string, options?: PdfDocumentLoadOptions): Promise<LoadedPdfDocument>;
}

interface PdfJsLoadingTask {
  destroy(): Promise<void>;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  promise: Promise<PDFDocumentProxy>;
}

type GetPdfDocument = (source: { rangeChunkSize: number; url: string }) => PdfJsLoadingTask;

const MAX_PIXEL_RATIO = 2;
const MAX_CANVAS_EDGE = 8_192;
const MAX_CANVAS_PIXELS = 16_777_216;
const DEFAULT_TARGET_WIDTH = 720;
const DEFAULT_RANGE_CHUNK_SIZE = 1_048_576;

const adaptRenderTask = (task: RenderTask, cleanup: () => void): PdfPageRenderHandle => ({
  cancel: () => task.cancel(),
  promise: task.promise.finally(cleanup),
});

const getTargetWidth = (targetWidth: number) => {
  if (Number.isFinite(targetWidth) && targetWidth > 0) {
    return targetWidth;
  }
  return DEFAULT_TARGET_WIDTH;
};

const getSafePixelRatio = (cssViewport: { height: number; width: number }, requestedPixelRatio: number) => {
  let safeRequestedRatio = 1;
  if (Number.isFinite(requestedPixelRatio) && requestedPixelRatio > 0) {
    safeRequestedRatio = requestedPixelRatio;
  }
  const edgeRatio = Math.min(MAX_CANVAS_EDGE / cssViewport.width, MAX_CANVAS_EDGE / cssViewport.height);
  const areaRatio = Math.sqrt(MAX_CANVAS_PIXELS / (cssViewport.width * cssViewport.height));
  return Math.min(safeRequestedRatio, edgeRatio, areaRatio);
};

const configureCanvas = (canvas: HTMLCanvasElement, renderViewport: { height: number; width: number }, cssViewport: { height: number; width: number }) => {
  canvas.width = Math.max(1, Math.floor(renderViewport.width));
  canvas.height = Math.max(1, Math.floor(renderViewport.height));
  canvas.style.width = `${Math.ceil(cssViewport.width)}px`;
  canvas.style.height = `${Math.ceil(cssViewport.height)}px`;
};

const createLoadedDocument = (document: PDFDocumentProxy, destroy: () => Promise<void>): LoadedPdfDocument => ({
  destroy,
  pageCount: document.numPages,
  renderPage: async (canvas, pageNumber, targetWidth) => {
    const page = await document.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const cssScale = getTargetWidth(targetWidth) / baseViewport.width;
    const cssViewport = page.getViewport({ scale: cssScale });
    const requestedPixelRatio = Math.min(globalThis.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const pixelRatio = getSafePixelRatio(cssViewport, requestedPixelRatio);
    const viewport = page.getViewport({ scale: cssScale * pixelRatio });

    configureCanvas(canvas, viewport, cssViewport);
    return adaptRenderTask(page.render({ canvas, viewport }), () => page.cleanup?.());
  },
});

export const createPdfJsDocumentLoader = (getDocument: GetPdfDocument): PdfDocumentLoader => ({
  load: async (sourceUrl, options = {}) => {
    const loadingTask = getDocument({ rangeChunkSize: DEFAULT_RANGE_CHUNK_SIZE, url: sourceUrl });
    loadingTask.onProgress = ({ loaded, total }) => options.onProgress?.({ loadedBytes: loaded, totalBytes: total });
    const abort = () => {
      loadingTask.destroy().catch(() => undefined);
    };
    if (options.signal?.aborted) {
      abort();
      throw new DOMException("PDF loading was aborted", "AbortError");
    }
    options.signal?.addEventListener("abort", abort, { once: true });
    try {
      const document = await loadingTask.promise;
      return createLoadedDocument(document, () => loadingTask.destroy());
    } finally {
      options.signal?.removeEventListener("abort", abort);
    }
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
  load: async (sourceUrl, options) => {
    const pdfJs = await loadPdfJs();
    return createPdfJsDocumentLoader(pdfJs.getDocument as unknown as GetPdfDocument).load(sourceUrl, options);
  },
};
