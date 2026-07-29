/* eslint-disable max-statements */
import {
  sanitizePanelLayout,
  WORKSPACE_LAYOUT_VERSION,
  type PanelLayoutItem,
  type WorkspaceBounds,
} from "@/features/workspace/panelLayout";

export interface StoredWorkspaceLayout {
  panels: PanelLayoutItem[];
  version: number;
}

const storageKey = (noteId: string) => `gauss-notebook:workspace-layout:${noteId}`;

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const loadWorkspaceLayout = (noteId: string, bounds?: WorkspaceBounds) => {
  const storage = getStorage();
  const storedValue = storage?.getItem(storageKey(noteId));
  if (!storedValue) {
    return null;
  }

  try {
    const storedLayout = JSON.parse(storedValue) as Partial<StoredWorkspaceLayout>;
    if (storedLayout.version !== WORKSPACE_LAYOUT_VERSION || !Array.isArray(storedLayout.panels)) {
      storage?.removeItem(storageKey(noteId));
      return null;
    }

    return sanitizePanelLayout(storedLayout.panels, noteId, bounds);
  } catch {
    storage?.removeItem(storageKey(noteId));
    return null;
  }
};

export const saveWorkspaceLayout = (noteId: string, panels: PanelLayoutItem[]) => {
  const storage = getStorage();
  const storedLayout: StoredWorkspaceLayout = {
    panels,
    version: WORKSPACE_LAYOUT_VERSION,
  };

  storage?.setItem(storageKey(noteId), JSON.stringify(storedLayout));
};
