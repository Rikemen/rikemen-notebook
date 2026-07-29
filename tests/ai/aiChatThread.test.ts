import { describe, expect, it } from "vitest";
import {
  AI_CHAT_THREAD_TURN_LIMIT,
  createAiChatThread,
  createThreadTitle,
  isThreadFull,
} from "@/features/ai/aiChatThread";

describe("aiChatThread", () => {
  it("所有者・ノート・引き継ぎ情報を持つ新規スレッドを作る", () => {
    expect(
      createAiChatThread({
        createdAt: "2026-07-29T00:00:00.000Z",
        id: "thread-1",
        inheritedSummary: "前の会話の要約",
        noteId: "note-1",
        ownerUid: "user-1",
        sourceThreadId: "thread-0",
      }),
    ).toMatchObject({
      id: "thread-1",
      inheritedSummary: "前の会話の要約",
      noteId: "note-1",
      ownerUid: "user-1",
      sourceThreadId: "thread-0",
      status: "active",
      title: "新しいチャット",
      turnCount: 0,
    });
  });

  it("最初の発言から読みやすいタイトルを作る", () => {
    expect(createThreadTitle("  極限について\n詳しく説明して  ")).toBe("極限について 詳しく説明して");
    expect(createThreadTitle("")).toBe("新しいチャット");
    expect(createThreadTitle("あ".repeat(80)).length).toBeLessThanOrEqual(33);
  });

  it("30ターンを上限として判定する", () => {
    expect(AI_CHAT_THREAD_TURN_LIMIT).toBe(30);
    expect(isThreadFull(29)).toBe(false);
    expect(isThreadFull(30)).toBe(true);
  });
});
