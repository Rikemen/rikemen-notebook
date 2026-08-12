import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/features/auth/types";

const firebaseMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  uploadBytesResumable: vi.fn(),
  cancelUpload: vi.fn(),
  unsubscribeUpload: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (__firestore: unknown, path: string) => ({ path }),
  doc: (__firestore: unknown, path: string) => ({ path }),
  getDocs: firebaseMocks.getDocs,
  getFirestore: () => ({ name: "test-firestore" }),
  setDoc: firebaseMocks.setDoc,
  updateDoc: firebaseMocks.updateDoc,
}));

vi.mock("firebase/storage", () => ({
  connectStorageEmulator: vi.fn(),
  deleteObject: firebaseMocks.deleteObject,
  getDownloadURL: firebaseMocks.getDownloadURL,
  getStorage: () => ({ name: "test-storage" }),
  ref: (__storage: unknown, path: string) => ({ path }),
  uploadBytesResumable: firebaseMocks.uploadBytesResumable,
}));

import { FirebaseTextbookRepository } from "@/features/textbook/firebaseTextbookRepository";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

const file = new File(["pdf"], "textbook.pdf", { type: "application/pdf" });

describe("FirebaseTextbookRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMocks.deleteObject.mockResolvedValue(undefined);
    firebaseMocks.getDownloadURL.mockResolvedValue("https://storage.example/textbook.pdf");
    firebaseMocks.getDocs.mockResolvedValue({ docs: [] });
    firebaseMocks.setDoc.mockResolvedValue(undefined);
    firebaseMocks.updateDoc.mockResolvedValue(undefined);
    firebaseMocks.uploadBytesResumable.mockReturnValue({
      cancel: firebaseMocks.cancelUpload,
      on: (_event: string, onProgress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void, _onError: (error: unknown) => void, onComplete: () => void) => {
        onProgress({ bytesTransferred: 2, totalBytes: 3 });
        onProgress({ bytesTransferred: 3, totalBytes: 3 });
        onComplete();
        return firebaseMocks.unsubscribeUpload;
      },
    });
  });

  it("PDF本体とmetadataをノート配下へ保存する", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);

    const onProgress = vi.fn();
    const saved = await repository.save(
      {
        file,
        id: "material-1",
        noteId: "note-1",
        pageCount: 2,
      },
      user,
      { onProgress },
    );

    expect(firebaseMocks.uploadBytesResumable).toHaveBeenCalledWith({ path: "users/user-1/notes/note-1/materials/material-1/textbook.pdf" }, file, {
      contentType: "application/pdf",
    });
    expect(onProgress).toHaveBeenLastCalledWith({ bytesTransferred: 3, ratio: 1, totalBytes: 3 });
    expect(firebaseMocks.setDoc.mock.calls[0]?.[0]).toEqual({
      path: "users/user-1/notes/note-1/materials/material-1",
    });
    expect(firebaseMocks.setDoc.mock.calls[0]?.[1]).toMatchObject({
      fileName: "textbook.pdf",
      noteId: "note-1",
      ownerUid: "user-1",
      pageCount: 2,
      storagePath: "users/user-1/notes/note-1/materials/material-1/textbook.pdf",
    });
    expect(saved).toMatchObject({ sourceUrl: "https://storage.example/textbook.pdf" });
  });

  it("metadata保存失敗時は先に保存したPDFを削除する", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);
    firebaseMocks.setDoc.mockRejectedValueOnce(new Error("metadata failed"));

    await expect(
      repository.save(
        {
          file,
          id: "material-1",
          noteId: "note-1",
          pageCount: 2,
        },
        user,
      ),
    ).rejects.toThrow("metadata failed");

    expect(firebaseMocks.deleteObject).toHaveBeenCalledWith({
      path: "users/user-1/notes/note-1/materials/material-1/textbook.pdf",
    });
  });

  it("保存済みmetadataと表示URLを現在のノートから読む", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);
    firebaseMocks.getDocs.mockResolvedValueOnce({
      docs: [
        {
          data: () => ({
            contentType: "application/pdf",
            createdAt: "2026-08-01T00:00:00.000Z",
            fileName: "textbook.pdf",
            noteId: "note-1",
            ownerUid: "user-1",
            pageCount: 2,
            sizeBytes: 3,
            storagePath: "users/user-1/notes/note-1/materials/material-1/textbook.pdf",
          }),
          id: "material-1",
        },
      ],
    });

    const result = await repository.list("user-1", "note-1");

    expect(firebaseMocks.getDocs).toHaveBeenCalledWith({
      path: "users/user-1/notes/note-1/materials",
    });
    expect(firebaseMocks.getDownloadURL).toHaveBeenCalledWith({
      path: "users/user-1/notes/note-1/materials/material-1/textbook.pdf",
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: "material-1",
        sourceUrl: "https://storage.example/textbook.pdf",
      }),
    ]);
  });

  it("画像はStorageへ保存し、ブックマークはFirestoreだけへ保存する", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);
    const image = new File(["image"], "graph.png", { type: "image/png" });
    await repository.save({ file: image, id: "image-1", kind: "image", noteId: "note-1" }, user);
    expect(firebaseMocks.uploadBytesResumable).toHaveBeenCalledWith({ path: "users/user-1/notes/note-1/materials/image-1/graph.png" }, image, {
      contentType: "image/png",
    });

    firebaseMocks.uploadBytesResumable.mockClear();
    await repository.save(
      {
        id: "bookmark-1",
        kind: "bookmark",
        noteId: "note-1",
        title: "Example",
        url: "https://example.com/",
      },
      user,
    );
    expect(firebaseMocks.uploadBytesResumable).not.toHaveBeenCalled();
    expect(firebaseMocks.setDoc).toHaveBeenLastCalledWith(
      { path: "users/user-1/notes/note-1/materials/bookmark-1" },
      expect.objectContaining({ kind: "bookmark", url: "https://example.com/" }),
    );
  });

  it("AbortSignalでUploadTaskを取消する", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);
    firebaseMocks.uploadBytesResumable.mockReturnValueOnce({
      cancel: firebaseMocks.cancelUpload,
      on: () => firebaseMocks.unsubscribeUpload,
    });
    const controller = new AbortController();
    const saving = repository.save({ file, id: "cancel-1", noteId: "note-1", pageCount: 2 }, user, { signal: controller.signal });

    controller.abort();

    await expect(saving).rejects.toMatchObject({ name: "AbortError" });
    expect(firebaseMocks.cancelUpload).toHaveBeenCalledOnce();
    expect(firebaseMocks.setDoc).not.toHaveBeenCalled();
  });

  it("displayNameだけをFirestoreへ更新しStorageを変更しない", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);

    await repository.rename({ displayName: "  解析学.pdf  ", id: "material-1", noteId: "note-1" }, user);

    expect(firebaseMocks.updateDoc).toHaveBeenCalledWith(
      { path: "users/user-1/notes/note-1/materials/material-1" },
      { displayName: "解析学.pdf" },
    );
    expect(firebaseMocks.uploadBytesResumable).not.toHaveBeenCalled();
    expect(firebaseMocks.deleteObject).not.toHaveBeenCalled();
  });

  it("保存済みmetadataのdisplayNameを後方互換で読む", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);
    firebaseMocks.getDocs.mockResolvedValueOnce({
      docs: [{
        data: () => ({
          contentType: "application/pdf",
          createdAt: "2026-08-01T00:00:00.000Z",
          displayName: "解析学.pdf",
          fileName: "original.pdf",
          kind: "pdf",
          noteId: "note-1",
          ownerUid: "user-1",
          pageCount: 2,
          sizeBytes: 3,
          storagePath: "users/user-1/notes/note-1/materials/material-1/original.pdf",
        }),
        id: "material-1",
      }],
    });

    await expect(repository.list("user-1", "note-1")).resolves.toContainEqual(
      expect.objectContaining({ displayName: "解析学.pdf", fileName: "original.pdf" }),
    );
  });
});
