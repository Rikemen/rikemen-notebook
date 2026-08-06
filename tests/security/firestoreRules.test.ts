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

  it("教材metadataを所有者・ノート・厳格なschemaで保護する", () => {
    expect(rules).toContain("match /materials/{materialId}");
    expect(rules).toContain("hasValidMaterial(userId, noteId, materialId)");
    expect(rules).toContain("data.keys().hasOnly([");
    expect(rules).toContain('data.contentType == "application/pdf"');
    expect(rules).toContain("data.ownerUid == userId");
    expect(rules).toContain("data.noteId == noteId");
    expect(rules).toContain("data.fileName.size() <= 240");
    expect(rules).toContain("data.pageCount <= 100000");
    expect(rules).toContain("data.sizeBytes <= 5368709120");
    expect(rules).toContain("hasUnchangedMaterialIdentity()");
  });

  it("教材作成と読込には親ノートの存在を要求する", () => {
    expect(rules).toContain("function noteExists(userId, noteId)");
    expect(rules).toContain("noteExists(userId, noteId)");
  });

  it("画像・ブックマークを種別別の厳格schemaで検証する", () => {
    expect(rules).toContain('data.kind in ["pdf", "image"]');
    expect(rules).toContain('data.contentType in ["image/jpeg", "image/png"]');
    expect(rules).toContain("hasValidBookmarkMaterial(userId, noteId)");
    expect(rules).toContain('data.kind == "bookmark"');
    expect(rules).toContain("data.url.size() <= 2048");
    expect(rules).toContain('data.url.matches("^https?://');
  });

  it("ホワイトボードpageとdrawingを所有者・親note・サイズで検証する", () => {
    expect(rules).toContain("hasValidWhiteboardPage(userId, noteId)");
    expect(rules).toContain("data.markdown.size() <= 200000");
    expect(rules).toContain("hasValidWhiteboardDrawing(userId, noteId, drawingId)");
    expect(rules).toContain("/whiteboardDrawings/{drawingId}");
    expect(rules).toContain("noteExists(userId, noteId)");
    expect(rules).toContain("hasUnchangedWhiteboardPageIdentity()");
    expect(rules).toContain("hasUnchangedWhiteboardDrawingIdentity()");
  });
});
