import type {
  MathChatRequest,
  OpenAiMathService,
  OpenAiResponsesPort,
} from "./types";
import {
  OPENAI_RESPOND_MAX_OUTPUT_TOKENS,
  OPENAI_SUMMARY_MAX_OUTPUT_TOKENS,
} from "./config";

const formatConversation = (request: MathChatRequest) => {
  const parts: string[] = [];
  if (request.inheritedSummary) {
    parts.push(`前スレッドの要約:\n${request.inheritedSummary}`);
  }
  if (request.messages.length > 0) {
    const history = request.messages
      .map((message) => `${message.role === "user" ? "学習者" : "AI"}: ${message.text}`)
      .join("\n");
    parts.push(`会話履歴:\n${history}`);
  }
  if (request.prompt) {
    parts.push(`今回の質問:\n${request.prompt}`);
  }
  return parts.join("\n\n");
};

const ensureResponseText = (text: string) => {
  const normalized = text.trim();
  if (!normalized) {
    throw new Error("OpenAIから空の応答が返されました。");
  }
  return normalized;
};

export const createOpenAiMathService = (
  port: OpenAiResponsesPort,
  options: { model: string },
): OpenAiMathService => ({
  respond: async (request) => {
    const text = await port.generate({
      input: formatConversation(request),
      instructions:
        "あなたは日本語で教える数学学習アシスタントです。結論だけでなく途中式と考え方を正確かつ簡潔に説明し、LaTeX形式の数式を使用してください。",
      maxOutputTokens: OPENAI_RESPOND_MAX_OUTPUT_TOKENS,
      model: options.model,
    });
    return ensureResponseText(text);
  },
  summarize: async (request) => {
    const text = await port.generate({
      input: formatConversation(request),
      instructions:
        "次の数学学習会話を後続チャットへの引き継ぎ用に、日本語で要約してください。学習目標、確認済みの内容、未解決の疑問、重要な式だけを簡潔に残してください。",
      maxOutputTokens: OPENAI_SUMMARY_MAX_OUTPUT_TOKENS,
      model: options.model,
    });
    return ensureResponseText(text);
  },
});
