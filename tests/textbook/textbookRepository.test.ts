import { describe, expect, it, vi } from "vitest";
import { SIGNED_IN_UPLOAD_LIMIT_BYTES } from "@/features/auth/accessPolicy";
import type { AuthUser } from "@/features/auth/types";
import { InMemoryTextbookRepository, createBookmarkSaveTarget, createTextbookSaveTarget } from "@/features/textbook/textbookRepository";

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
        noteId: "note-1",
        pageCount: 12,
        sizeBytes: 1024,
      },
      user,
    );

    expect(target.metadataPath).toBe("users/user-1/notes/note-1/materials/textbook-1");
    expect(target.storagePath).toBe("users/user-1/notes/note-1/materials/textbook-1/textbook.pdf");
    expect(target.metadata.ownerUid).toBe("user-1");
    expect(target.metadata.noteId).toBe("note-1");
    if (target.metadata.kind !== "pdf") throw new Error("PDF metadata was expected");
    expect(target.metadata.pageCount).toBe(12);
  });

  it("未ログイン保存と5GB超過を拒否する", () => {
    const input = {
      contentType: "application/pdf",
      fileName: "textbook.pdf",
      id: "textbook-1",
      noteId: "note-1",
      pageCount: 1,
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
    const file = new File(["pdf"], "textbook.pdf", { type: "application/pdf" });
    await repository.save(
      {
        file,
        id: "textbook-1",
        noteId: "note-1",
        pageCount: 4,
      },
      user,
    );

    await expect(repository.list("user-1", "note-1")).resolves.toHaveLength(1);
    await expect(repository.list("user-1", "note-2")).resolves.toHaveLength(0);
    await expect(repository.list("other-user", "note-1")).resolves.toHaveLength(0);
  });

  it("画像とブックマークの保存先を種別付きで作る", () => {
    const image = createTextbookSaveTarget(
      {
        contentType: "image/png",
        fileName: "graph.png",
        id: "image-1",
        kind: "image",
        noteId: "note-1",
        sizeBytes: 2048,
      },
      user,
    );
    const bookmark = createBookmarkSaveTarget(
      {
        id: "bookmark-1",
        kind: "bookmark",
        noteId: "note-1",
        title: "Example",
        url: "https://example.com/",
      },
      user,
    );

    expect(image.metadata).toMatchObject({ kind: "image", contentType: "image/png" });
    expect(bookmark.metadata).toMatchObject({ kind: "bookmark", title: "Example" });
  });

  it("ブックマークはファイルなしで一覧へ保存する", async () => {
    const repository = new InMemoryTextbookRepository();
    await repository.save(
      {
        id: "bookmark-1",
        kind: "bookmark",
        noteId: "note-1",
        title: "Example",
        url: "https://example.com/",
      },
      user,
    );

    await expect(repository.list(user.uid, "note-1")).resolves.toContainEqual(expect.objectContaining({ id: "bookmark-1", kind: "bookmark" }));
  });

  it("repository境界でも危険なブックマークURLを拒否する", () => {
    expect(() =>
      createBookmarkSaveTarget(
        {
          id: "bookmark-danger",
          kind: "bookmark",
          noteId: "note-1",
          title: "危険",
          url: "javascript:alert(1)",
        },
        user,
      ),
    ).toThrow("httpまたはhttps");
  });

  it("ファイル保存の完了進捗と表示URLを返す", async () => {
    const repository = new InMemoryTextbookRepository();
    const onProgress = vi.fn();
    const file = new File(["pdf"], "textbook.pdf", { type: "application/pdf" });

    const saved = await repository.save(
      { file, id: "material-progress", noteId: "note-1", pageCount: 2 },
      user,
      { onProgress },
    );

    expect(onProgress).toHaveBeenCalledWith({ bytesTransferred: file.size, ratio: 1, totalBytes: file.size });
    expect(saved).toMatchObject({ kind: "pdf", sourceUrl: expect.stringContaining("material-progress") });
  });

  it("保存済みファイルのdisplayNameだけを変更する", async () => {
    const repository = new InMemoryTextbookRepository();
    const file = new File(["pdf"], "original.pdf", { type: "application/pdf" });
    await repository.save({ file, id: "rename-1", noteId: "note-1", pageCount: 2 }, user);

    await repository.rename(
      { displayName: "  解析学.pdf  ", id: "rename-1", noteId: "note-1" },
      user,
    );

    await expect(repository.list(user.uid, "note-1")).resolves.toContainEqual(
      expect.objectContaining({ displayName: "解析学.pdf", fileName: "original.pdf" }),
    );
  });

  it("ブックマークのrenameと中断済み保存を拒否する", async () => {
    const repository = new InMemoryTextbookRepository();
    await repository.save({ id: "bookmark-rename", kind: "bookmark", noteId: "note-1", title: "Example", url: "https://example.com" }, user);

    await expect(repository.rename({ displayName: "変更", id: "bookmark-rename", noteId: "note-1" }, user)).rejects.toThrow();
    const controller = new AbortController();
    controller.abort();
    await expect(
      repository.save(
        { file: new File(["pdf"], "cancel.pdf", { type: "application/pdf" }), id: "cancel", noteId: "note-1", pageCount: 1 },
        user,
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
