import { describe, expect, it, vi } from "vitest";
import {
  createFirestoreNotebookDeletionRepository,
  createStorageNotebookFileRepository,
} from "../../functions/src/functions/notes/firebaseNotebookDeletion";

describe("firebaseNotebookDeletion", () => {
  it("既存のStorageパス規則と同じprefixでノート配下を削除する", async () => {
    const deleteFiles = vi.fn().mockResolvedValue(undefined);
    const repository = createStorageNotebookFileRepository({ deleteFiles } as never);

    await repository.deleteNotebookFiles("user@example.com", "note 1");

    expect(deleteFiles).toHaveBeenCalledWith({
      prefix: "users/user%40example.com/notes/note%201/",
    });
  });

  it("削除中クエリのdocument pathからuidとnoteIdを復元する", async () => {
    const query = {
      get: vi.fn().mockResolvedValue({
        docs: [
          { ref: { path: "users/user%40example.com/notes/note%201" } },
          { ref: { path: "archives/archive-1/notes/note-ignored" } },
        ],
      }),
      limit: vi.fn(),
      orderBy: vi.fn(),
      where: vi.fn(),
    };
    query.limit.mockReturnValue(query);
    query.orderBy.mockReturnValue(query);
    query.where.mockReturnValue(query);
    const database = {
      collectionGroup: vi.fn().mockReturnValue(query),
    };
    const repository = createFirestoreNotebookDeletionRepository(database as never);

    await expect(
      repository.listDeleting(new Date("2026-08-07T00:00:00.000Z"), 25),
    ).resolves.toEqual([{ noteId: "note 1", uid: "user@example.com" }]);
    expect(database.collectionGroup).toHaveBeenCalledWith("notes");
    expect(query.limit).toHaveBeenCalledWith(25);
  });

  it("ノート直下の全サブコレクションをrecursiveDeleteする", async () => {
    const childCollections = [{ id: "materials" }, { id: "whiteboardPages" }];
    const noteReference = {
      listCollections: vi.fn().mockResolvedValue(childCollections),
    };
    const recursiveDelete = vi.fn().mockResolvedValue(undefined);
    const database = {
      doc: vi.fn().mockReturnValue(noteReference),
      recursiveDelete,
    };
    const repository = createFirestoreNotebookDeletionRepository(database as never);

    await repository.deleteDescendants("user@example.com", "note 1");

    expect(database.doc).toHaveBeenCalledWith(
      "users/user%40example.com/notes/note%201",
    );
    expect(recursiveDelete).toHaveBeenCalledTimes(2);
    expect(recursiveDelete).toHaveBeenNthCalledWith(1, childCollections[0]);
    expect(recursiveDelete).toHaveBeenNthCalledWith(2, childCollections[1]);
  });
});
