import { collection, doc, getDocs, setDoc, type Firestore } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageReference,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import type { AuthUser } from "@/features/auth/types";
import {
  createTextbookSaveTarget,
  type SavedTextbook,
  type TextbookMetadata,
  type TextbookRepository,
  type TextbookSaveInput,
} from "@/features/textbook/textbookRepository";
import { noteMaterialsCollectionPath } from "@/features/user-data/userDataPaths";
import { db, storage } from "@/utils/firebase";

const isString = (value: unknown): value is string => typeof value === "string";
const PDF_CONTENT_TYPE = "application/pdf";

interface MetadataReadContext {
  id: string,
  value: Record<string, unknown>,
  uid: string,
  noteId: string,
}

const parseTextbookMetadata = ({
  id,
  noteId,
  uid,
  value,
}: MetadataReadContext): TextbookMetadata | null => {
  if (
    value.ownerUid !== uid ||
    value.noteId !== noteId ||
    value.contentType !== PDF_CONTENT_TYPE ||
    !isString(value.createdAt) ||
    !isString(value.fileName) ||
    !isString(value.storagePath) ||
    typeof value.pageCount !== "number" ||
    !Number.isInteger(value.pageCount) ||
    value.pageCount < 1 ||
    typeof value.sizeBytes !== "number" ||
    value.sizeBytes < 1
  ) {
    return null;
  }

  return {
    contentType: PDF_CONTENT_TYPE,
    createdAt: value.createdAt,
    fileName: value.fileName,
    id,
    noteId,
    ownerUid: uid,
    pageCount: value.pageCount,
    sizeBytes: value.sizeBytes,
    storagePath: value.storagePath,
  };
};

const createMetadataPayload = (metadata: TextbookMetadata) => ({
  contentType: metadata.contentType,
  createdAt: metadata.createdAt,
  fileName: metadata.fileName,
  noteId: metadata.noteId,
  ownerUid: metadata.ownerUid,
  pageCount: metadata.pageCount,
  sizeBytes: metadata.sizeBytes,
  storagePath: metadata.storagePath,
});

export class FirebaseTextbookRepository implements TextbookRepository {
  constructor(
    private readonly firestore: Firestore = db,
    private readonly fileStorage: FirebaseStorage = storage,
  ) {}

  async list(uid: string, noteId: string): Promise<SavedTextbook[]> {
    const snapshot = await getDocs(collection(this.firestore, noteMaterialsCollectionPath({ noteId, uid })));
    const metadata = snapshot.docs
      .map((documentSnapshot) => parseTextbookMetadata({
        id: documentSnapshot.id,
        noteId,
        uid,
        value: documentSnapshot.data(),
      }))
      .filter((item): item is TextbookMetadata => item !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return await Promise.all(
      metadata.map(async (item) => ({
        ...item,
        sourceUrl: await getDownloadURL(storageReference(this.fileStorage, item.storagePath)),
      })),
    );
  }

  async save(input: TextbookSaveInput, user: AuthUser | null | undefined): Promise<TextbookMetadata> {
    const target = createTextbookSaveTarget(
      {
        contentType: input.file.type,
        fileName: input.file.name,
        id: input.id,
        noteId: input.noteId,
        pageCount: input.pageCount,
        sizeBytes: input.file.size,
      },
      user,
    );
    const fileReference = storageReference(this.fileStorage, target.storagePath);
    await uploadBytes(fileReference, input.file, { contentType: PDF_CONTENT_TYPE });

    try {
      await setDoc(doc(this.firestore, target.metadataPath), createMetadataPayload(target.metadata));
    } catch (error: unknown) {
      await deleteObject(fileReference).catch(() => undefined);
      throw error;
    }

    return target.metadata;
  }
}
