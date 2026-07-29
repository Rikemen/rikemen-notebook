import type { AiChatMessage, AiChatThread } from "@/features/ai/types";

export interface AiChatRepository {
  listMessages(uid: string, noteId: string, threadId: string): Promise<AiChatMessage[]>;
  listThreads(uid: string, noteId: string): Promise<AiChatThread[]>;
  saveMessage(uid: string, noteId: string, message: AiChatMessage): Promise<void>;
  saveRollover(
    uid: string,
    noteId: string,
    rollover: { source: AiChatThread; successor: AiChatThread },
  ): Promise<void>;
  saveThread(uid: string, noteId: string, thread: AiChatThread): Promise<void>;
}

const assertOwnership = (uid: string, noteId: string, value: AiChatThread | AiChatMessage) => {
  if (value.ownerUid !== uid) {
    throw new Error("chat owner does not match uid");
  }
  if (value.noteId !== noteId) {
    throw new Error("chat note does not match noteId");
  }
};

const copyThread = (thread: AiChatThread): AiChatThread => ({ ...thread });
const copyMessage = (message: AiChatMessage): AiChatMessage => ({ ...message });
const createThreadStorageKey = (uid: string, noteId: string, threadId: string) =>
  `${uid}:${noteId}:${threadId}`;
const createMessageStorageKey = (uid: string, noteId: string, message: AiChatMessage) =>
  `${createThreadStorageKey(uid, noteId, message.threadId)}:${message.id}`;

export class InMemoryAiChatRepository implements AiChatRepository {
  private readonly messages = new Map<string, AiChatMessage>();
  private readonly threads = new Map<string, AiChatThread>();

  listMessages(uid: string, noteId: string, threadId: string) {
    return Promise.resolve(
      [...this.messages.values()]
        .filter((message) => message.ownerUid === uid && message.noteId === noteId && message.threadId === threadId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map(copyMessage),
    );
  }

  listThreads(uid: string, noteId: string) {
    return Promise.resolve(
      [...this.threads.values()]
        .filter((thread) => thread.ownerUid === uid && thread.noteId === noteId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(copyThread),
    );
  }

  saveMessage(uid: string, noteId: string, message: AiChatMessage) {
    try {
      assertOwnership(uid, noteId, message);
      this.messages.set(createMessageStorageKey(uid, noteId, message), copyMessage(message));
      return Promise.resolve();
    } catch (error: unknown) {
      return Promise.reject(error);
    }
  }

  saveThread(uid: string, noteId: string, thread: AiChatThread) {
    try {
      assertOwnership(uid, noteId, thread);
      this.threads.set(createThreadStorageKey(uid, noteId, thread.id), copyThread(thread));
      return Promise.resolve();
    } catch (error: unknown) {
      return Promise.reject(error);
    }
  }

  async saveRollover(
    uid: string,
    noteId: string,
    { source, successor }: { source: AiChatThread; successor: AiChatThread },
  ) {
    assertOwnership(uid, noteId, source);
    assertOwnership(uid, noteId, successor);
    await this.saveThread(uid, noteId, source);
    await this.saveThread(uid, noteId, successor);
  }
}
