import type { AiChatThread } from "@/features/ai/types";

export const AI_CHAT_THREAD_TURN_LIMIT = 30;
const THREAD_TITLE_LIMIT = 32;

export interface CreateAiChatThreadInput {
  createdAt: string;
  id: string;
  inheritedSummary?: string;
  noteId: string;
  ownerUid: string;
  sourceThreadId?: string;
}

export const createThreadTitle = (prompt: string) => {
  const normalized = prompt.replace(/\s+/gu, " ").trim();
  if (!normalized) {
    return "新しいチャット";
  }

  if (normalized.length <= THREAD_TITLE_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, THREAD_TITLE_LIMIT)}…`;
};

export const isThreadFull = (turnCount: number) => turnCount >= AI_CHAT_THREAD_TURN_LIMIT;

export const createAiChatThread = ({
  createdAt,
  id,
  inheritedSummary,
  noteId,
  ownerUid,
  sourceThreadId,
}: CreateAiChatThreadInput): AiChatThread => {
  const thread: AiChatThread = {
    createdAt,
    id,
    noteId,
    ownerUid,
    status: "active",
    title: "新しいチャット",
    turnCount: 0,
    updatedAt: createdAt,
  };
  if (inheritedSummary) {
    thread.inheritedSummary = inheritedSummary;
  }
  if (sourceThreadId) {
    thread.sourceThreadId = sourceThreadId;
  }
  return thread;
};
