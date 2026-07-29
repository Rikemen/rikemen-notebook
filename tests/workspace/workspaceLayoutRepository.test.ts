import { describe, expect, it } from "vitest";
import { createDefaultPanelLayout } from "@/features/workspace/panelLayout";
import { createInMemoryWorkspaceLayoutRepository, createWorkspaceLayoutPath } from "@/features/workspace/workspaceLayoutRepository";

describe("workspaceLayoutRepository", () => {
  it("uid/noteIdごとにレイアウトを保存し、他ユーザーと混ざらない", async () => {
    const repository = createInMemoryWorkspaceLayoutRepository();
    const layout = createDefaultPanelLayout("note-1");

    await repository.saveLayout("user-1", "note-1", layout);

    await expect(repository.loadLayout("user-1", "note-1")).resolves.toHaveLength(4);
    await expect(repository.loadLayout("user-2", "note-1")).resolves.toBeNull();
    expect(createWorkspaceLayoutPath("user-1", "note-1")).toBe("users/user-1/notes/note-1/workspace/layout");
  });
});

