import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AiChatHistoryDialog from "@/components/ai/AiChatHistoryDialog.vue";
import { createAiChatThread } from "@/features/ai/aiChatThread";

const thread = {
  ...createAiChatThread({
    createdAt: "2026-07-29T00:00:00.000Z",
    id: "thread-1",
    noteId: "note-1",
    ownerUid: "user-1",
  }),
  title: "極限の質問",
  turnCount: 4,
};

describe("AiChatHistoryDialog", () => {
  it("履歴のタイトル・更新日時・ターン数を表示して選択する", async () => {
    const wrapper = mount(AiChatHistoryDialog, {
      props: {
        activeThreadId: "thread-1",
        threads: [thread],
      },
    });

    expect(wrapper.attributes("role")).toBe("dialog");
    expect(wrapper.text()).toContain("極限の質問");
    expect(wrapper.text()).toContain("4 / 30ターン");
    expect(wrapper.get("[data-thread-id='thread-1']").attributes("aria-current")).toBe("true");

    await wrapper.get("[data-thread-id='thread-1']").trigger("click");
    expect(wrapper.emitted("select")?.[0]).toEqual(["thread-1"]);
  });

  it("Escapeと背景クリックで閉じる", async () => {
    const wrapper = mount(AiChatHistoryDialog, {
      attachTo: document.body,
      props: {
        activeThreadId: "",
        threads: [],
      },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    await wrapper.trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(2);
    wrapper.unmount();
  });
});
