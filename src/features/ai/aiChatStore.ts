/* eslint-disable init-declarations, max-lines, max-lines-per-function, max-params, max-statements, no-ternary, require-atomic-updates */
import { defineStore } from "pinia";
import { ref } from "vue";
import { canUseAi } from "@/features/auth/accessPolicy";
import type { AuthUser } from "@/features/auth/types";
import { createAiChatThread, createThreadTitle, isThreadFull } from "@/features/ai/aiChatThread";
import { InMemoryAiChatRepository, type AiChatRepository } from "@/features/ai/aiChatRepository";
import { AiClientUserError, type AiClient } from "@/features/ai/aiClient";
import { canSendAiMessage, getUsageDateKey, incrementDailyAiUsage, type DailyAiUsage } from "@/features/ai/dailyAiQuota";
import { FirestoreAiChatRepository } from "@/features/ai/firestoreAiChatRepository";
import type { AiChatMessage, AiChatThread } from "@/features/ai/types";

export type { AiChatMessage } from "@/features/ai/types";

export interface SendAiMessageInput {
  client: AiClient;
  date?: Date;
  noteId: string;
  prompt: string;
  user: AuthUser | null | undefined;
}

export interface RolloverAiThreadInput {
  client: AiClient;
  date?: Date;
  noteId: string;
  user: AuthUser;
}

const createUsageKey = (uid: string, date: Date) => `${uid}:${getUsageDateKey(date)}`;
const createUserNoteKey = (uid: string, noteId: string) => `${uid}:${noteId}`;
const createThreadKey = (uid: string, noteId: string, threadId: string) => `${createUserNoteKey(uid, noteId)}:${threadId}`;

const createDefaultRepository = (): AiChatRepository => {
  if (import.meta.env.MODE === "test") {
    return new InMemoryAiChatRepository();
  }

  return new FirestoreAiChatRepository();
};

