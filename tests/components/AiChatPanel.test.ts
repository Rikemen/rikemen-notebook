import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import AiChatPanel from "@/components/ai/AiChatPanel.vue";
import { SIGNED_IN_DAILY_AI_LIMIT } from "@/features/auth/accessPolicy";
import type { AuthUser } from "@/features/auth/types";
import { useAiChatStore } from "@/features/ai/aiChatStore";
import { getUsageDateKey } from "@/features/ai/dailyAiQuota";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

describe("AiChatPanel", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("未ログインでは送信できず、上限表示はログインユーザーだけに出す", () => {
    const wrapper = mount(AiChatPanel, {
      props: {
        currentUser: null,
        noteId: "note-1",
      },
    });

    expect(wrapper.text()).toContain("AI機能の利用にはログインが必要です");
    expect(wrapper.text()).not.toContain("100回/日");
    expect(wrapper.get("[data-testid='ai-prompt']").attributes("disabled")).toBeDefined();
    expect(wrapper.classes()).toContain("ai-chat-panel");
    expect(wrapper.find(".ai-chat-message-list").exists()).toBe(true);
  });

  it("ログイン済みは固定応答を返す", async () => {
    const wrapper = mount(AiChatPanel, {
      props: {
        currentUser: user,
        noteId: "note-1",
      },
    });

    await wrapper.get("[data-testid='ai-prompt']").setValue("積分を説明して");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("固定応答です");
    expect(wrapper.text()).toContain("∫");
    expect(wrapper.text()).toContain("100回/日");
    expect(wrapper.find("[aria-label='新しいチャット']").exists()).toBe(true);
    expect(wrapper.find("[aria-label='チャット履歴']").exists()).toBe(true);
  });

  it("100回上限に達すると送信できない", async () => {
    const store = useAiChatStore();
    const today = getUsageDateKey(new Date());
    store.usageByUserDate[`user-1:${today}`] = {
      count: SIGNED_IN_DAILY_AI_LIMIT,
      date: today,
      uid: "user-1",
    };
    const wrapper = mount(AiChatPanel, {
      props: {
        currentUser: user,
        noteId: "note-1",
      },
    });

    await wrapper.get("[data-testid='ai-prompt']").setValue("説明して");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("100回上限");
  });

  it("同じノートで再マウントしても履歴と入力途中の文を保持する", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const first = mount(AiChatPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        currentUser: user,
        noteId: "note-persisted",
      },
    });

    await first.get("[data-testid='ai-prompt']").setValue("送信する質問");
    await first.get("form").trigger("submit");
    await flushPromises();
    await first.get("[data-testid='ai-prompt']").setValue("入力途中の質問");
    const store = useAiChatStore();
    const activeThread = store.activeThreadForNote(user.uid, "note-persisted");
    expect(store.draftForThread(user.uid, "note-persisted", activeThread?.id ?? "")).toBe("入力途中の質問");
    first.unmount();

    const restored = mount(AiChatPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        currentUser: user,
        noteId: "note-persisted",
      },
    });
    const otherNote = mount(AiChatPanel, {
      global: {
        plugins: [pinia],
      },
      props: {
        currentUser: user,
        noteId: "note-other",
      },
    });

    expect(restored.text()).toContain("送信する質問");
    expect((restored.get("[data-testid='ai-prompt']").element as HTMLInputElement).value).toBe("入力途中の質問");
    expect((otherNote.get("[data-testid='ai-prompt']").element as HTMLInputElement).value).toBe("");
  });

  it("新規チャットと履歴選択で表示スレッドを切り替える", async () => {
    const wrapper = mount(AiChatPanel, {
      props: {
        currentUser: user,
        noteId: "note-1",
      },
    });
    const store = useAiChatStore();
    const firstThreadId = store.activeThreadForNote(user.uid, "note-1")?.id;

    await wrapper.get("[aria-label='新しいチャット']").trigger("click");
    expect(store.activeThreadForNote(user.uid, "note-1")?.id).not.toBe(firstThreadId);
    await wrapper.get("[aria-label='チャット履歴']").trigger("click");
    expect(wrapper.findComponent({ name: "AiChatHistoryDialog" }).exists()).toBe(true);
  });
});
