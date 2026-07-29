import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialMathNotes } from "@/features/notes/fixtures";
import { InMemoryNotesRepository } from "@/features/notes/notesRepository";
import { resetNotesRepositoryForTest, setNotesRepositoryForTest, useNotesStore } from "@/features/notes/notesStore";
import type { AuthUser } from "@/features/auth/types";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

const otherUser: AuthUser = {
  ...user,
  uid: "other-user",
};

describe("notesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetNotesRepositoryForTest();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00.000Z"));
  });

  it("ログインユーザーのノートを作成してrepositoryへ保存する", async () => {
    const repository = new InMemoryNotesRepository();
    setNotesRepositoryForTest(repository);
    const store = useNotesStore();
    const note = await store.createNote(
      {
        tags: ["分散"],
        title: "分散の基礎",
      },
      user,
    );

    expect(note).toMatchObject({
      ownerUid: "user-1",
      subject: "",
      title: "分散の基礎",
    });
    await expect(repository.list("user-1")).resolves.toHaveLength(1);
    expect(store.notesForUser("user-1").some((candidate) => candidate.title === "分散の基礎")).toBe(true);
  });

  it("repositoryからログインユーザーのノートを読み込む", async () => {
    const repository = new InMemoryNotesRepository([initialMathNotes[0]]);
    setNotesRepositoryForTest(repository);
    const store = useNotesStore();

    await store.loadNotes(user);

    expect(store.notesForUser("user-1")).toHaveLength(1);
    expect(store.notesForUser("user-1")[0]?.title).toBe("微分の基礎");
  });

  it("未ログインでは作成できない", async () => {
    const store = useNotesStore();

    await expect(store.createNote({ tags: [], title: "未保存" }, null)).resolves.toBeNull();
  });

  it("教科なしのノートを作成できる", async () => {
    const store = useNotesStore();
    const note = await store.createNote(
      {
        tags: ["複素数"],
        title: "HOME作成ノート",
      },
      user,
    );

    expect(note?.subject).toBe("");
    expect(note?.tags).toEqual(["複素数"]);
  });

  it("他人のノートは削除やお気に入り変更できない", async () => {
    const store = useNotesStore();

    await expect(store.deleteNote("calculus-note", otherUser)).resolves.toBe(false);
    await expect(store.toggleFavorite("calculus-note", otherUser)).resolves.toBe(false);
  });

  it("本人のノートを複製できる", async () => {
    const store = useNotesStore();
    const duplicated = await store.duplicateNote("calculus-note", user);

    expect(duplicated?.title).toBe("微分の基礎 コピー");
    expect(duplicated?.ownerUid).toBe("user-1");
  });

  it("本人のノート削除をrepositoryへ同期する", async () => {
    const repository = new InMemoryNotesRepository(initialMathNotes);
    setNotesRepositoryForTest(repository);
    const store = useNotesStore();

    await expect(store.deleteNote("calculus-note", user)).resolves.toBe(true);

    await expect(repository.get("user-1", "calculus-note")).resolves.toBeNull();
  });
});
