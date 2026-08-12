import { describe, expect, it, vi } from "vitest";
import { createFirestoreNoteOwnership } from "../../functions/src/functions/ai/noteOwnership";

describe("noteOwnership", () => {
  it("削除中ノートはAI利用対象にしない", async () => {
    const get = vi.fn().mockResolvedValue({
      data: () => ({ deletionStatus: "deleting" }),
      exists: true,
    });
    const service = createFirestoreNoteOwnership({
      doc: vi.fn().mockReturnValue({ get }),
    } as never);

    await expect(service.noteExists("user-1", "note-1")).resolves.toBe(false);
  });
});
