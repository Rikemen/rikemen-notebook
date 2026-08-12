export const LARGE_PDF_SIZE_THRESHOLD_BYTES = 100 * 1024 * 1024;
export const LARGE_PDF_PAGE_THRESHOLD = 500;

export const largePdfNotice = (sizeBytes: number, pageCount: number) => {
  if (sizeBytes < LARGE_PDF_SIZE_THRESHOLD_BYTES && pageCount < LARGE_PDF_PAGE_THRESHOLD) return "";
  return "大きなPDFです。アップロードや初回表示に時間がかかる場合があります。進捗を確認しながらお待ちください。";
};
