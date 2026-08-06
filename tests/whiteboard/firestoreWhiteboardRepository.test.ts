import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/features/auth/types";

const firebaseMocks = vi.hoisted(() => ({
  deleteDoc: vi.fn(),
  deleteObject: vi.fn(),
  getDocs: vi.fn(),
  getDownloadURL: vi.fn(),
  setDoc: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (__firestore: unknown, path: string) => ({ path }),
  deleteDoc: firebaseMocks.deleteDoc,
  doc: (__firestore: unknown, path: string) => ({ path }),
  getDocs: firebaseMocks.getDocs,
  getFirestore: () => ({ name: "test-firestore" }),
  setDoc: firebaseMocks.setDoc,
}));

vi.mock("firebase/storage", () => ({
  deleteObject: firebaseMocks.deleteObject,
  getDownloadURL: firebaseMocks.getDownloadURL,
  getStorage: () => ({ name: "test-storage" }),
  ref: (__storage: unknown, path: string) => ({ path }),
  uploadBytes: firebaseMocks.uploadBytes,
}));

import { FirestoreWhiteboardRepository } from "@/features/whiteboard/firestoreWhiteboardRepository";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

describe("FirestoreWhiteboardRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMocks.deleteDoc.mockResolvedValue(undefined);
    firebaseMocks.deleteObject.mockResolvedValue(undefined);
    firebaseMocks.getDocs.mockResolvedValue({ docs: [] });
    firebaseMocks.setDoc.mockResolvedValue(undefined);
    firebaseMocks.uploadBytes.mockResolvedValue(undefined);
  });

  it("変更ページをノート配下の1documentへ保存する", async () => {
    const repository = new FirestoreWhiteboardRepository({} as never, {} as never);
    await repository.savePage(user, {
      createdAt: "2026-08-06T00:00:00.000Z",
      id: "page-1",
      markdown: "# 保存",
      noteId: "note-1",
      revision: 2,
      title: "ページ 1",
      updatedAt: "2026-08-06T00:01:00.000Z",
    });

    expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
      { path: "users/user-1/notes/note-1/whiteboardPages/page-1" },
      expect.objectContaining({ markdown: "# 保存", ownerUid: "user-1", revision: 2 }),
    );
  });

  it("手書きPNGとstroke JSONを固定パスへまとめて保存する", async () => {
    const repository = new FirestoreWhiteboardRepository({} as never, {} as never);
    await repository.saveDrawing(user, "note-1", {
      createdAt: "2026-08-06T00:00:00.000Z",
      dataUrl: "data:image/png;base64,cG5n",
      id: "drawing-1",
      strokes: [{ points: [{ x: 1, y: 2 }] }],
      updatedAt: "2026-08-06T00:01:00.000Z",
    });

    expect(firebaseMocks.uploadBytes).toHaveBeenCalledTimes(2);
    expect(firebaseMocks.uploadBytes.mock.calls.map((call) => call[0])).toEqual([
      { path: "users/user-1/notes/note-1/whiteboardDrawings/drawing-1/preview.png" },
      { path: "users/user-1/notes/note-1/whiteboardDrawings/drawing-1/strokes.json" },
    ]);
    expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
      { path: "users/user-1/notes/note-1/whiteboardDrawings/drawing-1" },
      expect.objectContaining({ ownerUid: "user-1" }),
    );
  });
});
