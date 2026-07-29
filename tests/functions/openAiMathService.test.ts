import { describe, expect, it, vi } from "vitest";
import { createOpenAiMathService } from "../../functions/src/functions/ai/openAiMathService";

const request = {
  messages: [
    { role: "user" as const, text: "f(x)=x^2について" },
    { role: "assistant" as const, text: "どの点を説明しますか。" },
  ],
  noteId: "note-1",
  operation: "respond" as const,
  prompt: "微分を説明して",
  threadId: "thread-1",
};

describe("openAiMathService", () => {
  it("通常応答に数学学習向け指示・履歴・要約を含める", async () => {
    const generate = vi.fn().mockResolvedValue("2xです");
    const service = createOpenAiMathService({ generate }, { model: "test-model" });

    await service.respond({
      ...request,
      inheritedSummary: "前回は関数を確認した",
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("微分を説明して"),
        instructions: expect.stringContaining("数学"),
        maxOutputTokens: 1600,
        model: "test-model",
      }),
    );
    expect(generate.mock.calls[0]?.[0].input).toContain("前回は関数を確認した");
  });

  it("会話要約は引き継ぎ情報だけを簡潔に生成する", async () => {
    const generate = vi.fn().mockResolvedValue("要約");
    const service = createOpenAiMathService({ generate }, { model: "test-model" });

    await expect(
      service.summarize({
        ...request,
        operation: "summarize",
        prompt: undefined,
      }),
    ).resolves.toBe("要約");
    expect(generate.mock.calls[0]?.[0]).toMatchObject({
      maxOutputTokens: 800,
    });
    expect(generate.mock.calls[0]?.[0].instructions).toContain("引き継ぎ");
  });

  it("空のOpenAI応答を失敗として扱う", async () => {
    const service = createOpenAiMathService(
      { generate: vi.fn().mockResolvedValue(" ") },
      { model: "test-model" },
    );

    await expect(service.respond(request)).rejects.toThrow("空");
  });
});
