import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/features/auth/types";
import { createMaterialUploadManager } from "@/features/textbook/materialUploadManager";
import type { SavedMaterial, TextbookRepository } from "@/features/textbook/textbookRepository";

const user: AuthUser = { displayName: null, email: null, photoURL: null, uid: "user-1" };
const input = {
  file: new File(["pdf"], "large.pdf", { type: "application/pdf" }),
  id: "material-1",
  kind: "pdf" as const,
  noteId: "note-1",
  pageCount: 500,
};

const saved: SavedMaterial = {
  contentType: "application/pdf",
  createdAt: "2026-08-08T00:00:00.000Z",
  fileName: "large.pdf",
  id: "material-1",
  kind: "pdf",
  noteId: "note-1",
  ownerUid: "user-1",
  pageCount: 500,
  sizeBytes: 3,
  sourceUrl: "https://storage.example/large.pdf",
  storagePath: "users/user-1/notes/note-1/materials/material-1/large.pdf",
};

const createRepository = (save: TextbookRepository["save"]): TextbookRepository => ({
  list: vi.fn(),
  rename: vi.fn(),
  save,
});

describe("materialUploadManager", () => {
  it("進捗を通知し、成功時に永続資料を渡す", async () => {
    const onProgress = vi.fn();
    const onSaved = vi.fn();
    const repository = createRepository(vi.fn(async (_input, _user, options) => {
      options?.onProgress?.({ bytesTransferred: 1, ratio: 0.5, totalBytes: 2 });
      return saved;
    }));
    const manager = createMaterialUploadManager({
      getRepository: () => repository,
      getUser: () => user,
      onFailed: vi.fn(),
      onProgress,
      onSaved,
      onStarted: vi.fn(),
    });

    await manager.start(input);

    expect(onProgress).toHaveBeenCalledWith("material-1", 0.5);
    expect(onSaved).toHaveBeenCalledWith("material-1", saved);
  });

  it("取消時にAbortSignalを発火しcancelledを通知する", async () => {
    const onFailed = vi.fn();
    const repository = createRepository(vi.fn((_input, _user, options) => new Promise<SavedMaterial>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("cancelled", "AbortError")));
    })));
    const manager = createMaterialUploadManager({
      getRepository: () => repository,
      getUser: () => user,
      onFailed,
      onProgress: vi.fn(),
      onSaved: vi.fn(),
      onStarted: vi.fn(),
    });

    const saving = manager.start(input);
    manager.cancel("material-1");
    await saving;

    expect(onFailed).toHaveBeenCalledWith("material-1", "cancelled");
  });

  it("失敗した入力を保持して再試行できる", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(saved);
    const onSaved = vi.fn();
    const manager = createMaterialUploadManager({
      getRepository: () => createRepository(save),
      getUser: () => user,
      onFailed: vi.fn(),
      onProgress: vi.fn(),
      onSaved,
      onStarted: vi.fn(),
    });
    await manager.start(input);

    await manager.retry("material-1");

    expect(save).toHaveBeenCalledTimes(2);
    expect(onSaved).toHaveBeenCalledWith("material-1", saved);
  });
});
