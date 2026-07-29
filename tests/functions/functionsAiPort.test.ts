import { describe, expect, it, vi } from "vitest";
import { createOpenAiMathService } from "../../functions/src/functions/ai/openAiMathService";
import { createOpenAiResponsesPortFromClient } from "../../functions/src/functions/ai/openAiResponsesPort";

describe("functionsAiPort", () => {
  it("OpenAI SDKを直接参照せずportへ生成要求を渡す", async () => {
    const generate = vi.fn().mockResolvedValue("説明");
    const service = createOpenAiMathService({ generate }, { model: "test-model" });

    await expect(
      service.respond({
        messages: [],
        noteId: "note-1",
        operation: "respond",
        prompt: "極限を説明して",
        threadId: "thread-1",
      }),
    ).resolves.toBe("説明");
    expect(generate).toHaveBeenCalledOnce();
    expect(generate.mock.calls[0]?.[0]).toMatchObject({
      model: "test-model",
    });
  });

  it("SDK responseのoutput_textだけをdomain文字列へ変換する", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: "  API応答  " });
    const port = createOpenAiResponsesPortFromClient({
      responses: { create },
    });

    await expect(
      port.generate({
        input: "input",
        instructions: "instructions",
        maxOutputTokens: 100,
        model: "test-model",
      }),
    ).resolves.toBe("  API応答  ");
    expect(create).toHaveBeenCalledWith({
      input: "input",
      instructions: "instructions",
      max_output_tokens: 100,
      model: "test-model",
    });
  });
});
