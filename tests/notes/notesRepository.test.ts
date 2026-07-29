import { describe, expect, it } from "vitest";
import { initialMathNotes } from "@/features/notes/fixtures";
import { InMemoryNotesRepository } from "@/features/notes/notesRepository";

describe("notesRepository", () => {
  it("uid ごとにノートを保存し一覧取得する", async () => {
    const repository = new InMemoryNotesRepository();
    await repository.save("user-1", initialMathNotes[0]);

    await expect(repository.list("user-1")).resolves.toHaveLength(1);
    await expect(repository.list("other-user")).resolves.toHaveLength(0);
  });

  it("所有者と uid が違う保存を拒否する", async () => {
    const repository = new InMemoryNotesRepository();

    await expect(repository.save("other-user", initialMathNotes[0])).rejects.toThrow("note owner does not match uid");
  });

  it("uid と noteId で取得と削除を行う", async () => {
    const repository = new InMemoryNotesRepository();
    await repository.save("user-1", initialMathNotes[0]);

    await expect(repository.get("user-1", "calculus-note")).resolves.toMatchObject({
      title: "微分の基礎",
    });
    await repository.remove("user-1", "calculus-note");
    await expect(repository.get("user-1", "calculus-note")).resolves.toBeNull();
  });
});

