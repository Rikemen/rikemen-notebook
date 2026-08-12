export type PdfLoadStatus = "error" | "idle" | "loading" | "ready";

export interface PdfLoadProgress {
  loadedBytes: number;
  ratio: number | null;
  totalBytes: number | null;
}

export interface PdfLoadState {
  progress: PdfLoadProgress | null;
  status: PdfLoadStatus;
}

export const initialPdfLoadState = (): PdfLoadState => ({ progress: null, status: "idle" });

export const createPdfLoadProgress = (loadedBytes: number, totalBytes: number): PdfLoadProgress => {
  const safeLoadedBytes = Math.max(0, loadedBytes);
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    return { loadedBytes: safeLoadedBytes, ratio: null, totalBytes: null };
  }
  return {
    loadedBytes: safeLoadedBytes,
    ratio: Math.min(safeLoadedBytes / totalBytes, 1),
    totalBytes,
  };
};
