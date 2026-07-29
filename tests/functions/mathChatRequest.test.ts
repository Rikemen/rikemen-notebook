import { describe, expect, it } from "vitest";
import {
  MathChatRequestValidationError,
  parseMathChatRequest,
} from "../../functions/src/functions/ai/mathChatRequest";

describe("mathChatRequest", () => {
  it("通常応答payloadを正規化する", () => {
    expect(
      parseMathChatRequest({
        inheritedSummary: " 前回 ",
        messages: [
          { role: "user", text: " 前の質問 " },
          { role: "assistant", text: " 前の回答 " },
        ],
        noteId: "note-1",
        operation: "respond",
        prompt: " 極限を説明して ",
        threadId: "thread-1",
      }),
    ).toEqual({
      inheritedSummary: "前回",
      messages: [
        { role: "user", text: "前の質問" },
        { role: "assistant", text: "前の回答" },
      ],
      noteId: "note-1",
      operation: "respond",
      prompt: "極限を説明して",
      threadId: "thread-1",
    });
  });

  it("uidや未知フィールドを受け取らず、過大・不正入力を拒否する", () => {
    expect(() =>
      parseMathChatRequest({
        messages: [],
        noteId: "note-1",
        operation: "respond",
        prompt: "",
        threadId: "thread-1",
        uid: "spoofed-user",
      }),
    ).toThrow(MathChatRequestValidationError);
    expect(() =>
      parseMathChatRequest({
        messages: Array.from({ length: 61 }, () => ({ role: "user", text: "x" })),
        noteId: "note-1",
        operation: "summarize",
        threadId: "thread-1",
      }),
    ).toThrow("会話履歴は60件以内");
  });

  it("要約は30ターン分だけを許可する", () => {
    const messages = Array.from({ length: 30 }, (_, index) => [
      { role: "user", text: `質問${index}` },
      { role: "assistant", text: `回答${index}` },
    ]).flat();

    expect(
      parseMathChatRequest({
        messages,
        noteId: "note-1",
        operation: "summarize",
        threadId: "thread-1",
      }).messages,
    ).toHaveLength(60);
    expect(() =>
      parseMathChatRequest({
        messages: messages.slice(0, 58),
        noteId: "note-1",
        operation: "summarize",
        threadId: "thread-1",
      }),
    ).toThrow("30ターン分");
  });
});
