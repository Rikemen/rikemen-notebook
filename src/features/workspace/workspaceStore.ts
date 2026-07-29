/* eslint-disable max-lines-per-function, max-params, max-statements */
import { defineStore } from "pinia";
import { ref } from "vue";
import type { WorkspacePanelId } from "@/features/workspace/panels";
import { loadWorkspaceLayout, saveWorkspaceLayout } from "@/features/workspace/localWorkspaceLayoutStorage";
import {
  closePanel,
  createDefaultPanelLayout,
  focusPanel,
  getPanelById,
  isPanelVisible,
  maximizePanel,
  minimizePanel,
  movePanel,
  resizePanel,
  restorePanel,
  sanitizePanelLayout,
  togglePanelVisibility,
  type PanelBounds,
  type PanelLayoutItem,
  type WorkspaceLayoutMode,
  type WorkspaceBounds,
} from "@/features/workspace/panelLayout";

type PanelLayoutState = Record<string, PanelLayoutItem[]>;
type LayoutModeState = Record<string, WorkspaceLayoutMode>;

export const useWorkspaceStore = defineStore("workspace", () => {
  const panelLayoutsByNoteId = ref<PanelLayoutState>({});
  const layoutModeByNoteId = ref<LayoutModeState>({});

  const layoutForNote = (noteId: string) => {
    if (!panelLayoutsByNoteId.value[noteId]) {
      const savedLayout = loadWorkspaceLayout(noteId);
      const initialLayout = savedLayout ?? createDefaultPanelLayout(noteId);
      panelLayoutsByNoteId.value = {
        ...panelLayoutsByNoteId.value,
        [noteId]: initialLayout,
      };
    }

    return panelLayoutsByNoteId.value[noteId];
  };

  const updateLayout = (noteId: string, nextLayout: PanelLayoutItem[]) => {
    panelLayoutsByNoteId.value = {
      ...panelLayoutsByNoteId.value,
      [noteId]: nextLayout,
    };
    saveWorkspaceLayout(noteId, nextLayout);
  };

  const layoutModeForNote = (noteId: string) => layoutModeByNoteId.value[noteId] ?? "docked";

  const setLayoutMode = (noteId: string, mode: WorkspaceLayoutMode) => {
    layoutModeByNoteId.value = {
      ...layoutModeByNoteId.value,
      [noteId]: mode,
    };
  };

  const repairLayout = (noteId: string, bounds: WorkspaceBounds) => updateLayout(noteId, sanitizePanelLayout(layoutForNote(noteId), noteId, bounds));

  const moveLayoutPanel = (noteId: string, panelId: WorkspacePanelId, nextPosition: Pick<PanelBounds, "x" | "y">, bounds?: WorkspaceBounds) =>
    updateLayout(noteId, movePanel(layoutForNote(noteId), panelId, nextPosition, bounds));

  const resizeLayoutPanel = (noteId: string, panelId: WorkspacePanelId, nextSize: Pick<PanelBounds, "height" | "width">, bounds?: WorkspaceBounds) =>
    updateLayout(noteId, resizePanel(layoutForNote(noteId), panelId, nextSize, bounds));

  const focusLayoutPanel = (noteId: string, panelId: WorkspacePanelId) => updateLayout(noteId, focusPanel(layoutForNote(noteId), panelId));

  const minimizeLayoutPanel = (noteId: string, panelId: WorkspacePanelId) => updateLayout(noteId, minimizePanel(layoutForNote(noteId), panelId));

  const maximizeLayoutPanel = (noteId: string, panelId: WorkspacePanelId, bounds?: WorkspaceBounds) =>
    updateLayout(noteId, maximizePanel(layoutForNote(noteId), panelId, bounds));

  const restoreLayoutPanel = (noteId: string, panelId: WorkspacePanelId) => updateLayout(noteId, restorePanel(layoutForNote(noteId), panelId));

  const closeLayoutPanel = (noteId: string, panelId: WorkspacePanelId) => updateLayout(noteId, closePanel(layoutForNote(noteId), panelId));

  const isLayoutPanelVisible = (noteId: string, panelId: WorkspacePanelId) => isPanelVisible(getPanelById(layoutForNote(noteId), panelId));

  const toggleLayoutPanelVisibility = (noteId: string, panelId: WorkspacePanelId) =>
    updateLayout(noteId, togglePanelVisibility(layoutForNote(noteId), panelId));

  return {
    closeLayoutPanel,
    focusLayoutPanel,
    isLayoutPanelVisible,
    layoutModeByNoteId,
    layoutModeForNote,
    layoutForNote,
    maximizeLayoutPanel,
    minimizeLayoutPanel,
    moveLayoutPanel,
    panelLayoutsByNoteId,
    repairLayout,
    resizeLayoutPanel,
    restoreLayoutPanel,
    setLayoutMode,
    toggleLayoutPanelVisibility,
  };
});
