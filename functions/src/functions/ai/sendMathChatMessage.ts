import { HttpsError } from "firebase-functions/v2/https";
import {
  MathChatRequestValidationError,
  parseMathChatRequest,
} from "./mathChatRequest";
import type { NoteOwnershipService } from "./noteOwnership";
import {
  AiQuotaExceededError,
  type ServerAiQuotaService,
} from "./serverAiQuota";
import type { OpenAiMathService } from "./types";

interface MathChatCallableRequest {
  auth?: {
    uid: string;
  };
  data: unknown;
}

interface SendMathChatMessageDependencies {
  aiService: OpenAiMathService;
  noteOwnership: NoteOwnershipService;
  onAiError?: (error: unknown) => void;
  quota: ServerAiQuotaService;
}

const parseRequestOrThrow = (data: unknown) => {
  try {
    return parseMathChatRequest(data);
  } catch (error) {
    if (error instanceof MathChatRequestValidationError) {
      throw new HttpsError("invalid-argument", error.message);
    }
    throw error;
  }
};

export const createSendMathChatMessageHandler = (
  dependencies: SendMathChatMessageDependencies,
) => async (callableRequest: MathChatCallableRequest) => {
  const uid = callableRequest.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "AI機能の利用にはログインが必要です。");
  }
  const request = parseRequestOrThrow(callableRequest.data);
  let ownsNote = false;
  try {
    ownsNote = await dependencies.noteOwnership.noteExists(uid, request.noteId);
  } catch {
    throw new HttpsError("internal", "ノートの所有権を確認できませんでした。");
  }
  if (!ownsNote) {
    throw new HttpsError("permission-denied", "このノートではAI機能を利用できません。");
  }
  try {
    await dependencies.quota.reserve(uid);
  } catch (error) {
    if (error instanceof AiQuotaExceededError) {
      throw new HttpsError("resource-exhausted", error.message);
    }
    throw new HttpsError("internal", "AI利用回数の確認に失敗しました。");
  }

  try {
    const text = request.operation === "respond"
      ? await dependencies.aiService.respond(request)
      : await dependencies.aiService.summarize(request);
    return { text };
  } catch (error) {
    dependencies.onAiError?.(error);
    throw new HttpsError("internal", "AIから応答を取得できませんでした。時間をおいて再試行してください。");
  }
};
