import { describe, expect, it } from "vitest";
import { createMaterialFromSavedTextbook, validateBookmark, validateMaterialFile } from "@/features/textbook/materials";

describe("materials", () => {
  it.each([
    ["document.pdf", "application/pdf", "pdf"],
    ["graph.png", "image/png", "image"],
    ["photo.jpg", "image/jpeg", "image"],
    ["photo.jpeg", "image/jpeg", "image"],
  ] as const)("%sを受け付ける", (name, contentType, kind) => {
    const file = new File(["content"], name, { type: contentType });
    expect(validateMaterialFile(file, 1024)).toEqual({ kind, ok: true });
  });

  it("MIMEと拡張子が対象外または不一致のファイルを拒否する", () => {
    expect(validateMaterialFile(new File(["x"], "image.svg", { type: "image/svg+xml" }), 1024).ok).toBe(false);
    expect(validateMaterialFile(new File(["x"], "image.png", { type: "image/jpeg" }), 1024).ok).toBe(false);
  });

  it("HTTP(S) URLを正規化し、危険なschemeと資格情報を拒否する", () => {
    expect(validateBookmark("", "https://example.com/path#section")).toEqual({
      ok: true,
      title: "example.com",
      url: "https://example.com/path#section",
    });
    expect(validateBookmark("危険", "javascript:alert(1)").ok).toBe(false);
    expect(validateBookmark("資格情報", "https://user:pass@example.com").ok).toBe(false);
  });

  it("保存済みファイルはdisplayNameを優先し元ファイル名とsizeを保持する", () => {
    expect(createMaterialFromSavedTextbook({
      contentType: "application/pdf",
      createdAt: "2026-08-08T00:00:00.000Z",
      displayName: "解析学.pdf",
      fileName: "original.pdf",
      id: "material-1",
      kind: "pdf",
      noteId: "note-1",
      ownerUid: "user-1",
      pageCount: 2,
      sizeBytes: 1024,
      sourceUrl: "https://storage.example/original.pdf",
      storagePath: "users/user-1/notes/note-1/materials/material-1/original.pdf",
    })).toMatchObject({ sizeBytes: 1024, title: "解析学.pdf" });
  });
});
