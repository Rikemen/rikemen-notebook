import type { SavedTextbook } from "@/features/textbook/textbookRepository";
import type { AuthUser } from "@/features/auth/types";

export type MaterialStatus = "error" | "saved" | "saving" | "temporary";

export interface MaterialListItem {
  id: string;
  pageCount: number;
  sizeLabel: string;
  sourceUrl?: string;
  status?: MaterialStatus;
  storagePath?: string;
  title: string;
  uploadedAt: string;
}

export type PdfFileValidationResult =
  | { ok: true }
  | {
      message: string;
      ok: false;
    };

export const validatePdfFile = (file: File, limitBytes: number): PdfFileValidationResult => {
  if (file.size <= 0) {
    return {
      message: "空のPDFは選択できません。",
      ok: false,
    };
  }

  if (file.type !== "application/pdf") {
    return {
      message: "PDF形式のファイルを選択してください。",
      ok: false,
    };
  }

  if (file.size > limitBytes) {
    return {
      message: "file-too-large",
      ok: false,
    };
  }

  return { ok: true };
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

export const formatMaterialSize = (bytes: number) => {
  const megabytes = bytes / (1024 * 1024);
  return `${Math.max(megabytes, 0.01).toFixed(1)} MB`;
};

export const materialStatusLabel = (status: MaterialStatus | undefined) => {
  const labels: Record<MaterialStatus, string> = {
    error: "保存失敗",
    saved: "保存済み",
    saving: "保存中",
    temporary: "一時利用",
  };
  if (!status) {
    return "";
  }
  return labels[status];
};

export const materialUploadStatus = (user: AuthUser | null): MaterialStatus => {
  if (user) {
    return "saving";
  }
  return "temporary";
};

interface CreateMaterialOptions {
  pageCount?: number;
  sourceUrl?: string;
  status?: MaterialStatus;
  uploadedAt?: Date;
}

export const createMaterialFromFile = (
  file: File,
  id: string,
  options: CreateMaterialOptions = {},
): MaterialListItem => ({
  id,
  pageCount: options.pageCount ?? 1,
  sizeLabel: formatMaterialSize(file.size),
  sourceUrl: options.sourceUrl,
  status: options.status,
  title: file.name,
  uploadedAt: formatDate(options.uploadedAt ?? new Date()),
});

export const createMaterialFromSavedTextbook = (textbook: SavedTextbook): MaterialListItem => ({
  id: textbook.id,
  pageCount: textbook.pageCount,
  sizeLabel: formatMaterialSize(textbook.sizeBytes),
  sourceUrl: textbook.sourceUrl,
  status: "saved",
  storagePath: textbook.storagePath,
  title: textbook.fileName,
  uploadedAt: formatDate(new Date(textbook.createdAt)),
});
