/* eslint-disable max-statements, no-ternary, prefer-destructuring */
import { collection, doc, getDocs, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref as storageReference, uploadBytesResumable, type FirebaseStorage, type UploadTask } from "firebase/storage";
import type { AuthUser } from "@/features/auth/types";
import {
  createBookmarkSaveTarget,
  createTextbookSaveTarget,
  type BookmarkMaterialMetadata,
  type FileMaterialMetadata,
  type MaterialRenameInput,
  type SavedMaterial,
  type TextbookMetadata,
  type TextbookRepository,
  type TextbookSaveInput,
  type TextbookSaveOptions,
} from "@/features/textbook/textbookRepository";
import { validateMaterialDisplayName } from "@/features/textbook/materialDisplayName";
import { noteMaterialDocumentPath, noteMaterialsCollectionPath } from "@/features/user-data/userDataPaths";
import { db, storage } from "@/utils/firebase";

const isString = (value: unknown): value is string => typeof value === "string";
const isPositiveInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0;
const PDF_CONTENT_TYPE = "application/pdf";

const validDisplayName = (value: unknown) => value === undefined || (isString(value) && validateMaterialDisplayName(value).ok);

interface MetadataReadContext {
  id: string;
  noteId: string;
  uid: string;
  value: Record<string, unknown>;
}

const parseBookmark = ({ id, noteId, uid, value }: MetadataReadContext): BookmarkMaterialMetadata | null => {
  if (
    value.kind !== "bookmark" ||
    value.ownerUid !== uid ||
    value.noteId !== noteId ||
    !isString(value.createdAt) ||
    !isString(value.title) ||
    !isString(value.url)
  )
    return null;
  return { createdAt: value.createdAt, id, kind: "bookmark", noteId, ownerUid: uid, title: value.title, url: value.url };
};

const parseFile = ({ id, noteId, uid, value }: MetadataReadContext): FileMaterialMetadata | null => {
  const contentType = value.contentType;
  const inferredKind = value.kind ?? (contentType === PDF_CONTENT_TYPE ? "pdf" : undefined);
  const validContentType = contentType === PDF_CONTENT_TYPE || contentType === "image/jpeg" || contentType === "image/png";
  if (
    (inferredKind !== "pdf" && inferredKind !== "image") ||
    !validContentType ||
    value.ownerUid !== uid ||
    value.noteId !== noteId ||
    !isString(value.createdAt) ||
    !isString(value.fileName) ||
    !validDisplayName(value.displayName) ||
    !isString(value.storagePath) ||
    !isPositiveInteger(value.sizeBytes) ||
    (inferredKind === "pdf" && !isPositiveInteger(value.pageCount))
  )
    return null;
  const common = {
    createdAt: value.createdAt,
    ...(isString(value.displayName) ? { displayName: value.displayName } : {}),
    fileName: value.fileName,
    id,
    noteId,
    ownerUid: uid,
    sizeBytes: value.sizeBytes,
    storagePath: value.storagePath,
  };
  if (inferredKind === "pdf") {
    return {
      ...common,
      contentType: PDF_CONTENT_TYPE,
      kind: "pdf",
      pageCount: value.pageCount as number,
    };
  }
  return {
    ...common,
    contentType: contentType as "image/jpeg" | "image/png",
    kind: "image",
  };
};

const parseMaterialMetadata = (context: MetadataReadContext): TextbookMetadata | null =>
  context.value.kind === "bookmark" ? parseBookmark(context) : parseFile(context);

const createMetadataPayload = (metadata: TextbookMetadata) => {
  if (metadata.kind === "bookmark") {
    return {
      createdAt: metadata.createdAt,
      kind: metadata.kind,
      noteId: metadata.noteId,
      ownerUid: metadata.ownerUid,
      title: metadata.title,
      url: metadata.url,
    };
  }
  return {
    contentType: metadata.contentType,
    createdAt: metadata.createdAt,
    ...(metadata.displayName ? { displayName: metadata.displayName } : {}),
    fileName: metadata.fileName,
    kind: metadata.kind,
    noteId: metadata.noteId,
    ownerUid: metadata.ownerUid,
    ...(metadata.kind === "pdf" ? { pageCount: metadata.pageCount } : {}),
    sizeBytes: metadata.sizeBytes,
    storagePath: metadata.storagePath,
  };
};

