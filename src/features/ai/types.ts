export type AiChatRole = "user" | "assistant";
export type AiChatThreadStatus = "active" | "full" | "summarizing" | "archived";

export interface AiChatMessage {
  createdAt: string;
  id: string;
  noteId: string;
  ownerUid: string;
  role: AiChatRole;
  text: string;
  threadId: string;
}

export interface AiChatThread {
  createdAt: string;
  id: string;
  inheritedSummary?: string;
  noteId: string;
  ownerUid: string;
  sourceThreadId?: string;
  status: AiChatThreadStatus;
  title: string;
  turnCount: number;
  updatedAt: string;
}
