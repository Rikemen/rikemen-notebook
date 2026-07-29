import { describe, expect, it } from "vitest";
import rules from "../../firestore.rules?raw";

describe("firestoreRules", () => {
  it("ユーザー別パスを request.auth.uid で保護する", () => {
    expect(rules).toContain("match /users/{userId}");
    expect(rules).toContain("request.auth.uid == userId");
  });

  it("旧来の公開 message/test ルールを残さない", () => {
    expect(rules).not.toContain("match /message/{messageId}");
    expect(rules).not.toContain("allow read, create;");
    expect(rules).not.toContain("match /test/{testId}");
  });

  it("ノート作成と更新に型とフィールド制限を持つ", () => {
    expect(rules).toContain("hasAllowedNoteFields");
    expect(rules).toContain("hasValidNoteShape");
    expect(rules).toContain("request.resource.data.title is string");
    expect(rules).toContain("request.resource.data.tags.size() <= 20");
    expect(rules).toContain("request.resource.data.createdAt is string");
  });

  it("AI利用回数はクライアントから読み書きできない", () => {
    expect(rules).toContain("match /aiUsage/{date}");
    expect(rules).toContain("allow read, write: if false");
  });

  it("チャット履歴は所有者・ノート・threadとサイズを検証する", () => {
    expect(rules).toContain("hasValidChatThread(userId, noteId)");
    expect(rules).toContain("hasValidChatMessage(userId, noteId, threadId)");
    expect(rules).toContain("data.ownerUid == userId");
    expect(rules).toContain("data.noteId == noteId");
    expect(rules).toContain("data.threadId == threadId");
    expect(rules).toContain("data.turnCount <= 30");
    expect(rules).toContain("data.text.size() <= 4000");
  });

  it("ノート配下を再帰wildcardで一括許可しない", () => {
    expect(rules).not.toContain("match /{document=**} {\n          allow read, write: if ownsUserPath(userId)");
  });
});
