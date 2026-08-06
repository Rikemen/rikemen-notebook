/* eslint-disable class-methods-use-this, max-classes-per-file, no-ternary */
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";
import type { WhiteboardState } from "@/features/whiteboard/whiteboardPages";

export interface WhiteboardDraft {
  drawings: WhiteboardDrawing[];
  noteId: string;
  pageState: WhiteboardState;
  revision: number;
  updatedAt: string;
}

export interface WhiteboardDraftStorage {
  get(ownerKey: string, noteId: string): Promise<WhiteboardDraft | null>;
  remove(ownerKey: string, noteId: string): Promise<void>;
  save(ownerKey: string, draft: WhiteboardDraft): Promise<void>;
}

const databaseName = "gauss-notebook-drafts";
const storeName = "whiteboards";
const draftKey = (ownerKey: string, noteId: string) => `${ownerKey}:${noteId}`;

const cloneDraft = (draft: WhiteboardDraft): WhiteboardDraft => JSON.parse(JSON.stringify(draft)) as WhiteboardDraft;

export class InMemoryWhiteboardDraftStorage implements WhiteboardDraftStorage {
  private readonly drafts = new Map<string, WhiteboardDraft>();
  get(ownerKey: string, noteId: string) {
    const draft = this.drafts.get(draftKey(ownerKey, noteId));
    return Promise.resolve(draft ? cloneDraft(draft) : null);
  }
  remove(ownerKey: string, noteId: string) {
    this.drafts.delete(draftKey(ownerKey, noteId));
    return Promise.resolve();
  }
  save(ownerKey: string, draft: WhiteboardDraft) {
    this.drafts.set(draftKey(ownerKey, draft.noteId), cloneDraft(draft));
    return Promise.resolve();
  }
}

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export class IndexedDbWhiteboardDraftStorage implements WhiteboardDraftStorage {
  async get(ownerKey: string, noteId: string): Promise<WhiteboardDraft | null> {
    const database = await openDatabase();
    if (!database) return null;
    return await new Promise((resolve, reject) => {
      const request = database.transaction(storeName).objectStore(storeName).get(draftKey(ownerKey, noteId));
      request.onsuccess = () => resolve((request.result as WhiteboardDraft | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  }
  async remove(ownerKey: string, noteId: string): Promise<void> {
    const database = await openDatabase();
    if (!database) return;
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).delete(draftKey(ownerKey, noteId));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async save(ownerKey: string, draft: WhiteboardDraft): Promise<void> {
    const database = await openDatabase();
    if (!database) return;
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).put(cloneDraft(draft), draftKey(ownerKey, draft.noteId));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
