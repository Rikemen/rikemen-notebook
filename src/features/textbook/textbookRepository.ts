/* eslint-disable no-ternary, sonarjs/redundant-type-aliases */
import type { AuthUser } from "@/features/auth/types";
import { canUploadFile, SIGNED_IN_UPLOAD_LIMIT_BYTES } from "@/features/auth/accessPolicy";
import { validateBookmark } from "@/features/textbook/bookmarkMaterial";
import { validateMaterialDisplayName } from "@/features/textbook/materialDisplayName";
import { noteMaterialDocumentPath, noteMaterialStoragePath } from "@/features/user-data/userDataPaths";

interface MaterialMetadataBase {
  createdAt: string;
  id: string;
  noteId: string;
  ownerUid: string;
}

interface FileMaterialMetadataBase extends MaterialMetadataBase {
  displayName?: string;
  fileName: string;
  sizeBytes: number;
  storagePath: string;
}

export interface PdfMaterialMetadata extends FileMaterialMetadataBase {
  contentType: "application/pdf";
  kind: "pdf";
  pageCount: number;
}

export interface ImageMaterialMetadata extends FileMaterialMetadataBase {
  contentType: "image/jpeg" | "image/png";
  kind: "image";
}

export type FileMaterialMetadata = ImageMaterialMetadata | PdfMaterialMetadata;

export interface BookmarkMaterialMetadata extends MaterialMetadataBase {
  kind: "bookmark";
  title: string;
  url: string;
}

export type TextbookMetadata = BookmarkMaterialMetadata | FileMaterialMetadata;

export type SavedMaterial =
  | BookmarkMaterialMetadata
  | (FileMaterialMetadata & {
      sourceUrl: string;
    });
export type SavedTextbook = SavedMaterial;

export interface MaterialFileSaveInput {
  file: File;
  id: string;
  kind?: "image" | "pdf";
  noteId: string;
  pageCount?: number;
}

export interface MaterialBookmarkSaveInput {
  id: string;
  kind: "bookmark";
  noteId: string;
  title: string;
  url: string;
}

export type TextbookSaveInput = MaterialBookmarkSaveInput | MaterialFileSaveInput;

export interface MaterialUploadProgress {
  bytesTransferred: number;
  ratio: number;
  totalBytes: number;
}

export interface TextbookSaveOptions {
  onProgress?: (progress: MaterialUploadProgress) => void;
  signal?: AbortSignal;
}

export interface MaterialRenameInput {
  displayName: string;
  id: string;
  noteId: string;
}

export interface TextbookSaveTarget {
  metadata: FileMaterialMetadata;
  metadataPath: string;
  storagePath: string;
}

export interface TextbookRepository {
  list(uid: string, noteId: string): Promise<SavedMaterial[]>;
  rename(input: MaterialRenameInput, user: AuthUser | null | undefined): Promise<void>;
  save(input: TextbookSaveInput, user: AuthUser | null | undefined, options?: TextbookSaveOptions): Promise<SavedMaterial>;
}

const abortError = () => new DOMException("Material upload was aborted", "AbortError");

const requireUser = (user: AuthUser | null | undefined): AuthUser => {
  if (!user) throw new Error("login is required to save textbook history");
  return user;
};

const fileKind = (input: MaterialFileSaveInput): "image" | "pdf" => input.kind ?? "pdf";

const validateMaterialUploadMetadata = (
  input: {
    contentType: string;
    kind: "image" | "pdf";
    noteId: string;
    pageCount?: number;
    sizeBytes: number;
  },
  user: AuthUser,
) => {
  if (!canUploadFile(input.sizeBytes, user) || input.sizeBytes > SIGNED_IN_UPLOAD_LIMIT_BYTES) {
    throw new Error("textbook file is too large");
  }
  const allowed = input.kind === "pdf" ? input.contentType === "application/pdf" : input.contentType === "image/png" || input.contentType === "image/jpeg";
  if (!allowed) throw new Error("material content type is invalid");
  if (!input.noteId.trim()) throw new Error("note id is required");
  if (input.kind === "pdf" && (!Number.isInteger(input.pageCount) || (input.pageCount ?? 0) < 1)) {
    throw new Error("textbook page count is invalid");
  }
};

