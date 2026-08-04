import type { AuthUser } from "@/features/auth/types";
import { canUploadFile, SIGNED_IN_UPLOAD_LIMIT_BYTES } from "@/features/auth/accessPolicy";
import { noteMaterialDocumentPath, noteMaterialStoragePath } from "@/features/user-data/userDataPaths";

export interface TextbookMetadata {
  id: string;
  ownerUid: string;
  fileName: string;
  noteId: string;
  pageCount: number;
  sizeBytes: number;
  storagePath: string;
  contentType: string;
  createdAt: string;
}

export interface TextbookUploadInput {
  id: string;
  fileName: string;
  noteId: string;
  pageCount: number;
  sizeBytes: number;
  contentType: string;
}

export interface TextbookSaveTarget {
  metadataPath: string;
  storagePath: string;
  metadata: TextbookMetadata;
}

export interface TextbookSaveInput {
  file: File;
  id: string;
  noteId: string;
  pageCount: number;
}

export interface SavedTextbook extends TextbookMetadata {
  sourceUrl: string;
}

export interface TextbookRepository {
  list(uid: string, noteId: string): Promise<SavedTextbook[]>;
  save(input: TextbookSaveInput, user: AuthUser | null | undefined): Promise<TextbookMetadata>;
}

const requireUser = (user: AuthUser | null | undefined): AuthUser => {
  if (!user) {
    throw new Error("login is required to save textbook history");
  }
  return user;
};

const validateTextbookUpload = (input: TextbookUploadInput, user: AuthUser) => {
  if (!canUploadFile(input.sizeBytes, user) || input.sizeBytes > SIGNED_IN_UPLOAD_LIMIT_BYTES) {
    throw new Error("textbook file is too large");
  }
  if (input.contentType !== "application/pdf") {
    throw new Error("textbook must be a PDF");
  }
  if (!input.noteId.trim()) {
    throw new Error("note id is required");
  }
  if (!Number.isInteger(input.pageCount) || input.pageCount < 1) {
    throw new Error("textbook page count is invalid");
  }
};

export const createTextbookSaveTarget = (input: TextbookUploadInput, user: AuthUser | null | undefined): TextbookSaveTarget => {
  const owner = requireUser(user);
  validateTextbookUpload(input, owner);

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
      noteId: input.noteId,
      ownerUid: owner.uid,
      pageCount: input.pageCount,
      sizeBytes: input.sizeBytes,
      storagePath,
    },
    metadataPath: noteMaterialDocumentPath({
      childId: input.id,
      noteId: input.noteId,
      uid: owner.uid,
    }),
    storagePath,
  };
};

export class InMemoryTextbookRepository implements TextbookRepository {
  private readonly metadata = new Map<string, TextbookMetadata>();

  save(input: TextbookSaveInput, user: AuthUser | null | undefined) {
    const target = createTextbookSaveTarget({
      contentType: input.file.type,
      fileName: input.file.name,
      id: input.id,
      noteId: input.noteId,
      pageCount: input.pageCount,
      sizeBytes: input.file.size,
    }, user);
    this.metadata.set(target.metadataPath, target.metadata);
    return Promise.resolve(target.metadata);
  }

  list(uid: string, noteId: string) {
    return Promise.resolve(
      [...this.metadata.values()]
        .filter((textbook) => textbook.ownerUid === uid && textbook.noteId === noteId)
        .map((textbook) => ({
          ...textbook,
          sourceUrl: textbook.storagePath,
        })),
    );
  }
}
