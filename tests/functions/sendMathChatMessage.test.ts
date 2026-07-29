import { describe, expect, it, vi } from "vitest";
import { createSendMathChatMessageHandler } from "../../functions/src/functions/ai/sendMathChatMessage";
import { AiQuotaExceededError } from "../../functions/src/functions/ai/serverAiQuota";

const payload = {
  messages: [],
  noteId: "note-1",
  operation: "respond",
  prompt: "説明して",
  threadId: "thread-1",
};

const createDependencies = () => ({
  aiService: {
    respond: vi.fn().mockResolvedValue("回答"),
    summarize: vi.fn().mockResolvedValue("要約"),
  },
  noteOwnership: {
    noteExists: vi.fn().mockResolvedValue(true),
  },
  quota: {
    reserve: vi.fn().mockResolvedValue(1),
  },
});

describe("sendMathChatMessage", () => {
  it("未認証では所有権・quota・OpenAIを呼ばない", async () => {
    const dependencies = createDependencies();
    const handler = createSendMathChatMessageHandler(dependencies);

    await expect(handler({ auth: undefined, data: payload })).rejects.toMatchObject({
      code: "unauthenticated",
    });
    expect(dependencies.noteOwnership.noteExists).not.toHaveBeenCalled();
    expect(dependencies.quota.reserve).not.toHaveBeenCalled();
    expect(dependencies.aiService.respond).not.toHaveBeenCalled();
  });

  it("本人のノートだけでquota予約後に通常応答を返す", async () => {
    const dependencies = createDependencies();
    const handler = createSendMathChatMessageHandler(dependencies);

    await expect(handler({ auth: { uid: "user-1" }, data: payload })).resolves.toEqual({
      text: "回答",
    });
    expect(dependencies.noteOwnership.noteExists).toHaveBeenCalledWith("user-1", "note-1");
    expect(dependencies.quota.reserve).toHaveBeenCalledWith("user-1");
    expect(dependencies.aiService.respond).toHaveBeenCalledWith(
      expect.not.objectContaining({ uid: expect.anything() }),
    );
  });

  it("他人または存在しないノートではOpenAIを呼ばない", async () => {
    const dependencies = createDependencies();
    dependencies.noteOwnership.noteExists.mockResolvedValue(false);
    const handler = createSendMathChatMessageHandler(dependencies);

    await expect(handler({ auth: { uid: "user-1" }, data: payload })).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(dependencies.quota.reserve).not.toHaveBeenCalled();
    expect(dependencies.aiService.respond).not.toHaveBeenCalled();
  });

  it("quota超過をresource-exhaustedへ変換する", async () => {
    const dependencies = createDependencies();
    dependencies.quota.reserve.mockRejectedValue(
      new AiQuotaExceededError(),
    );
    const handler = createSendMathChatMessageHandler(dependencies);

    await expect(handler({ auth: { uid: "user-1" }, data: payload })).rejects.toMatchObject({
      code: "resource-exhausted",
    });
    expect(dependencies.aiService.respond).not.toHaveBeenCalled();
  });

  it("provider errorへ質問本文や秘密情報を含めない", async () => {
    const dependencies = createDependencies();
    dependencies.aiService.respond.mockRejectedValue(
      new Error("sk-secret prompt=説明して"),
    );
    const handler = createSendMathChatMessageHandler(dependencies);

    const error = await handler({
      auth: { uid: "user-1" },
      data: payload,
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "internal" });
    expect(String((error as Error).message)).not.toContain("sk-secret");
    expect(String((error as Error).message)).not.toContain("説明して");
  });
});
