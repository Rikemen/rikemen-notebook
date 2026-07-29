/* eslint-disable max-lines-per-function */
import { defineStore } from "pinia";
import { ref } from "vue";
import { addWhiteboardPage, createInitialWhiteboardState, selectWhiteboardPage, type WhiteboardState } from "@/features/whiteboard/whiteboardPages";
import {
  removeDrawingMarkdownReference,
  removeWhiteboardDrawing,
  upsertWhiteboardDrawing,
  type WhiteboardDrawing,
} from "@/features/whiteboard/whiteboardDrawings";

export type WhiteboardViewMode = "md" | "preview";

export interface WhiteboardDocumentState {
  drawings: WhiteboardDrawing[];
  pageState: WhiteboardState;
  viewMode: WhiteboardViewMode;
}

type WhiteboardDocuments = Record<string, WhiteboardDocumentState>;

const createWhiteboardDocument = (noteId: string): WhiteboardDocumentState => ({
  drawings: [],
  pageState: createInitialWhiteboardState(noteId),
  viewMode: "md",
});

export const useWhiteboardStore = defineStore("whiteboard", () => {
  const documentsByNoteId = ref<WhiteboardDocuments>({});

  const documentForNote = (noteId: string) => {
    if (!documentsByNoteId.value[noteId]) {
      documentsByNoteId.value[noteId] = createWhiteboardDocument(noteId);
    }

    return documentsByNoteId.value[noteId];
  };

  const addPage = (noteId: string) => {
    const document = documentForNote(noteId);
    document.pageState = addWhiteboardPage(document.pageState, noteId);
    document.viewMode = "md";
  };

  const selectPage = (noteId: string, pageId: string) => {
    const document = documentForNote(noteId);
    document.pageState = selectWhiteboardPage(document.pageState, pageId);
  };

  const setViewMode = (noteId: string, viewMode: WhiteboardViewMode) => {
    documentForNote(noteId).viewMode = viewMode;
  };

  const updateMarkdown = (noteId: string, markdown: string) => {
    const document = documentForNote(noteId);
    document.pageState = {
      ...document.pageState,
      pages: document.pageState.pages.map((page) => {
        if (page.id === document.pageState.selectedPageId) {
          return {
            ...page,
            markdown,
          };
        }

        return page;
      }),
    };
  };

  const saveDrawing = (noteId: string, drawing: WhiteboardDrawing) => {
    const document = documentForNote(noteId);
    document.drawings = upsertWhiteboardDrawing(document.drawings, drawing);
  };

  const deleteDrawing = (noteId: string, drawingId: string) => {
    const document = documentForNote(noteId);
    document.drawings = removeWhiteboardDrawing(document.drawings, drawingId);
    document.pageState = {
      ...document.pageState,
      pages: document.pageState.pages.map((page) => ({
        ...page,
        markdown: removeDrawingMarkdownReference(page.markdown, drawingId),
      })),
    };
  };

  return {
    addPage,
    deleteDrawing,
    documentForNote,
    documentsByNoteId,
    saveDrawing,
    selectPage,
    setViewMode,
    updateMarkdown,
  };
});
