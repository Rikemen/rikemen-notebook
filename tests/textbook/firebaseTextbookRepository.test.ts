import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/features/auth/types";

const firebaseMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (__firestore: unknown, path: string) => ({ path }),
  doc: (__firestore: unknown, path: string) => ({ path }),
  getDocs: firebaseMocks.getDocs,
  getFirestore: () => ({ name: "test-firestore" }),
  setDoc: firebaseMocks.setDoc,
}));

vi.mock("firebase/storage", () => ({
  connectStorageEmulator: vi.fn(),
  deleteObject: firebaseMocks.deleteObject,
  getDownloadURL: firebaseMocks.getDownloadURL,
  getStorage: () => ({ name: "test-storage" }),
  ref: (__storage: unknown, path: string) => ({ path }),
  uploadBytes: firebaseMocks.uploadBytes,
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
    firebaseMocks.uploadBytes.mockResolvedValue(undefined);
  });

  it("PDF本体とmetadataをノート配下へ保存する", async () => {
    const repository = new FirebaseTextbookRepository({} as never, {} as never);

    await repository.save(
      {
        file,
        id: "material-1",
        noteId: "note-1",
        pageCount: 2,
      },
      user,
    );

    expect(firebaseMocks.uploadBytes).toHaveBeenCalledWith(
      { path: "users/user-1/notes/note-1/materials/material-1/textbook.pdf" },
      file,
      { contentType: "application/pdf" },
    );
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
});
