import { describe, expect, it, vi } from "vitest";
import { SIGNED_IN_UPLOAD_LIMIT_BYTES } from "@/features/auth/accessPolicy";
import type { AuthUser } from "@/features/auth/types";
import { InMemoryTextbookRepository, createTextbookSaveTarget } from "@/features/textbook/textbookRepository";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

describe("textbookRepository", () => {
  it("ログインユーザーの教材保存先を作る", () => {
    vi.setSystemTime(new Date("2026-07-28T00:00:00.000Z"));
    const target = createTextbookSaveTarget(
      {
        contentType: "application/pdf",
        fileName: "textbook.pdf",
        id: "textbook-1",
        sizeBytes: 1024,
      },
      user,
    );

    expect(target.metadataPath).toBe("users/user-1/textbooks/textbook-1");
    expect(target.storagePath).toBe("users/user-1/textbooks/textbook-1/textbook.pdf");
    expect(target.metadata.ownerUid).toBe("user-1");
  });

  it("未ログイン保存と5GB超過を拒否する", () => {
    const input = {
      contentType: "application/pdf",
      fileName: "textbook.pdf",
      id: "textbook-1",
      sizeBytes: 1024,
    };

    expect(() => createTextbookSaveTarget(input, null)).toThrow("login is required");
    expect(() =>
      createTextbookSaveTarget(
        {
          ...input,
          sizeBytes: SIGNED_IN_UPLOAD_LIMIT_BYTES + 1,
        },
        user,
      ),
    ).toThrow("textbook file is too large");
  });

  it("uid ごとに教材メタデータを一覧取得する", async () => {
    const repository = new InMemoryTextbookRepository();
    await repository.save(
      {
        contentType: "application/pdf",
        fileName: "textbook.pdf",
        id: "textbook-1",
        sizeBytes: 1024,
      },
      user,
    );

    await expect(repository.list("user-1")).resolves.toHaveLength(1);
    await expect(repository.list("other-user")).resolves.toHaveLength(0);
  });
});

