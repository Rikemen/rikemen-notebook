import { AiClientUserError, type AiClient } from "@/features/ai/aiClient";

export interface FunctionsOpenAiClientOptions {
  noteId: string;
}

export type MathChatOperation = "respond" | "summarize";

export interface MathChatPayload {
  inheritedSummary?: string;
  messages: Array<{
    role: "user" | "assistant";
    text: string;
  }>;
  noteId: string;
  operation: MathChatOperation;
  prompt?: string;
  threadId: string;
}

export type CallMathChatFunction = (payload: MathChatPayload) => Promise<{ text: string }>;

export const OPEN_AI_MATH_CHAT_FUNCTION_NAME = "sendMathChatMessage";

const callableErrorMessages: Record<string, string> = {
  "functions/invalid-argument": "送信内容を確認してください。",
  "functions/permission-denied": "このノートではAI機能を利用できません。",
  "functions/resource-exhausted": "AIチャットの1日100回の利用上限に達しました。",
  "functions/unauthenticated": "AI機能の利用にはログインが必要です。",
};

const callWithStableError = async (
  callMathChatFunction: CallMathChatFunction,
  payload: MathChatPayload,
) => {
  try {
    return await callMathChatFunction(payload);
  } catch (error) {
    let code = "";
    if (typeof error === "object" && error !== null && "code" in error) {
      code = String(error.code);
    }
    throw new AiClientUserError(
      callableErrorMessages[code] ?? "AIから応答を取得できませんでした。時間をおいて再試行してください。",
    );
  }
};

export const createFunctionsOpenAiClient = (
  callMathChatFunction: CallMathChatFunction,
  options: FunctionsOpenAiClientOptions,
): AiClient => ({
  respond: async ({ inheritedSummary, messages, prompt, threadId }) => {
    const payload: MathChatPayload = {
      messages: messages.map(({ role, text }) => ({ role, text })),
      noteId: options.noteId,
      operation: "respond",
      prompt,
      threadId,
    };
    if (inheritedSummary) {
      payload.inheritedSummary = inheritedSummary;
    }
    const result = await callWithStableError(callMathChatFunction, payload);

    return result.text;
  },
  summarize: async ({ messages, threadId }) => {
    const result = await callWithStableError(callMathChatFunction, {
      messages: messages.map(({ role, text }) => ({ role, text })),
      noteId: options.noteId,
      operation: "summarize",
      threadId,
    });

    return result.text;
  },
});
