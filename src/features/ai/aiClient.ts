import type { AiChatMessage } from "@/features/ai/types";

export interface AiRespondInput {
  inheritedSummary?: string;
  messages: AiChatMessage[];
  prompt: string;
  threadId: string;
}

export interface AiSummarizeInput {
  messages: AiChatMessage[];
  threadId: string;
}

export interface AiClient {
  respond(input: AiRespondInput): Promise<string>;
  summarize(input: AiSummarizeInput): Promise<string>;
}

export class AiClientUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiClientUserError";
  }
}

export const fixedMathResponse = (prompt: string) =>
  `固定応答です。「${prompt}」について、例として $\\int_0^1 x^2 dx = 1/3$ のように計算できます。`;

export const createFixedAiClient = (): AiClient => ({
  respond: ({ prompt }) => Promise.resolve(fixedMathResponse(prompt)),
  summarize: ({ messages }) => {
    const source = messages
      .filter((message) => message.role === "user")
      .map((message) => message.text)
      .join(" / ");
    return Promise.resolve(`前のチャットの要約: ${source || "会話はありません。"}`);
  },
});
