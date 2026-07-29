import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAiChatThread } from "@/features/ai/aiChatThread";
import type { AiChatMessage } from "@/features/ai/types";

const firestoreMocks = vi.hoisted(() => ({
  batchCommit: vi.fn(),
  batchSet: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (__firestore: unknown, path: string) => ({ path }),
  doc: (__firestore: unknown, path: string) => ({ path }),
  getDocs: firestoreMocks.getDocs,
  getFirestore: () => ({ name: "test-firestore" }),
  orderBy: (field: string, direction: string) => ({ direction, field }),
  query: (reference: unknown, ...constraints: unknown[]) => ({ constraints, reference }),
  setDoc: firestoreMocks.setDoc,
  writeBatch: () => ({
    commit: firestoreMocks.batchCommit,
    set: firestoreMocks.batchSet,
  }),
}));

import { FirestoreAiChatRepository } from "@/features/ai/firestoreAiChatRepository";

describe("firestoreAiChatRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    firestoreMocks.batchCommit.mockResolvedValue(undefined);
  });

  it("本人のノート配下から更新日時順でスレッドを読む", async () => {
    const repository = new FirestoreAiChatRepository({} as never);

    await repository.listThreads("user-1", "note-1");

    expect(firestoreMocks.getDocs).toHaveBeenCalledWith({
      constraints: [{ direction: "desc", field: "updatedAt" }],
      reference: { path: "users/user-1/notes/note-1/chatThreads" },
    });
  });

  it("スレッドとメッセージを本人のpathへ保存する", async () => {
    const repository = new FirestoreAiChatRepository({} as never);
    const thread = createAiChatThread({
      createdAt: "2026-07-29T00:00:00.000Z",
      id: "thread-1",
      noteId: "note-1",
      ownerUid: "user-1",
    });
    const message: AiChatMessage = {
      createdAt: "2026-07-29T00:00:00.000Z",
      id: "message-1",
      noteId: "note-1",
      ownerUid: "user-1",
      role: "user",
      text: "質問",
      threadId: "thread-1",
    };

    await repository.saveThread("user-1", "note-1", thread);
    await repository.saveMessage("user-1", "note-1", message);

    expect(firestoreMocks.setDoc.mock.calls[0]?.[0]).toEqual({
      path: "users/user-1/notes/note-1/chatThreads/thread-1",
    });
    expect(firestoreMocks.setDoc.mock.calls[1]?.[0]).toEqual({
      path: "users/user-1/notes/note-1/chatThreads/thread-1/messages/message-1",
    });
  });

  it("rolloverをbatchへまとめる", async () => {
    const repository = new FirestoreAiChatRepository({} as never);
    const source = {
      ...createAiChatThread({
        createdAt: "2026-07-29T00:00:00.000Z",
        id: "thread-1",
        noteId: "note-1",
        ownerUid: "user-1",
      }),
      status: "archived" as const,
    };
    const successor = createAiChatThread({
      createdAt: "2026-07-29T01:00:00.000Z",
      id: "thread-2",
      noteId: "note-1",
      ownerUid: "user-1",
    });

    await repository.saveRollover("user-1", "note-1", { source, successor });

    expect(firestoreMocks.batchSet).toHaveBeenCalledTimes(2);
    expect(firestoreMocks.batchCommit).toHaveBeenCalledOnce();
  });
});
