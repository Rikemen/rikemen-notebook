import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AiChatMessage from "@/components/ai/AiChatMessage.vue";
import WhiteboardMathObject from "@/components/whiteboard/WhiteboardMathObject.vue";

describe("mathIntegration", () => {
  it("AI応答とホワイトボードで同じMathRenderer入口を使う", () => {
    const aiMessage = mount(AiChatMessage, {
      props: {
        message: {
          createdAt: "2026-07-28T00:00:00.000Z",
          id: "message-1",
          noteId: "note-1",
          ownerUid: "user-1",
          role: "assistant",
          text: "計算結果は $x^2$ です。",
          threadId: "thread-1",
        },
      },
    });
    const whiteboardObject = mount(WhiteboardMathObject, {
      props: {
        expression: "x^2",
        label: "放物線",
      },
    });

    expect(aiMessage.findComponent({ name: "MathRenderer" }).exists()).toBe(true);
    expect(whiteboardObject.findComponent({ name: "MathRenderer" }).exists()).toBe(true);
  });
});