const uploadAbortError = () => new DOMException("Material upload was aborted", "AbortError");

const waitForUpload = (task: UploadTask, options: TextbookSaveOptions): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe: () => void = () => undefined;
    let abort = () => undefined;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", abort);
      unsubscribe();
      callback();
    };
    abort = () => {
      task.cancel();
      finish(() => reject(uploadAbortError()));
    };
    if (options.signal?.aborted) {
      abort();
      return;
    }
    options.signal?.addEventListener("abort", abort, { once: true });
    const stopObserving = task.on(
      "state_changed",
      (snapshot) => {
        const totalBytes = snapshot.totalBytes;
        options.onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          ratio: totalBytes > 0 ? Math.min(Math.max(snapshot.bytesTransferred / totalBytes, 0), 1) : 0,
          totalBytes,
        });
      },
      (error) => finish(() => reject(error)),
      () => finish(resolve),
    );
    unsubscribe = stopObserving;
    if (settled) stopObserving();
  });

export class FirebaseTextbookRepository implements TextbookRepository {
  constructor(
    private readonly firestore: Firestore = db,
    private readonly fileStorage: FirebaseStorage = storage,
  ) {}

  async list(uid: string, noteId: string): Promise<SavedMaterial[]> {
    const snapshot = await getDocs(collection(this.firestore, noteMaterialsCollectionPath({ noteId, uid })));
    const metadata = snapshot.docs
      .map((item) => parseMaterialMetadata({ id: item.id, noteId, uid, value: item.data() }))
      .filter((item): item is TextbookMetadata => item !== null);
    return await Promise.all(
      metadata.map(async (item) => {
        if (item.kind === "bookmark") return item;
        return {
          ...item,
          sourceUrl: await getDownloadURL(storageReference(this.fileStorage, item.storagePath)),
        };
      }),
    );
  }

  async save(input: TextbookSaveInput, user: AuthUser | null | undefined, options: TextbookSaveOptions = {}): Promise<SavedMaterial> {
    if (input.kind === "bookmark") {
      const target = createBookmarkSaveTarget(input, user);
      await setDoc(doc(this.firestore, target.metadataPath), createMetadataPayload(target.metadata));
      return target.metadata;
    }

    const target = createTextbookSaveTarget(
      {
        contentType: input.file.type,
        fileName: input.file.name,
        id: input.id,
        kind: input.kind ?? "pdf",
        noteId: input.noteId,
        pageCount: input.pageCount,
        sizeBytes: input.file.size,
      },
      user,
    );
    const fileReference = storageReference(this.fileStorage, target.storagePath);
    const uploadTask = uploadBytesResumable(fileReference, input.file, { contentType: input.file.type });
    await waitForUpload(uploadTask, options);
    try {
      const sourceUrl = await getDownloadURL(fileReference);
      await setDoc(doc(this.firestore, target.metadataPath), createMetadataPayload(target.metadata));
      return { ...target.metadata, sourceUrl };
    } catch (error: unknown) {
      await deleteObject(fileReference).catch(() => undefined);
      throw error;
    }
  }

  async rename(input: MaterialRenameInput, user: AuthUser | null | undefined): Promise<void> {
    if (!user) throw new Error("login is required to rename material");
    const validation = validateMaterialDisplayName(input.displayName);
    if (!validation.ok) throw new Error(validation.message);
    const metadataPath = noteMaterialDocumentPath({ childId: input.id, noteId: input.noteId, uid: user.uid });
    await updateDoc(doc(this.firestore, metadataPath), { displayName: validation.displayName });
  }
}
