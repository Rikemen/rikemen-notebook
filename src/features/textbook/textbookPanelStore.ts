import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { MaterialListItem } from "@/features/textbook/materials";
import { addMaterialTocItem, type MaterialTocItem } from "@/features/textbook/materialTableOfContents";

export type MaterialPanelMode = "materials" | "contents" | "preview";

export interface TextbookPanelState {
  materials: MaterialListItem[];
  mode: MaterialPanelMode;
  selectedPage: number;
  selectedTextbookId: string;
  thumbnailsCollapsed: boolean;
  tocByMaterialId: Record<string, MaterialTocItem[]>;
}

type TextbookPanelStates = Record<string, TextbookPanelState>;

interface TocCommand {
  item: MaterialTocItem;
  materialId: string;
}

type StateForNote = (noteId: string) => TextbookPanelState;

const createStateForNote = (statesByNoteId: Ref<TextbookPanelStates>): StateForNote =>
  (noteId) => {
    if (!statesByNoteId.value[noteId]) {
      statesByNoteId.value[noteId] = {
        materials: [],
        mode: "materials",
        selectedPage: 1,
        selectedTextbookId: "",
        thumbnailsCollapsed: false,
        tocByMaterialId: {},
      };
    }

    return statesByNoteId.value[noteId];
  };

const createSelectionActions = (stateForNote: StateForNote) => ({
  selectPage: (noteId: string, page: number) => {
    stateForNote(noteId).selectedPage = page;
  },
  selectTextbook: (noteId: string, textbookId: string) => {
    const state = stateForNote(noteId);
    state.selectedTextbookId = textbookId;
    state.selectedPage = 1;
  },
  setMode: (noteId: string, mode: MaterialPanelMode) => {
    stateForNote(noteId).mode = mode;
  },
  setThumbnailsCollapsed: (noteId: string, collapsed: boolean) => {
    stateForNote(noteId).thumbnailsCollapsed = collapsed;
  },
});

const createMaterialActions = (stateForNote: StateForNote) => ({
  addMaterial: (noteId: string, material: MaterialListItem) => {
    const state = stateForNote(noteId);
    state.materials.push(material);
    state.selectedTextbookId = material.id;
    state.selectedPage = 1;
  },
  hydrateMaterials: (noteId: string, materials: MaterialListItem[]) => {
    const state = stateForNote(noteId);
    const byId = new Map(state.materials.map((material) => [material.id, material]));
    materials.forEach((material) => byId.set(material.id, { ...material }));
    state.materials = [...byId.values()];
    if (!state.selectedTextbookId && state.materials.length > 0) {
      state.selectedTextbookId = state.materials[0].id;
    }
  },
  updateMaterial: (noteId: string, materialId: string, patch: Partial<MaterialListItem>) => {
    const state = stateForNote(noteId);
    const material = state.materials.find((candidate) => candidate.id === materialId);
    if (material) {
      Object.assign(material, patch);
    }
  },
});

const createTocActions = (stateForNote: StateForNote) => ({
  addTocItem: (noteId: string, command: TocCommand) => {
    const state = stateForNote(noteId);
    state.tocByMaterialId[command.materialId] = addMaterialTocItem(
      state.tocByMaterialId[command.materialId] ?? [],
      command.item,
    );
  },
  openTocItem: (noteId: string, command: TocCommand) => {
    const state = stateForNote(noteId);
    state.selectedTextbookId = command.materialId;
    state.selectedPage = command.item.page;
    state.mode = "preview";
  },
});

export const useTextbookPanelStore = defineStore("textbookPanel", () => {
  const statesByNoteId = ref<TextbookPanelStates>({});
  const stateForNote = createStateForNote(statesByNoteId);
  return {
    ...createMaterialActions(stateForNote),
    ...createSelectionActions(stateForNote),
    ...createTocActions(stateForNote),
    stateForNote,
    statesByNoteId,
  };
});
