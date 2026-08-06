import { describe, expect, it } from "vitest";
import { validateBookmark, validateMaterialFile } from "@/features/textbook/materials";

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
});
