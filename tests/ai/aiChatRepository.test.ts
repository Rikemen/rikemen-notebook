import { describe, expect, it } from "vitest";
import { createAiChatThread } from "@/features/ai/aiChatThread";
import { InMemoryAiChatRepository } from "@/features/ai/aiChatRepository";
import type { AiChatMessage } from "@/features/ai/types";

const createMessage = (ownerUid: string, noteId: string, threadId: string, id: string): AiChatMessage => ({
  createdAt: "2026-07-29T00:00:00.000Z",
  id,
  noteId,
  ownerUid,
  role: "user",
  text: "質問",
  threadId,
});

describe("aiChatRepository", () => {
  it("uid・noteId・threadIdごとに履歴を分離する", async () => {
    const repository = new InMemoryAiChatRepository();
    const thread = createAiChatThread({
      createdAt: "2026-07-29T00:00:00.000Z",
      id: "thread-1",
      noteId: "note-1",
      ownerUid: "user-1",
    });
    await repository.saveThread("user-1", "note-1", thread);
    await repository.saveMessage("user-1", "note-1", createMessage("user-1", "note-1", "thread-1", "message-1"));

    await expect(repository.listThreads("user-1", "note-1")).resolves.toHaveLength(1);
    await expect(repository.listThreads("user-2", "note-1")).resolves.toHaveLength(0);
    await expect(repository.listMessages("user-1", "note-1", "thread-1")).resolves.toHaveLength(1);
  });

  it("所有者が一致しない保存を拒否する", async () => {
    const repository = new InMemoryAiChatRepository();
    const thread = createAiChatThread({
      createdAt: "2026-07-29T00:00:00.000Z",
      id: "thread-1",
      noteId: "note-1",
      ownerUid: "user-1",
    });

    await expect(repository.saveThread("user-2", "note-1", thread)).rejects.toThrow("chat owner does not match uid");
  });

  it("rolloverで元スレッドと後続スレッドを同時に保存する", async () => {
    const repository = new InMemoryAiChatRepository();
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
      inheritedSummary: "要約",
      noteId: "note-1",
      ownerUid: "user-1",
      sourceThreadId: "thread-1",
    });

    await repository.saveRollover("user-1", "note-1", { source, successor });

    await expect(repository.listThreads("user-1", "note-1")).resolves.toEqual([successor, source]);
  });
});
