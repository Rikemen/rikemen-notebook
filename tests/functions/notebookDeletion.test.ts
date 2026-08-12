import { describe, expect, it, vi } from "vitest";
import {
  createNotebookDeletionService,
  type NotebookDeletionRepository,
  type NotebookFileRepository,
} from "../../functions/src/functions/notes/notebookDeletion";

const createDependencies = () => {
  const calls: string[] = [];
  const repository: NotebookDeletionRepository = {
    deleteDescendants: vi.fn(async () => {
      calls.push("firestore-children");
    }),
    deleteNotebook: vi.fn(async () => {
      calls.push("firestore-note");
    }),
    listDeleting: vi.fn().mockResolvedValue([]),
    markDeleting: vi.fn(async () => {
      calls.push("mark");
      return true;
    }),
  };
  const files: NotebookFileRepository = {
    deleteNotebookFiles: vi.fn(async () => {
      calls.push("storage");
    }),
  };
  return { calls, files, repository };
};

describe("notebookDeletion", () => {
  it("削除中マーク、Storage、子コレクション、親ノートの順で削除する", async () => {
    const dependencies = createDependencies();
    const service = createNotebookDeletionService(dependencies);

    await expect(service.requestDeletion("user-1", "note-1")).resolves.toBe("deleted");
    expect(dependencies.calls).toEqual([
      "mark",
      "storage",
      "firestore-children",
      "firestore-note",
    ]);
  });

  it("Storage削除失敗時は親を残して定期再試行待ちにする", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.files.deleteNotebookFiles).mockRejectedValueOnce(
      new Error("storage failed"),
    );
    const service = createNotebookDeletionService(dependencies);

    await expect(service.requestDeletion("user-1", "note-1")).resolves.toBe("pending");
    expect(dependencies.repository.deleteDescendants).not.toHaveBeenCalled();
    expect(dependencies.repository.deleteNotebook).not.toHaveBeenCalled();
  });

  it("存在しないノートは冪等にmissingを返す", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.repository.markDeleting).mockResolvedValueOnce(false);
    const service = createNotebookDeletionService(dependencies);

    await expect(service.requestDeletion("user-1", "note-missing")).resolves.toBe("missing");
    expect(dependencies.files.deleteNotebookFiles).not.toHaveBeenCalled();
  });

  it("削除中ノートを定期処理で再試行し、失敗件数を返す", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.repository.listDeleting).mockResolvedValueOnce([
      { noteId: "note-1", uid: "user-1" },
      { noteId: "note-2", uid: "user-2" },
    ]);
    vi.mocked(dependencies.repository.deleteDescendants).mockRejectedValueOnce(
      new Error("firestore failed"),
    );
    const service = createNotebookDeletionService(dependencies);

    await expect(service.cleanupPending(new Date("2026-08-07T00:00:00.000Z"))).resolves.toEqual({
      attempted: 2,
      completed: 1,
      failed: 1,
    });
    expect(dependencies.repository.deleteNotebook).toHaveBeenCalledTimes(1);
  });
});
