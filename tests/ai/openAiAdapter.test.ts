import { describe, expect, it, vi } from "vitest";
import { createFunctionsOpenAiClient, OPEN_AI_MATH_CHAT_FUNCTION_NAME } from "@/features/ai/functionsOpenAiClient";

describe("openAiAdapter", () => {
  it("Functions clientへuidを含めず通常応答payloadを渡す", async () => {
    const callMathChat = vi.fn().mockResolvedValue({ text: "ok" });
    const client = createFunctionsOpenAiClient(callMathChat, {
      noteId: "note-1",
    });

    await expect(
      client.respond({
        inheritedSummary: "前回要約",
        messages: [],
        prompt: "説明して",
        threadId: "thread-1",
      }),
    ).resolves.toBe("ok");
    expect(callMathChat).toHaveBeenCalledWith({
      inheritedSummary: "前回要約",
      messages: [],
      noteId: "note-1",
      operation: "respond",
      prompt: "説明して",
      threadId: "thread-1",
    });
    expect(callMathChat.mock.calls[0]?.[0]).not.toHaveProperty("uid");
    expect(OPEN_AI_MATH_CHAT_FUNCTION_NAME).toBe("sendMathChatMessage");
  });

  it("要約operationと会話本文を渡す", async () => {
    const callMathChat = vi.fn().mockResolvedValue({ text: "summary" });
    const client = createFunctionsOpenAiClient(callMathChat, { noteId: "note-1" });

    await client.summarize({
      messages: [
        {
          createdAt: "2026-07-29T00:00:00.000Z",
          id: "message-1",
          noteId: "note-1",
          ownerUid: "user-1",
          role: "user",
          text: "質問",
          threadId: "thread-1",
        },
      ],
      threadId: "thread-1",
    });

    expect(callMathChat).toHaveBeenCalledWith({
      messages: [{ role: "user", text: "質問" }],
      noteId: "note-1",
      operation: "summarize",
      threadId: "thread-1",
    });
  });

  it("Callable error codeを安全な日本語へ変換する", async () => {
    const callMathChat = vi.fn().mockRejectedValue({
      code: "functions/resource-exhausted",
      message: "provider details",
    });
    const client = createFunctionsOpenAiClient(callMathChat, { noteId: "note-1" });

    await expect(
      client.respond({
        messages: [],
        prompt: "質問",
        threadId: "thread-1",
      }),
    ).rejects.toThrow("1日100回");
  });
});