export const useAiChatStore = defineStore("aiChat", () => {
  const threads = ref<AiChatThread[]>([]);
  const messages = ref<AiChatMessage[]>([]);
  const activeThreadIdByUserNote = ref<Record<string, string>>({});
  const draftsByThread = ref<Record<string, string>>({});
  const usageByUserDate = ref<Record<string, DailyAiUsage>>({});
  const loadedUserNotes = ref<Record<string, boolean>>({});
  const loadedMessageThreads = ref<Record<string, boolean>>({});
  const loadingByUserNote = ref<Record<string, boolean>>({});
  const errorMessage = ref("");
  let repository: AiChatRepository = createDefaultRepository();
  let idSequence = 0;

  const createId = (prefix: string, date: Date) => {
    idSequence += 1;
    return `${prefix}-${date.getTime()}-${idSequence}`;
  };

  const setRepository = (nextRepository: AiChatRepository) => {
    repository = nextRepository;
  };

  const getUsage = (user: AuthUser, date = new Date()) => {
    const key = createUsageKey(user.uid, date);
    return (
      usageByUserDate.value[key] ?? {
        count: 0,
        date: getUsageDateKey(date),
        uid: user.uid,
      }
    );
  };

  const threadsForNote = (uid: string, noteId: string) =>
    threads.value
      .filter((thread) => thread.ownerUid === uid && thread.noteId === noteId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const activeThreadForNote = (uid: string, noteId: string) => {
    const activeId = activeThreadIdByUserNote.value[createUserNoteKey(uid, noteId)];
    return threads.value.find(
      (thread) => thread.id === activeId && thread.ownerUid === uid && thread.noteId === noteId,
    );
  };

  const messagesForThread = (uid: string, noteId: string, threadId: string) =>
    messages.value
      .filter(
        (message) =>
          message.ownerUid === uid && message.noteId === noteId && message.threadId === threadId,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const createNewThread = (
    user: AuthUser,
    noteId: string,
    date = new Date(),
    inheritance: Pick<AiChatThread, "inheritedSummary" | "sourceThreadId"> = {},
  ) => {
    const createdAt = date.toISOString();
    const thread = createAiChatThread({
      createdAt,
      id: createId("thread", date),
      inheritedSummary: inheritance.inheritedSummary,
      noteId,
      ownerUid: user.uid,
      sourceThreadId: inheritance.sourceThreadId,
    });
    threads.value.push(thread);
    activeThreadIdByUserNote.value[createUserNoteKey(user.uid, noteId)] = thread.id;
    loadedMessageThreads.value[createThreadKey(user.uid, noteId, thread.id)] = true;
    return thread;
  };

  const createAndSaveNewThread = async (
    user: AuthUser,
    noteId: string,
    date = new Date(),
  ) => {
    const key = createUserNoteKey(user.uid, noteId);
    const previousActiveId = activeThreadIdByUserNote.value[key];
    const thread = createNewThread(user, noteId, date);
    try {
      await repository.saveThread(user.uid, noteId, thread);
      return thread;
    } catch {
      threads.value = threads.value.filter((candidate) => candidate.id !== thread.id);
      if (previousActiveId) {
        activeThreadIdByUserNote.value[key] = previousActiveId;
      } else {
        activeThreadIdByUserNote.value = Object.fromEntries(
          Object.entries(activeThreadIdByUserNote.value).filter(
            ([candidateKey]) => candidateKey !== key,
          ),
        );
      }
      errorMessage.value = "新しいチャットの保存に失敗しました。";
      return undefined;
    }
  };

  const ensureActiveThread = (user: AuthUser, noteId: string, date = new Date()) =>
    activeThreadForNote(user.uid, noteId) ?? createNewThread(user, noteId, date);

  const loadThreadMessages = async (user: AuthUser, noteId: string, threadId: string) => {
    const key = createThreadKey(user.uid, noteId, threadId);
    if (loadedMessageThreads.value[key]) {
      return;
    }
    const loaded = await repository.listMessages(user.uid, noteId, threadId);
    messages.value = [
      ...messages.value.filter(
        (message) =>
          !(
            message.ownerUid === user.uid &&
            message.noteId === noteId &&
            message.threadId === threadId
          ),
      ),
      ...loaded,
    ];
    loadedMessageThreads.value[key] = true;
  };

  const selectThread = async (user: AuthUser, noteId: string, threadId: string) => {
    const thread = threads.value.find(
      (candidate) =>
        candidate.id === threadId && candidate.ownerUid === user.uid && candidate.noteId === noteId,
    );
    if (!thread) {
      return false;
    }
    activeThreadIdByUserNote.value[createUserNoteKey(user.uid, noteId)] = thread.id;
    try {
      await loadThreadMessages(user, noteId, thread.id);
      return true;
    } catch {
      errorMessage.value = "チャット履歴の読み込みに失敗しました。";
      return false;
    }
  };

  const loadThreads = async (user: AuthUser, noteId: string) => {
    const key = createUserNoteKey(user.uid, noteId);
    if (loadedUserNotes.value[key] || loadingByUserNote.value[key]) {
      return;
    }
    loadingByUserNote.value[key] = true;
    errorMessage.value = "";
    try {
      const loaded = await repository.listThreads(user.uid, noteId);
      const localThreads = threadsForNote(user.uid, noteId);
      const nextThreads = loaded.length > 0 ? loaded : localThreads;
      threads.value = [
        ...threads.value.filter(
          (thread) => !(thread.ownerUid === user.uid && thread.noteId === noteId),
        ),
        ...nextThreads,
      ];
      loadedUserNotes.value[key] = true;
      const active =
        nextThreads.find(
          (thread) => thread.id === activeThreadIdByUserNote.value[key],
        ) ??
        nextThreads[0] ??
        createNewThread(user, noteId);
      activeThreadIdByUserNote.value[key] = active.id;
      await loadThreadMessages(user, noteId, active.id);
    } catch {
      errorMessage.value = "チャット履歴の読み込みに失敗しました。";
    } finally {
      loadingByUserNote.value[key] = false;
    }
  };

  const sendMessage = async ({
    client,
    date = new Date(),
    noteId,
    prompt,
    user,
  }: SendAiMessageInput) => {
    errorMessage.value = "";
    if (!canUseAi(user)) {
      errorMessage.value = "AI機能の利用にはログインが必要です。";
      return false;
    }
    const usage = getUsage(user, date);
    if (!canSendAiMessage(usage)) {
      errorMessage.value = "AIチャットの1日100回上限に達しました。";
      return false;
    }

    const thread = ensureActiveThread(user, noteId, date);
    if (thread.status !== "active" || isThreadFull(thread.turnCount)) {
      thread.status = "full";
      errorMessage.value = "このチャットは30ターン上限に達しました。";
      return false;
    }

    const history = messagesForThread(user.uid, noteId, thread.id);
    let response: string;
    try {
      response = await client.respond({
        inheritedSummary: thread.inheritedSummary,
        messages: history,
        prompt,
        threadId: thread.id,
      });
    } catch (error) {
      errorMessage.value = error instanceof AiClientUserError
        ? error.message
        : "AI応答の取得に失敗しました。";
      return false;
    }

    const createdAt = date.toISOString();
    const userMessage: AiChatMessage = {
      createdAt,
      id: createId("user", date),
      noteId,
      ownerUid: user.uid,
      role: "user",
      text: prompt,
      threadId: thread.id,
    };
    const assistantMessage: AiChatMessage = {
      createdAt: new Date(date.getTime() + 1).toISOString(),
      id: createId("assistant", date),
      noteId,
      ownerUid: user.uid,
      role: "assistant",
      text: response,
      threadId: thread.id,
    };
    const previousThread = { ...thread };
    thread.title = thread.turnCount === 0 ? createThreadTitle(prompt) : thread.title;
    thread.turnCount += 1;
    thread.updatedAt = assistantMessage.createdAt;
    thread.status = isThreadFull(thread.turnCount) ? "full" : "active";
    messages.value.push(userMessage, assistantMessage);

    try {
      await repository.saveMessage(user.uid, noteId, userMessage);
      await repository.saveMessage(user.uid, noteId, assistantMessage);
      await repository.saveThread(user.uid, noteId, thread);
    } catch {
      messages.value = messages.value.filter(
        (message) => message.id !== userMessage.id && message.id !== assistantMessage.id,
      );
      Object.assign(thread, previousThread);
      errorMessage.value = "チャット履歴の保存に失敗しました。";
      return false;
    }

    usageByUserDate.value[createUsageKey(user.uid, date)] = incrementDailyAiUsage(usage);
    return true;
  };

  const rolloverThread = async ({
    client,
    date = new Date(),
    noteId,
    user,
  }: RolloverAiThreadInput) => {
    errorMessage.value = "";
    const source = activeThreadForNote(user.uid, noteId);
    if (!source || source.status !== "full") {
      errorMessage.value = "30ターンに達したチャットだけを引き継げます。";
      return false;
    }
    const usage = getUsage(user, date);
    if (!canSendAiMessage(usage)) {
      errorMessage.value = "AIチャットの1日100回上限に達しました。";
      return false;
    }

    source.status = "summarizing";
    try {
      const summary = await client.summarize({
        messages: messagesForThread(user.uid, noteId, source.id),
        threadId: source.id,
      });
      source.status = "archived";
      source.updatedAt = date.toISOString();
      const successor = createNewThread(user, noteId, new Date(date.getTime() + 1), {
        inheritedSummary: summary,
        sourceThreadId: source.id,
      });
      await repository.saveRollover(user.uid, noteId, { source, successor });
      usageByUserDate.value[createUsageKey(user.uid, date)] = incrementDailyAiUsage(usage);
      return true;
    } catch (error) {
      source.status = "full";
      errorMessage.value = error instanceof AiClientUserError
        ? error.message
        : "会話の要約に失敗しました。もう一度お試しください。";
      return false;
    }
  };

  const draftForThread = (uid: string, noteId: string, threadId: string) =>
    draftsByThread.value[createThreadKey(uid, noteId, threadId)] ?? "";
  const setDraft = (uid: string, noteId: string, threadId: string, draft: string) => {
    draftsByThread.value[createThreadKey(uid, noteId, threadId)] = draft;
  };
  const clearDraft = (uid: string, noteId: string, threadId: string) => {
    draftsByThread.value[createThreadKey(uid, noteId, threadId)] = "";
  };

  return {
    activeThreadForNote,
    activeThreadIdByUserNote,
    clearDraft,
    createAndSaveNewThread,
    createNewThread,
    draftForThread,
    draftsByThread,
    ensureActiveThread,
    errorMessage,
    getUsage,
    loadThreads,
    loadingByUserNote,
    messages,
    messagesForThread,
    rolloverThread,
    selectThread,
    sendMessage,
    setDraft,
    setRepository,
    threads,
    threadsForNote,
    usageByUserDate,
  };
});
