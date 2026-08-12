/* eslint-disable no-ternary */
import type { AuthUser } from "@/features/auth/types";
export { validateBookmark } from "@/features/textbook/bookmarkMaterial";
import type { SavedMaterial } from "@/features/textbook/textbookRepository";

export type MaterialKind = "bookmark" | "image" | "pdf";
export type MaterialStatus = "cancelled" | "error" | "saved" | "saving" | "temporary";

export interface MaterialListItem {
  id: string;
  kind?: MaterialKind;
  pageCount: number;
  sizeBytes?: number;
  sizeLabel: string;
  sourceUrl?: string;
  status?: MaterialStatus;
  storagePath?: string;
  title: string;
  uploadProgress?: number;
  uploadedAt: string;
  url?: string;
}

export type MaterialFileValidationResult =
  | { kind: "image" | "pdf"; ok: true }
  | {
      message: string;
      ok: false;
    };

const PDF_CONTENT_TYPE = "application/pdf";

const extensionOf = (fileName: string) => fileName.split(".").pop()?.toLowerCase() ?? "";

export const validateMaterialFile = (file: File, limitBytes: number): MaterialFileValidationResult => {
  const extension = extensionOf(file.name);
  const isPdf = file.type === PDF_CONTENT_TYPE && extension === "pdf";
  const isImage = (file.type === "image/png" && extension === "png") || (file.type === "image/jpeg" && (extension === "jpg" || extension === "jpeg"));

  if (file.size <= 0) {
    return {
      message: isPdf ? "空のPDFは選択できません。" : "空の画像は選択できません。",
      ok: false,
    };
  }

  if (!isPdf && !isImage) {
    return {
      message: "PDF形式のファイルを選択してください。画像はPNG、JPG、JPEGに対応しています。",
      ok: false,
    };
  }

  if (file.size > limitBytes) {
    return {
      message: "file-too-large",
      ok: false,
    };
  }

  return { kind: isPdf ? "pdf" : "image", ok: true };
};

export const validatePdfFile = (file: File, limitBytes: number): MaterialFileValidationResult => {
  if (file.size <= 0) {
    return { message: "空のPDFは選択できません。", ok: false };
  }
  if (file.type !== PDF_CONTENT_TYPE) {
    return { message: "PDF形式のファイルを選択してください。", ok: false };
  }
  if (file.size > limitBytes) {
    return { message: "file-too-large", ok: false };
  }
  return { kind: "pdf", ok: true };
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

export const materialStatusLabel = (status: MaterialStatus | undefined, uploadProgress?: number) => {
  const labels: Record<MaterialStatus, string> = {
    cancelled: "保存取消",
    error: "保存失敗",
    saved: "保存済み",
    saving: "保存中",
    temporary: "一時利用",
  };
  if (status === "saving" && typeof uploadProgress === "number") {
    return `${labels.saving} ${Math.round(Math.min(Math.max(uploadProgress, 0), 1) * 100)}%`;
  }
  return status ? labels[status] : "";
};

export const materialKindLabel = (kind: MaterialKind | undefined) => {
  if (kind === "bookmark") return "URL";
  if (kind === "image") return "画像";
  return "PDF";
};

export const materialUploadStatus = (user: AuthUser | null): MaterialStatus => (user ? "saving" : "temporary");

interface CreateMaterialOptions {
  kind?: "image" | "pdf";
  pageCount?: number;
  sourceUrl?: string;
  status?: MaterialStatus;
  uploadedAt?: Date;
}

export const createMaterialFromFile = (file: File, id: string, options: CreateMaterialOptions = {}): MaterialListItem => ({
  id,
  kind: options.kind ?? "pdf",
  pageCount: options.pageCount ?? 1,
  sizeBytes: file.size,
  sizeLabel: formatMaterialSize(file.size),
  sourceUrl: options.sourceUrl,
  status: options.status,
  title: file.name,
  uploadedAt: formatDate(options.uploadedAt ?? new Date()),
});

export const createMaterialFromBookmark = (params: {
  id: string;
  status: MaterialStatus;
  title: string;
  url: string;
  uploadedAt?: Date;
}): MaterialListItem => ({
  id: params.id,
  kind: "bookmark",
  pageCount: 1,
  sizeLabel: "ブックマーク",
  sourceUrl: params.url,
  status: params.status,
  title: params.title,
  uploadedAt: formatDate(params.uploadedAt ?? new Date()),
  url: params.url,
});

export const createMaterialFromSavedTextbook = (material: SavedMaterial): MaterialListItem => {
  if (material.kind === "bookmark") {
    return createMaterialFromBookmark({
      id: material.id,
      status: "saved",
      title: material.title,
      uploadedAt: new Date(material.createdAt),
      url: material.url,
    });
  }

  return {
    id: material.id,
    kind: material.kind,
    pageCount: material.kind === "pdf" ? material.pageCount : 1,
    sizeBytes: material.sizeBytes,
    sizeLabel: formatMaterialSize(material.sizeBytes),
    sourceUrl: material.sourceUrl,
    status: "saved",
    storagePath: material.storagePath,
    title: material.displayName ?? material.fileName,
    uploadedAt: formatDate(new Date(material.createdAt)),
  };
};
