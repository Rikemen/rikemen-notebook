import type { PanelLayoutItem } from "@/features/workspace/panelLayout";
import { workspaceLayoutPath } from "@/features/user-data/userDataPaths";

export interface WorkspaceLayoutRepository {
  loadLayout(uid: string, noteId: string): Promise<PanelLayoutItem[] | null>;
  saveLayout(uid: string, noteId: string, layout: PanelLayoutItem[]): Promise<void>;
}

export const createWorkspaceLayoutPath = (uid: string, noteId: string) =>
  workspaceLayoutPath({
    noteId,
    uid,
  });

export const createInMemoryWorkspaceLayoutRepository = (): WorkspaceLayoutRepository => {
  const layouts = new Map<string, PanelLayoutItem[]>();

  return {
    loadLayout: (uid, noteId) => Promise.resolve(layouts.get(createWorkspaceLayoutPath(uid, noteId)) ?? null),
    saveLayout: (uid, noteId, layout) => {
      layouts.set(createWorkspaceLayoutPath(uid, noteId), layout.map((panel) => ({ ...panel })));
      return Promise.resolve();
    },
  };
};
