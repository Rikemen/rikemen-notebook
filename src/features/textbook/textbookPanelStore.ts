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
  tocByMaterialId: Record<string, MaterialTocItem[]>;
}

type TextbookPanelStates = Record<string, TextbookPanelState>;

interface TocCommand {
  initialMaterials: MaterialListItem[];
  item: MaterialTocItem;
  materialId: string;
}

type StateForNote = (noteId: string, initialMaterials: MaterialListItem[]) => TextbookPanelState;

const createStateForNote = (statesByNoteId: Ref<TextbookPanelStates>): StateForNote =>
  (noteId, initialMaterials) => {
    if (!statesByNoteId.value[noteId]) {
      const materials = initialMaterials.map((material) => ({ ...material }));
      statesByNoteId.value[noteId] = {
        materials,
        mode: "materials",
        selectedPage: 1,
        selectedTextbookId: materials[0]?.id ?? "",
        tocByMaterialId: {},
      };
    }

    return statesByNoteId.value[noteId];
  };

const createSelectionActions = (stateForNote: StateForNote) => ({
  selectPage: (noteId: string, page: number, initialMaterials: MaterialListItem[]) => {
    stateForNote(noteId, initialMaterials).selectedPage = page;
  },
  selectTextbook: (noteId: string, textbookId: string, initialMaterials: MaterialListItem[]) => {
    const state = stateForNote(noteId, initialMaterials);
    state.selectedTextbookId = textbookId;
    state.selectedPage = 1;
  },
  setMode: (noteId: string, mode: MaterialPanelMode, initialMaterials: MaterialListItem[]) => {
    stateForNote(noteId, initialMaterials).mode = mode;
  },
});

const createMaterialActions = (stateForNote: StateForNote) => ({
  addMaterial: (noteId: string, material: MaterialListItem, initialMaterials: MaterialListItem[]) => {
    const state = stateForNote(noteId, initialMaterials);
    state.materials.push(material);
    state.selectedTextbookId = material.id;
    state.selectedPage = 1;
  },
});

const createTocActions = (stateForNote: StateForNote) => ({
  addTocItem: (noteId: string, command: TocCommand) => {
    const state = stateForNote(noteId, command.initialMaterials);
    state.tocByMaterialId[command.materialId] = addMaterialTocItem(
      state.tocByMaterialId[command.materialId] ?? [],
      command.item,
    );
  },
  openTocItem: (noteId: string, command: TocCommand) => {
    const state = stateForNote(noteId, command.initialMaterials);
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
