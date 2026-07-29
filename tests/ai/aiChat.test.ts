import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SIGNED_IN_DAILY_AI_LIMIT } from "@/features/auth/accessPolicy";
import type { AuthUser } from "@/features/auth/types";
import type { AiClient } from "@/features/ai/aiClient";
import { InMemoryAiChatRepository } from "@/features/ai/aiChatRepository";
import { canSendAiMessage, incrementDailyAiUsage } from "@/features/ai/dailyAiQuota";
import { useAiChatStore } from "@/features/ai/aiChatStore";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

const client: AiClient = {
  async respond({ prompt }) {
    return `回答: ${prompt}`;
  },
  async summarize({ messages }) {
    return `要約: ${messages.map((message) => message.text).join("/")}`;
  },
};

describe("aiChat", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("未ログインでは送信できない", async () => {
    const store = useAiChatStore();

    await expect(
      store.sendMessage({
        client,
        noteId: "note-1",
        prompt: "説明して",
        user: null,
      }),
    ).resolves.toBe(false);
    expect(store.errorMessage).toContain("ログインが必要");
  });

  it("ログイン済みは100回/日まで送信できる", async () => {
    const store = useAiChatStore();
    store.setRepository(new InMemoryAiChatRepository());
    const date = new Date("2026-07-28T00:00:00.000Z");

    await expect(
      store.sendMessage({
        client,
        date,
        noteId: "note-1",
        prompt: "説明して",
        user,
      }),
    ).resolves.toBe(true);
    const thread = store.activeThreadForNote("user-1", "note-1");
    expect(thread?.turnCount).toBe(1);
    expect(store.messagesForThread("user-1", "note-1", thread?.id ?? "")).toHaveLength(2);
    expect(store.getUsage(user, date).count).toBe(1);
  });

  it("同じnoteIdでもユーザーとスレッドが違えば履歴を混ぜない", async () => {
    const store = useAiChatStore();
    const otherUser = { ...user, uid: "user-2" };

    await store.sendMessage({ client, noteId: "note-1", prompt: "user 1", user });
    await store.sendMessage({ client, noteId: "note-1", prompt: "user 2", user: otherUser });

    const firstThread = store.activeThreadForNote(user.uid, "note-1");
    const secondThread = store.activeThreadForNote(otherUser.uid, "note-1");
    expect(firstThread?.id).not.toBe(secondThread?.id);
    expect(store.messagesForThread(user.uid, "note-1", firstThread?.id ?? "")[0]?.text).toBe("user 1");
    expect(store.messagesForThread(otherUser.uid, "note-1", secondThread?.id ?? "")[0]?.text).toBe("user 2");
  });

  it("新規チャットを作成し履歴から未完了スレッドを再開する", async () => {
    const store = useAiChatStore();
    const first = store.createNewThread(user, "note-1", new Date("2026-07-28T00:00:00.000Z"));
    store.setDraft(user.uid, "note-1", first.id, "first draft");
    const second = store.createNewThread(user, "note-1", new Date("2026-07-28T01:00:00.000Z"));

    expect(store.activeThreadForNote(user.uid, "note-1")?.id).toBe(second.id);
    await store.selectThread(user, "note-1", first.id);
    expect(store.activeThreadForNote(user.uid, "note-1")?.id).toBe(first.id);
    expect(store.draftForThread(user.uid, "note-1", first.id)).toBe("first draft");
  });

  it("ツールバーから作成した新規チャットをrepositoryへ保存する", async () => {
    const store = useAiChatStore();
    const repository = new InMemoryAiChatRepository();
    store.setRepository(repository);

    const thread = await store.createAndSaveNewThread(
      user,
      "note-1",
      new Date("2026-07-29T00:00:00.000Z"),
    );

    expect(thread).toBeDefined();
    await expect(repository.listThreads(user.uid, "note-1")).resolves.toEqual([thread]);
  });

  it("30回目の応答後にfullとなり31回目はclientを呼ばない", async () => {
    const store = useAiChatStore();
    const trackedClient: AiClient = {
      respond: vi.fn(client.respond),
      summarize: vi.fn(client.summarize),
    };
    const thread = store.createNewThread(user, "note-1");
    thread.turnCount = 29;

    await expect(store.sendMessage({ client: trackedClient, noteId: "note-1", prompt: "30回目", user })).resolves.toBe(true);
    expect(thread.status).toBe("full");
    await expect(store.sendMessage({ client: trackedClient, noteId: "note-1", prompt: "31回目", user })).resolves.toBe(false);
    expect(trackedClient.respond).toHaveBeenCalledTimes(1);
  });

  it("fullスレッドを要約して後続スレッドへ引き継ぐ", async () => {
    const store = useAiChatStore();
    const source = store.createNewThread(user, "note-1");
    source.status = "full";
    source.turnCount = 30;
    store.messages.push({
      createdAt: "2026-07-28T00:00:00.000Z",
      id: "message-1",
      noteId: "note-1",
      ownerUid: user.uid,
      role: "user",
      text: "極限を質問",
      threadId: source.id,
    });

    await expect(store.rolloverThread({ client, noteId: "note-1", user })).resolves.toBe(true);

    expect(source.status).toBe("archived");
    expect(store.activeThreadForNote(user.uid, "note-1")).toMatchObject({
      inheritedSummary: "要約: 極限を質問",
      sourceThreadId: source.id,
      status: "active",
    });
  });

  it("101回目は拒否する", async () => {
    const store = useAiChatStore();
    const date = new Date("2026-07-28T00:00:00.000Z");
    store.usageByUserDate["user-1:2026-07-28"] = {
      count: SIGNED_IN_DAILY_AI_LIMIT,
      date: "2026-07-28",
      uid: "user-1",
    };

    await expect(
      store.sendMessage({
        client,
        date,
        noteId: "note-1",
        prompt: "説明して",
        user,
      }),
    ).resolves.toBe(false);
    expect(store.errorMessage).toContain("100回上限");
  });

  it("quota helper が上限を判定する", () => {
    expect(
      canSendAiMessage({
        count: 99,
        date: "2026-07-28",
        uid: "user-1",
      }),
    ).toBe(true);
    expect(
      canSendAiMessage({
        count: 100,
        date: "2026-07-28",
        uid: "user-1",
      }),
    ).toBe(false);
    expect(
      incrementDailyAiUsage({
        count: 1,
        date: "2026-07-28",
        uid: "user-1",
      }).count,
    ).toBe(2);
    expect(vi.isFakeTimers()).toBe(false);
  });

  it("入力途中の文をスレッドごとに保持する", () => {
    const store = useAiChatStore();
    const first = store.createNewThread(user, "note-1");
    const second = store.createNewThread(user, "note-1");

    store.setDraft(user.uid, "note-1", first.id, "極限について質問");

    expect(store.draftForThread(user.uid, "note-1", first.id)).toBe("極限について質問");
    expect(store.draftForThread(user.uid, "note-1", second.id)).toBe("");

    store.clearDraft(user.uid, "note-1", first.id);
    expect(store.draftForThread(user.uid, "note-1", first.id)).toBe("");
  });
});
