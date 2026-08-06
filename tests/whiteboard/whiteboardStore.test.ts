import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/features/auth/types";
import { createDrawingMarkdown, createWhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";
import { InMemoryWhiteboardDraftStorage } from "@/features/whiteboard/whiteboardDraftStorage";
import { InMemoryWhiteboardRepository } from "@/features/whiteboard/whiteboardRepository";
import { resetWhiteboardPersistenceForTest, setWhiteboardPersistenceForTest, useWhiteboardStore } from "@/features/whiteboard/whiteboardStore";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

describe("whiteboardStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  afterEach(() => {
    resetWhiteboardPersistenceForTest();
    vi.useRealTimers();
  });

  it("画像削除時にノート内の全ページから参照を除去する", () => {
    const store = useWhiteboardStore();
    const drawing = createWhiteboardDrawing({
      dataUrl: "data:image/png;base64,one",
      id: "drawing-1",
      nowIso: "2026-07-29T00:00:00.000Z",
      strokes: [],
    });

    store.saveDrawing("note-1", drawing);
    store.updateMarkdown("note-1", `1ページ\n\n${createDrawingMarkdown("drawing-1")}`);
    store.addPage("note-1");
    store.updateMarkdown("note-1", `2ページ\n\n${createDrawingMarkdown("drawing-1")}`);
    store.deleteDrawing("note-1", "drawing-1");

    const document = store.documentForNote("note-1");
    expect(document.drawings).toEqual([]);
    expect(document.pageState.pages.map((page) => page.markdown)).toEqual(["1ページ", "2ページ"]);
  });

  it("最後の編集から30秒後に変更ページを自動保存する", async () => {
    vi.useFakeTimers();
    const repository = new InMemoryWhiteboardRepository();
    const savePage = vi.spyOn(repository, "savePage");
    setWhiteboardPersistenceForTest({ repository });
    const store = useWhiteboardStore();
    await store.loadDocument(user, "note-autosave");

    store.updateMarkdown("note-autosave", "# 30秒後に保存");
    expect(store.statusForNote("note-autosave").state).toBe("dirty");
    await vi.advanceTimersByTimeAsync(29_999);
    expect(savePage).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(savePage).toHaveBeenCalledOnce();
    expect(store.statusForNote("note-autosave").state).toBe("saved");
  });

  it("保存する操作は30秒を待たずにflushする", async () => {
    vi.useFakeTimers();
    const repository = new InMemoryWhiteboardRepository();
    const savePage = vi.spyOn(repository, "savePage");
    setWhiteboardPersistenceForTest({ repository });
    const store = useWhiteboardStore();
    await store.loadDocument(user, "note-manual");
    store.updateMarkdown("note-manual", "明示保存");

    await expect(store.flushNote("note-manual")).resolves.toBe(true);
    expect(savePage).toHaveBeenCalledOnce();
    expect(store.statusForNote("note-manual").state).toBe("saved");
  });

  it("保存失敗時は再試行可能な状態とlocal draftを残す", async () => {
    const repository = new InMemoryWhiteboardRepository();
    vi.spyOn(repository, "savePage").mockRejectedValueOnce(new Error("offline"));
    const drafts = new InMemoryWhiteboardDraftStorage();
    setWhiteboardPersistenceForTest({ draftStorage: drafts, repository });
    const store = useWhiteboardStore();
    await store.loadDocument(user, "note-failed");
    store.updateMarkdown("note-failed", "消さない内容");

    await expect(store.flushNote("note-failed")).resolves.toBe(false);
    expect(store.statusForNote("note-failed")).toMatchObject({ state: "failed" });
    await expect(drafts.get(user.uid, "note-failed")).resolves.toMatchObject({
      pageState: { pages: [expect.objectContaining({ markdown: "消さない内容" })] },
    });
  });

  it("remoteより新しいlocal draftを再読込時に復元する", async () => {
    const drafts = new InMemoryWhiteboardDraftStorage();
    const pageState = useWhiteboardStore().documentForNote("note-draft").pageState;
    pageState.pages[0].markdown = "復元する下書き";
    await drafts.save(user.uid, {
      drawings: [],
      noteId: "note-draft",
      pageState,
      revision: 3,
      updatedAt: "2026-08-06T10:00:00.000Z",
    });
    setWhiteboardPersistenceForTest({
      draftStorage: drafts,
      repository: new InMemoryWhiteboardRepository(),
    });
    setActivePinia(createPinia());
    const restored = useWhiteboardStore();
    await restored.loadDocument(user, "note-draft");

    expect(restored.documentForNote("note-draft").pageState.pages[0].markdown).toBe("復元する下書き");
    expect(restored.statusForNote("note-draft").state).toBe("dirty");
  });

  it("同じnote IDでも利用者が変わると前利用者の内容を表示しない", async () => {
    setWhiteboardPersistenceForTest({
      draftStorage: new InMemoryWhiteboardDraftStorage(),
      repository: new InMemoryWhiteboardRepository(),
    });
    const store = useWhiteboardStore();
    await store.loadDocument(user, "shared-note-id");
    store.updateMarkdown("shared-note-id", "前利用者の内容");

    await store.loadDocument({ ...user, uid: "user-2" }, "shared-note-id");

    expect(store.documentForNote("shared-note-id").pageState.pages[0].markdown).not.toContain("前利用者の内容");
  });
});
