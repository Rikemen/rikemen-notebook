import { describe, expect, it } from "vitest";
import { createDefaultPanelLayout, hidePanel } from "@/features/workspace/panelLayout";
import { loadWorkspaceLayout, saveWorkspaceLayout } from "@/features/workspace/localWorkspaceLayoutStorage";

describe("localWorkspaceLayoutStorage", () => {
  it("現行バージョンのレイアウトだけを復元する", () => {
    const layout = createDefaultPanelLayout("note-1");

    saveWorkspaceLayout("note-1", layout);

    expect(loadWorkspaceLayout("note-1")).toHaveLength(4);
  });

  it("閉じたパネルの状態を保存して復元する", () => {
    const layout = hidePanel(createDefaultPanelLayout("note-hidden"), "whiteboard");

    saveWorkspaceLayout("note-hidden", layout);

    expect(loadWorkspaceLayout("note-hidden")?.find((panel) => panel.id === "whiteboard")?.state).toBe("closed");
  });

  it("古い保存値や破損値は破棄する", () => {
    window.localStorage.setItem(
      "gauss-notebook:workspace-layout:old-note",
      JSON.stringify({
        panels: createDefaultPanelLayout("old-note"),
        version: 1,
      }),
    );
    window.localStorage.setItem("gauss-notebook:workspace-layout:broken-note", "{");

    expect(loadWorkspaceLayout("old-note")).toBeNull();
    expect(loadWorkspaceLayout("broken-note")).toBeNull();
  });
});
