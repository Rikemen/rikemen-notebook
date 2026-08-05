import { onBeforeUnmount, ref, shallowRef } from "vue";
import type { LoadedPdfDocument, PdfDocumentLoader } from "@/features/textbook/pdfDocument";

/* eslint-disable max-statements */

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
  let loadRequestId = 0;

  const loadPdfDocument = async (sourceUrl: string) => {
    loadRequestId += 1;
    const requestId = loadRequestId;

    try {
      const nextDocument = await getLoader().load(sourceUrl);
      if (requestId !== loadRequestId) {
        safelyDestroy(nextDocument).catch(() => undefined);
        return null;
      }

      safelyDestroy(pdfDocument.value).catch(() => undefined);
      pdfDocument.value = nextDocument;
      pdfDocumentSource.value = sourceUrl;
      return nextDocument;
    } catch {
      return null;
    }
  };

  onBeforeUnmount(() => {
    loadRequestId += 1;
    safelyDestroy(pdfDocument.value).catch(() => undefined);
    pdfDocument.value = null;
  });

  return {
    loadPdfDocument,
    pdfDocument,
    pdfDocumentSource,
  };
};
