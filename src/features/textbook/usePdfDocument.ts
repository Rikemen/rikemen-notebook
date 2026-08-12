import { onBeforeUnmount, ref, shallowRef } from "vue";
import type { LoadedPdfDocument, PdfDocumentLoader } from "@/features/textbook/pdfDocument";
import { createPdfLoadProgress, initialPdfLoadState, type PdfLoadState } from "@/features/textbook/pdfLoadState";

/* eslint-disable max-lines-per-function, max-statements */

const safelyDestroy = async (document: LoadedPdfDocument | null) => {
  try {
    await document?.destroy();
  } catch {
    // A document may already be closing after a cancelled PDF.js request.
  }
};

export const usePdfDocument = (getLoader: () => PdfDocumentLoader) => {
  const pdfDocument = shallowRef<LoadedPdfDocument | null>(null);
  const pdfDocumentSource = ref("");
  const pdfLoadState = ref<PdfLoadState>(initialPdfLoadState());
  let loadRequestId = 0;
  let loadController: AbortController | null = null;

  const loadPdfDocument = async (sourceUrl: string) => {
    loadRequestId += 1;
    const requestId = loadRequestId;
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    const previousDocument = pdfDocument.value;
    pdfDocument.value = null;
    pdfDocumentSource.value = sourceUrl;
    pdfLoadState.value = { progress: null, status: "loading" };
    if (previousDocument) await safelyDestroy(previousDocument);

    try {
      const nextDocument = await getLoader().load(sourceUrl, {
        onProgress: ({ loadedBytes, totalBytes }) => {
          if (requestId !== loadRequestId) return;
          pdfLoadState.value = {
            progress: createPdfLoadProgress(loadedBytes, totalBytes),
            status: "loading",
          };
        },
        signal: controller.signal,
      });
      if (requestId !== loadRequestId) {
        safelyDestroy(nextDocument).catch(() => undefined);
        return null;
      }

      // requestId prevents a stale async load from replacing the current document.
      // eslint-disable-next-line require-atomic-updates
      pdfDocument.value = nextDocument;
      pdfLoadState.value = { ...pdfLoadState.value, status: "ready" };
      return nextDocument;
    } catch {
      if (requestId === loadRequestId && !controller.signal.aborted) {
        pdfLoadState.value = { ...pdfLoadState.value, status: "error" };
      }
      return null;
    } finally {
      if (loadController === controller) loadController = null;
    }
  };

  onBeforeUnmount(() => {
    loadRequestId += 1;
    loadController?.abort();
    loadController = null;
    safelyDestroy(pdfDocument.value).catch(() => undefined);
    pdfDocument.value = null;
    pdfDocumentSource.value = "";
    pdfLoadState.value = initialPdfLoadState();
  });

  return {
    loadPdfDocument,
    pdfDocument,
    pdfDocumentSource,
    pdfLoadState,
  };
};