export const createTextbookSaveTarget = (
  input: {
    contentType: string;
    fileName: string;
    id: string;
    kind?: "image" | "pdf";
    noteId: string;
    pageCount?: number;
    sizeBytes: number;
  },
  user: AuthUser | null | undefined,
): TextbookSaveTarget => {
  const owner = requireUser(user);
  const kind = input.kind ?? "pdf";
  validateMaterialUploadMetadata(
    {
      contentType: input.contentType,
      kind,
      noteId: input.noteId,
      pageCount: input.pageCount,
      sizeBytes: input.sizeBytes,
    },
    owner,
  );
  const storagePath = noteMaterialStoragePath({
    fileName: input.fileName,
    materialId: input.id,
    noteId: input.noteId,
    uid: owner.uid,
  });
  return {
    metadata: {
      contentType: input.contentType,
      createdAt: new Date().toISOString(),
      fileName: input.fileName,
      id: input.id,
      kind,
      noteId: input.noteId,
      ownerUid: owner.uid,
      ...(kind === "pdf" ? { pageCount: input.pageCount } : {}),
      sizeBytes: input.sizeBytes,
      storagePath,
    } as FileMaterialMetadata,
    metadataPath: noteMaterialDocumentPath({ childId: input.id, noteId: input.noteId, uid: owner.uid }),
    storagePath,
  };
};

export const createBookmarkSaveTarget = (input: MaterialBookmarkSaveInput, user: AuthUser | null | undefined) => {
  const owner = requireUser(user);
  if (!input.noteId.trim()) throw new Error("note id is required");
  const validation = validateBookmark(input.title, input.url);
  if (!validation.ok) throw new Error(validation.message);
  return {
    metadata: {
      createdAt: new Date().toISOString(),
      id: input.id,
      kind: "bookmark" as const,
      noteId: input.noteId,
      ownerUid: owner.uid,
      title: validation.title,
      url: validation.url,
    },
    metadataPath: noteMaterialDocumentPath({ childId: input.id, noteId: input.noteId, uid: owner.uid }),
  };
};

export class InMemoryTextbookRepository implements TextbookRepository {
  private readonly metadata = new Map<string, TextbookMetadata>();

  save(input: TextbookSaveInput, user: AuthUser | null | undefined, options: TextbookSaveOptions = {}): Promise<SavedMaterial> {
    if (options.signal?.aborted) return Promise.reject(abortError());
    if (input.kind === "bookmark") {
      const target = createBookmarkSaveTarget(input, user);
      this.metadata.set(target.metadataPath, target.metadata);
      return Promise.resolve(target.metadata);
    }
    const target = createTextbookSaveTarget(
      {
        contentType: input.file.type,
        fileName: input.file.name,
        id: input.id,
        kind: fileKind(input),
        noteId: input.noteId,
        pageCount: input.pageCount,
        sizeBytes: input.file.size,
      },
      user,
    );
    this.metadata.set(target.metadataPath, target.metadata);
    options.onProgress?.({ bytesTransferred: input.file.size, ratio: 1, totalBytes: input.file.size });
    return Promise.resolve({ ...target.metadata, sourceUrl: target.storagePath });
  }

  rename(input: MaterialRenameInput, user: AuthUser | null | undefined): Promise<void> {
    const owner = requireUser(user);
    const validation = validateMaterialDisplayName(input.displayName);
    if (!validation.ok) return Promise.reject(new Error(validation.message));
    const metadataPath = noteMaterialDocumentPath({ childId: input.id, noteId: input.noteId, uid: owner.uid });
    const material = this.metadata.get(metadataPath);
    if (!material || material.kind === "bookmark" || material.ownerUid !== owner.uid || material.noteId !== input.noteId) {
      return Promise.reject(new Error("material cannot be renamed"));
    }
    this.metadata.set(metadataPath, { ...material, displayName: validation.displayName });
    return Promise.resolve();
  }

  list(uid: string, noteId: string): Promise<SavedMaterial[]> {
    return Promise.resolve(
      [...this.metadata.values()]
        .filter((material) => material.ownerUid === uid && material.noteId === noteId)
        .map((material) => (material.kind === "bookmark" ? material : { ...material, sourceUrl: material.storagePath })),
    );
  }
}
