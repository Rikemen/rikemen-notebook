import { describe, expect, it, vi } from "vitest";
import { createDeleteNotebookHandler } from "../../functions/src/functions/notes/deleteNotebook";

describe("deleteNotebook callable", () => {
  it("認証ユーザーのuidとnoteIdで削除を開始する", async () => {
    const requestDeletion = vi.fn().mockResolvedValue("deleted");
    const handler = createDeleteNotebookHandler({ requestDeletion } as never);

    await expect(handler({ auth: { uid: "user-1" }, data: { noteId: "note-1" } })).resolves.toEqual({
      status: "deleted",
    });
    expect(requestDeletion).toHaveBeenCalledWith("user-1", "note-1");
  });

  it("未認証と不正なnoteIdを拒否する", async () => {
    const handler = createDeleteNotebookHandler({ requestDeletion: vi.fn() } as never);

    await expect(handler({ data: { noteId: "note-1" } })).rejects.toMatchObject({
      code: "unauthenticated",
    });
    await expect(handler({ auth: { uid: "user-1" }, data: { noteId: "" } })).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });
});
