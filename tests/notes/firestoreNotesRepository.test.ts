import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (__firestore: unknown, path: string) => ({ path }),
  doc: (__firestore: unknown, path: string) => ({ path }),
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  getFirestore: () => ({ name: "test-firestore" }),
  setDoc: firestoreMocks.setDoc,
}));

import { FirestoreNotesRepository } from "@/features/notes/firestoreNotesRepository";

const activeNoteData = {
  createdAt: "2026-08-07T00:00:00.000Z",
  favorite: false,
  recent: true,
  subject: "",
  tags: [],
  title: "有効なノート",
  updatedAt: "2026-08-07T00:00:00.000Z",
};

describe("FirestoreNotesRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("削除中ノートを一覧と単体取得から除外する", async () => {
    const deletingData = { ...activeNoteData, deletionStatus: "deleting" };
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        { data: () => activeNoteData, id: "active-note" },
        { data: () => deletingData, id: "deleting-note" },
      ],
    });
    firestoreMocks.getDoc.mockResolvedValue({ data: () => deletingData, exists: () => true });
    const repository = new FirestoreNotesRepository({} as never, vi.fn());

    await expect(repository.list("user-1")).resolves.toHaveLength(1);
    await expect(repository.get("user-1", "deleting-note")).resolves.toBeNull();
  });

  it("親ドキュメントを直接消さずCallableへ削除を委譲する", async () => {
    const deleteNotebook = vi.fn().mockResolvedValue({ status: "deleted" });
    const repository = new FirestoreNotesRepository({} as never, deleteNotebook);

    await repository.remove("user-1", "note-1");

    expect(deleteNotebook).toHaveBeenCalledWith("note-1");
  });
});
