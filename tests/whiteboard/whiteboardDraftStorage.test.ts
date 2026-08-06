import { describe, expect, it } from "vitest";
import { InMemoryWhiteboardDraftStorage } from "@/features/whiteboard/whiteboardDraftStorage";
import { createInitialWhiteboardState } from "@/features/whiteboard/whiteboardPages";

describe("whiteboardDraftStorage", () => {
  it("利用者とノート単位でlocal draftを保存・削除する", async () => {
    const storage = new InMemoryWhiteboardDraftStorage();
    await storage.save("user-1", {
      drawings: [],
      noteId: "note-1",
      pageState: createInitialWhiteboardState("note-1"),
      revision: 2,
      updatedAt: "2026-08-06T00:00:00.000Z",
    });

    await expect(storage.get("user-1", "note-1")).resolves.toMatchObject({ revision: 2 });
    await expect(storage.get("other-user", "note-1")).resolves.toBeNull();
    await storage.remove("user-1", "note-1");
    await expect(storage.get("user-1", "note-1")).resolves.toBeNull();
  });
});
