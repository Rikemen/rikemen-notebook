import { describe, expect, it } from "vitest";
import rules from "../../storage.rules?raw";

describe("storageRules", () => {
  it("ログイン済みユーザーの教材パスだけを本人 uid で許可する", () => {
    expect(rules).toContain("match /users/{userId}/textbooks/{textbookId}/{fileName}");
    expect(rules).toContain("request.auth.uid == userId");
  });

  it("全体パスのログイン済み全許可を残さない", () => {
    expect(rules).toContain("match /{allPaths=**}");
    expect(rules).toContain("allow read, write: if false;");
    expect(rules).not.toContain("allow read, write: if request.auth!=null");
  });

  it("PDF と 5GB 上限を強制する", () => {
    expect(rules).toContain("request.resource.size <= 5368709120");
    expect(rules).toContain('request.resource.contentType == "application/pdf"');
  });

  it("ノート別教材パスを本人だけに許可する", () => {
    expect(rules).toContain("match /users/{userId}/notes/{noteId}/materials/{materialId}/{fileName}");
    expect(rules).toContain("fileName.size() <= 240");
    expect(rules).toContain("materialId.size() <= 128");
  });
});
