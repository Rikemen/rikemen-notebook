import type { AuthUser } from "@/features/auth/types";
import { canUploadFile, SIGNED_IN_UPLOAD_LIMIT_BYTES } from "@/features/auth/accessPolicy";
import { textbookDocumentPath, textbookStoragePath } from "@/features/user-data/userDataPaths";

export interface TextbookMetadata {
  id: string;
  ownerUid: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
  createdAt: string;
}

export interface TextbookUploadInput {
  id: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

export interface TextbookSaveTarget {
  metadataPath: string;
  storagePath: string;
  metadata: TextbookMetadata;
}

export const createTextbookSaveTarget = (input: TextbookUploadInput, user: AuthUser | null | undefined): TextbookSaveTarget => {
  if (!user) {
    throw new Error("login is required to save textbook history");
  }

  if (!canUploadFile(input.sizeBytes, user) || input.sizeBytes > SIGNED_IN_UPLOAD_LIMIT_BYTES) {
    throw new Error("textbook file is too large");
  }

  if (input.contentType !== "application/pdf") {
    throw new Error("textbook must be a PDF");
  }

  return {
    metadata: {
      contentType: input.contentType,
      createdAt: new Date().toISOString(),
      fileName: input.fileName,
      id: input.id,
      ownerUid: user.uid,
      sizeBytes: input.sizeBytes,
    },
    metadataPath: textbookDocumentPath({
      noteId: input.id,
      uid: user.uid,
    }),
    storagePath: textbookStoragePath({
      fileName: input.fileName,
      textbookId: input.id,
      uid: user.uid,
    }),
  };
};

export class InMemoryTextbookRepository {
  private readonly metadata = new Map<string, TextbookMetadata>();

  save(input: TextbookUploadInput, user: AuthUser | null | undefined) {
    const target = createTextbookSaveTarget(input, user);
    this.metadata.set(target.metadataPath, target.metadata);
    return Promise.resolve(target);
  }

  list(uid: string) {
    return Promise.resolve([...this.metadata.values()].filter((textbook) => textbook.ownerUid === uid));
  }
}
