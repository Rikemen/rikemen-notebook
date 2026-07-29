import { describe, expect, it } from "vitest";
import {
  createDefaultPanelLayout,
  focusPanel,
  getPanelById,
  hidePanel,
  isPanelVisible,
  maximizePanel,
  minimizePanel,
  movePanel,
  resizePanel,
  restorePanel,
  sanitizePanelLayout,
  showPanel,
  togglePanelVisibility,
} from "@/features/workspace/panelLayout";

describe("panelLayout", () => {
  it("noteId付きの4パネル初期配置を作る", () => {
    const layout = createDefaultPanelLayout("note-a");

    expect(layout).toHaveLength(4);
    expect(layout.every((panel) => panel.noteId === "note-a")).toBe(true);
    expect(getPanelById(layout, "whiteboard")?.minWidth).toBe(520);
  });

  it("移動とリサイズをワークスペース範囲と最小サイズで制限する", () => {
    const moved = movePanel(createDefaultPanelLayout(), "textbook", { x: -20, y: 900 });
    const resized = resizePanel(moved, "textbook", { height: 10, width: 10 });

    expect(getPanelById(moved, "textbook")?.x).toBe(0);
    expect(getPanelById(moved, "textbook")?.y).toBe(10);
    expect(getPanelById(resized, "textbook")?.width).toBe(300);
    expect(getPanelById(resized, "textbook")?.height).toBe(420);
  });

  it("focusで最前面にし、最大化後に元位置へ復元する", () => {
    const focused = focusPanel(createDefaultPanelLayout(), "textbook");
    const maximized = maximizePanel(focused, "textbook", { height: 600, width: 900 });
    const restored = restorePanel(maximized, "textbook");

    expect(getPanelById(focused, "textbook")?.zIndex).toBeGreaterThan(4);
    expect(getPanelById(maximized, "textbook")?.state).toBe("maximized");
    expect(getPanelById(maximized, "textbook")?.width).toBe(900);
    expect(getPanelById(restored, "textbook")?.state).toBe("normal");
    expect(getPanelById(restored, "textbook")?.width).toBe(350);
  });

  it("通常表示のパネルを非破壊で閉じて再表示する", () => {
    const initial = createDefaultPanelLayout("note-a");
    const hidden = hidePanel(initial, "whiteboard");
    const restored = showPanel(hidden, "whiteboard");

    expect(isPanelVisible(getPanelById(hidden, "whiteboard"))).toBe(false);
    expect(getPanelById(hidden, "whiteboard")).toMatchObject({
      height: 710,
      state: "closed",
      width: 630,
      x: 370,
      y: 0,
    });
    expect(isPanelVisible(getPanelById(restored, "whiteboard"))).toBe(true);
    expect(getPanelById(restored, "whiteboard")?.state).toBe("normal");
  });

  it("最小化されたパネルを表示ONにすると通常表示へ戻す", () => {
    const minimized = minimizePanel(createDefaultPanelLayout("note-a"), "ai-chat");
    const restored = showPanel(minimized, "ai-chat");

    expect(getPanelById(restored, "ai-chat")?.state).toBe("normal");
  });

  it("最大化パネルを閉じて再表示すると最大化前のboundsへ戻す", () => {
    const maximized = maximizePanel(createDefaultPanelLayout("note-a"), "textbook", {
      height: 600,
      width: 900,
    });
    const hidden = hidePanel(maximized, "textbook");
    const restored = showPanel(hidden, "textbook");

    expect(getPanelById(hidden, "textbook")?.state).toBe("closed");
    expect(getPanelById(restored, "textbook")).toMatchObject({
      height: 710,
      previousBounds: null,
      state: "normal",
      width: 350,
      x: 0,
      y: 0,
    });
  });

  it("表示状態をtoggleしても他のパネルを変更しない", () => {
    const initial = createDefaultPanelLayout("note-a");
    const hidden = togglePanelVisibility(initial, "diagram-code");

    expect(getPanelById(hidden, "diagram-code")?.state).toBe("closed");
    expect(getPanelById(hidden, "textbook")).toEqual(getPanelById(initial, "textbook"));
    expect(getPanelById(togglePanelVisibility(hidden, "diagram-code"), "diagram-code")?.state).toBe("normal");
  });

  it("不正な保存座標は初期配置へ戻す", () => {
    const [textbook, ...rest] = createDefaultPanelLayout("note-a");
    const sanitized = sanitizePanelLayout(
      [
        {
          ...textbook,
          width: 99999,
          x: -100,
        },
        ...rest,
      ],
      "note-a",
      { height: 720, width: 1440 },
    );

    expect(getPanelById(sanitized, "textbook")?.x).toBe(0);
    expect(getPanelById(sanitized, "textbook")?.width).toBe(350);
  });

  it("保存済みレイアウトの旧表示名を現在の表示名へ補正する", () => {
    const legacyLayout = createDefaultPanelLayout("note-a").map((panel) => {
      if (panel.id === "textbook") {
        return { ...panel, title: "教科書" };
      }
      if (panel.id === "diagram-code") {
        return { ...panel, title: "図表・コード" };
      }
      return panel;
    });

    expect(getPanelById(sanitizePanelLayout(legacyLayout), "textbook")?.title).toBe("資料");
    expect(getPanelById(sanitizePanelLayout(legacyLayout), "diagram-code")?.title).toBe("スケッチ");
  });
});
