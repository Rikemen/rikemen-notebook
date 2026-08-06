/* eslint-disable max-params */
import { collection, deleteDoc, doc, getDocs, setDoc, type Firestore } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref as storageReference, uploadBytes, type FirebaseStorage } from "firebase/storage";
import type { AuthUser } from "@/features/auth/types";
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";
import type { WhiteboardPage } from "@/features/whiteboard/whiteboardPages";
import type { WhiteboardRepository } from "@/features/whiteboard/whiteboardRepository";
import {
  whiteboardDrawingPath,
  whiteboardDrawingsCollectionPath,
  whiteboardDrawingStoragePath,
  whiteboardPagePath,
  whiteboardPagesCollectionPath,
} from "@/features/user-data/userDataPaths";
import { db, storage } from "@/utils/firebase";

const isString = (value: unknown): value is string => typeof value === "string";
const parsePage = (id: string, uid: string, noteId: string, value: Record<string, unknown>): WhiteboardPage | null => {
  if (
    value.ownerUid !== uid ||
    value.noteId !== noteId ||
    !isString(value.title) ||
    !isString(value.markdown) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt) ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 0
  )
    return null;
  return {
    createdAt: value.createdAt,
    id,
    markdown: value.markdown,
    noteId,
    revision: value.revision,
    title: value.title,
    updatedAt: value.updatedAt,
  };
};

const dataUrlToBlob = (dataUrl: string) => {
  const [header = "", encoded = ""] = dataUrl.split(",", 2);
  const mime = /^data:(?<mime>[^;]+);base64$/u.exec(header)?.groups?.mime ?? "image/png";
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mime });
};

export class FirestoreWhiteboardRepository implements WhiteboardRepository {
  constructor(
    private readonly firestore: Firestore = db,
    private readonly fileStorage: FirebaseStorage = storage,
  ) {}

  async listPages(uid: string, noteId: string) {
    const snapshot = await getDocs(collection(this.firestore, whiteboardPagesCollectionPath({ noteId, uid })));
    return snapshot.docs
      .map((item) => parsePage(item.id, uid, noteId, item.data()))
      .filter((item): item is WhiteboardPage => item !== null)
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  async savePage(user: AuthUser, page: WhiteboardPage) {
    await setDoc(doc(this.firestore, whiteboardPagePath({ childId: page.id, noteId: page.noteId, uid: user.uid })), {
      createdAt: page.createdAt,
      markdown: page.markdown,
      noteId: page.noteId,
      ownerUid: user.uid,
      revision: page.revision,
      title: page.title,
      updatedAt: page.updatedAt,
    });
  }

  async listDrawings(uid: string, noteId: string): Promise<WhiteboardDrawing[]> {
    const snapshot = await getDocs(collection(this.firestore, whiteboardDrawingsCollectionPath({ noteId, uid })));
    return await Promise.all(
      snapshot.docs.map(async (item) => {
        const value = item.data();
        if (!isString(value.createdAt) || !isString(value.updatedAt) || !isString(value.previewPath) || !isString(value.strokesPath)) return null;
        const previewUrl = await getDownloadURL(storageReference(this.fileStorage, value.previewPath));
        const strokesUrl = await getDownloadURL(storageReference(this.fileStorage, value.strokesPath));
        const strokesResponse = await fetch(strokesUrl);
        if (!strokesResponse.ok) return null;
        return {
          createdAt: value.createdAt,
          dataUrl: previewUrl,
          id: item.id,
          strokes: (await strokesResponse.json()) as WhiteboardDrawing["strokes"],
          updatedAt: value.updatedAt,
        };
      }),
    ).then((items) => items.filter((item): item is WhiteboardDrawing => item !== null));
  }

  async saveDrawing(user: AuthUser, noteId: string, drawing: WhiteboardDrawing) {
    const previewPath = whiteboardDrawingStoragePath({ drawingId: drawing.id, fileName: "preview.png", noteId, uid: user.uid });
    const strokesPath = whiteboardDrawingStoragePath({ drawingId: drawing.id, fileName: "strokes.json", noteId, uid: user.uid });
    await Promise.all([
      uploadBytes(storageReference(this.fileStorage, previewPath), dataUrlToBlob(drawing.dataUrl), { contentType: "image/png" }),
      uploadBytes(storageReference(this.fileStorage, strokesPath), new Blob([JSON.stringify(drawing.strokes)], { type: "application/json" }), {
        contentType: "application/json",
      }),
    ]);
    try {
      await setDoc(doc(this.firestore, whiteboardDrawingPath({ childId: drawing.id, noteId, uid: user.uid })), {
        createdAt: drawing.createdAt,
        noteId,
        ownerUid: user.uid,
        previewPath,
        strokesPath,
        updatedAt: drawing.updatedAt,
      });
    } catch (error: unknown) {
      await Promise.all([
        deleteObject(storageReference(this.fileStorage, previewPath)).catch(() => undefined),
        deleteObject(storageReference(this.fileStorage, strokesPath)).catch(() => undefined),
      ]);
      throw error;
    }
  }

  async deleteDrawing(uid: string, noteId: string, drawingId: string) {
    const previewPath = whiteboardDrawingStoragePath({ drawingId, fileName: "preview.png", noteId, uid });
    const strokesPath = whiteboardDrawingStoragePath({ drawingId, fileName: "strokes.json", noteId, uid });
    await Promise.all([
      deleteObject(storageReference(this.fileStorage, previewPath)).catch(() => undefined),
      deleteObject(storageReference(this.fileStorage, strokesPath)).catch(() => undefined),
    ]);
    await deleteDoc(doc(this.firestore, whiteboardDrawingPath({ childId: drawingId, noteId, uid })));
  }
}
