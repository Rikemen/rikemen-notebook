import { describe, expect, it } from "vitest";
import { createFixedAiClient } from "@/features/ai/aiClient";

describe("aiClient", () => {
  it("固定clientが通常応答と決定的な要約を返す", async () => {
    const client = createFixedAiClient();

    await expect(
      client.respond({
        messages: [],
        prompt: "積分を説明して",
        threadId: "thread-1",
      }),
    ).resolves.toContain("固定応答です");
    await expect(
      client.summarize({
        messages: [
          {
            createdAt: "2026-07-29T00:00:00.000Z",
            id: "message-1",
            noteId: "note-1",
            ownerUid: "user-1",
            role: "user",
            text: "極限とは？",
            threadId: "thread-1",
          },
        ],
        threadId: "thread-1",
      }),
    ).resolves.toContain("極限とは？");
  });
});
