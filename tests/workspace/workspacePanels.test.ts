import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { workspacePanels } from "@/features/workspace/panels";
import { useWorkspaceStore } from "@/features/workspace/workspaceStore";

describe("workspacePanels", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("4つの基本パネルを定義する", () => {
    expect(workspacePanels.map((panel) => panel.title)).toEqual(["資料", "ホワイトボード", "AIチャット", "スケッチ"]);
  });

  it("noteId ごとに表示状態を切り替える", () => {
    const store = useWorkspaceStore();

    store.toggleLayoutPanelVisibility("note-1", "textbook");

    expect(store.isLayoutPanelVisible("note-1", "textbook")).toBe(false);
    expect(store.isLayoutPanelVisible("note-2", "textbook")).toBe(true);

    store.toggleLayoutPanelVisibility("note-1", "textbook");
    expect(store.isLayoutPanelVisible("note-1", "textbook")).toBe(true);
  });
});
