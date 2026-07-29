/* eslint-disable id-length, max-params, no-ternary */
import type { WorkspacePanelId } from "@/features/workspace/panels";

export type PanelVisualState = "normal" | "minimized" | "maximized" | "closed";
export type WorkspaceLayoutMode = "docked" | "free";

export const WORKSPACE_LAYOUT_VERSION = 2;

export interface PanelBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface PanelLayoutItem extends PanelBounds {
  id: WorkspacePanelId;
  minHeight: number;
  minWidth: number;
  noteId: string;
  previousBounds: PanelBounds | null;
  state: PanelVisualState;
  title: string;
  zIndex: number;
}

export interface WorkspaceBounds {
  height: number;
  width: number;
}

const DEFAULT_NOTE_ID = "default-note";

export const workspaceDefaultBounds: WorkspaceBounds = {
  height: 720,
  width: 1440,
};

export const panelMinimumSizes: Record<WorkspacePanelId, Pick<PanelLayoutItem, "minHeight" | "minWidth">> = {
  "ai-chat": {
    minHeight: 280,
    minWidth: 340,
  },
  "diagram-code": {
    minHeight: 300,
    minWidth: 360,
  },
  textbook: {
    minHeight: 420,
    minWidth: 300,
  },
  whiteboard: {
    minHeight: 420,
    minWidth: 520,
  },
};

const titles: Record<WorkspacePanelId, string> = {
  "ai-chat": "AIチャット",
  "diagram-code": "スケッチ",
  textbook: "資料",
  whiteboard: "ホワイトボード",
};

const defaultBounds: Record<WorkspacePanelId, PanelBounds> = {
  "ai-chat": {
    height: 330,
    width: 390,
    x: 1010,
    y: 0,
  },
  "diagram-code": {
    height: 360,
    width: 390,
    x: 1010,
    y: 350,
  },
  textbook: {
    height: 710,
    width: 350,
    x: 0,
    y: 0,
  },
  whiteboard: {
    height: 710,
    width: 630,
    x: 370,
    y: 0,
  },
};

const panelOrder: WorkspacePanelId[] = ["textbook", "whiteboard", "ai-chat", "diagram-code"];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const copyWith = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId, updatePanel: (panel: PanelLayoutItem) => PanelLayoutItem) =>
  layouts.map((panel) => (panel.id === panelId ? updatePanel(panel) : panel));

const nextZIndex = (layouts: PanelLayoutItem[]) => Math.max(...layouts.map((panel) => panel.zIndex), 0) + 1;

export const createDefaultPanelLayout = (noteId = DEFAULT_NOTE_ID): PanelLayoutItem[] =>
  panelOrder.map((id, index) => ({
    ...defaultBounds[id],
    ...panelMinimumSizes[id],
    id,
    noteId,
    previousBounds: null,
    state: "normal",
    title: titles[id],
    zIndex: index + 1,
  }));

const isValidPanelBounds = (panel: PanelLayoutItem, bounds: WorkspaceBounds) =>
  Number.isFinite(panel.x) &&
  Number.isFinite(panel.y) &&
  Number.isFinite(panel.width) &&
  Number.isFinite(panel.height) &&
  panel.x >= 0 &&
  panel.y >= 0 &&
  panel.width >= panel.minWidth &&
  panel.height >= panel.minHeight &&
  panel.x <= bounds.width &&
  panel.y <= bounds.height &&
  panel.width <= bounds.width * 1.5 &&
  panel.height <= bounds.height * 1.5;

export const sanitizePanelLayout = (layouts: PanelLayoutItem[], noteId = DEFAULT_NOTE_ID, bounds = workspaceDefaultBounds): PanelLayoutItem[] => {
  const hasEveryPanel = panelOrder.every((panelId) => layouts.some((panel) => panel.id === panelId));
  const everyPanelValid = layouts.every((panel) => isValidPanelBounds(panel, bounds));

  if (!hasEveryPanel || !everyPanelValid) {
    return createDefaultPanelLayout(noteId);
  }

  return layouts.map((panel) => ({
    ...panel,
    height: clamp(panel.height, panel.minHeight, bounds.height),
    noteId,
    title: titles[panel.id],
    width: clamp(panel.width, panel.minWidth, bounds.width),
    x: clamp(panel.x, 0, Math.max(bounds.width - panel.width, 0)),
    y: clamp(panel.y, 0, Math.max(bounds.height - panel.height, 0)),
  }));
};

export const movePanel = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId, nextPosition: Pick<PanelBounds, "x" | "y">, bounds = workspaceDefaultBounds) =>
  copyWith(layouts, panelId, (panel) => ({
    ...panel,
    x: clamp(nextPosition.x, 0, Math.max(bounds.width - panel.width, 0)),
    y: clamp(nextPosition.y, 0, Math.max(bounds.height - panel.height, 0)),
  }));

export const resizePanel = (
  layouts: PanelLayoutItem[],
  panelId: WorkspacePanelId,
  nextSize: Pick<PanelBounds, "height" | "width">,
  bounds = workspaceDefaultBounds,
) =>
  copyWith(layouts, panelId, (panel) => ({
    ...panel,
    height: clamp(nextSize.height, panel.minHeight, Math.max(bounds.height - panel.y, panel.minHeight)),
    width: clamp(nextSize.width, panel.minWidth, Math.max(bounds.width - panel.x, panel.minWidth)),
  }));

export const focusPanel = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId) =>
  copyWith(layouts, panelId, (panel) => ({
    ...panel,
    zIndex: nextZIndex(layouts),
  }));

export const minimizePanel = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId) =>
  copyWith(layouts, panelId, (panel) => ({
    ...panel,
    state: "minimized",
  }));

export const isPanelVisible = (panel: PanelLayoutItem | undefined) => panel?.state === "normal" || panel?.state === "maximized";

export const hidePanel = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId) =>
  copyWith(layouts, panelId, (panel) => {
    if (panel.state === "maximized" && panel.previousBounds) {
      return {
        ...panel,
        ...panel.previousBounds,
        previousBounds: null,
        state: "closed",
      };
    }

    return {
      ...panel,
      state: "closed",
    };
  });

export const closePanel = hidePanel;

export const maximizePanel = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId, bounds = workspaceDefaultBounds) =>
  copyWith(layouts, panelId, (panel) => ({
    ...panel,
    height: bounds.height,
    previousBounds: {
      height: panel.height,
      width: panel.width,
      x: panel.x,
      y: panel.y,
    },
    state: "maximized",
    width: bounds.width,
    x: 0,
    y: 0,
    zIndex: nextZIndex(layouts),
  }));

export const showPanel = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId) =>
  copyWith(layouts, panelId, (panel) => {
    if (panel.previousBounds) {
      return {
        ...panel,
        ...panel.previousBounds,
        previousBounds: null,
        state: "normal",
      };
    }

    return {
      ...panel,
      state: "normal",
    };
  });

export const restorePanel = showPanel;

export const togglePanelVisibility = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId) => {
  const panel = layouts.find((candidate) => candidate.id === panelId);

  return isPanelVisible(panel) ? hidePanel(layouts, panelId) : showPanel(layouts, panelId);
};

export const getPanelById = (layouts: PanelLayoutItem[], panelId: WorkspacePanelId) => layouts.find((panel) => panel.id === panelId);

export const isWorkspacePanelId = (value: string): value is WorkspacePanelId => panelOrder.includes(value as WorkspacePanelId);
