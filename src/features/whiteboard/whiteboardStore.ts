/* eslint-disable max-lines-per-function, max-statements, no-ternary, no-void, prefer-destructuring, sonarjs/elseif-without-else */
import { defineStore } from "pinia";
import { ref } from "vue";
import type { AuthUser } from "@/features/auth/types";
import { createAutosaveStatus, type AutosaveStatus } from "@/features/notes/autosaveStatus";
import { createAutosaveScheduler, type AutosaveScheduler } from "@/features/whiteboard/autosaveScheduler";
import { IndexedDbWhiteboardDraftStorage, InMemoryWhiteboardDraftStorage, type WhiteboardDraftStorage } from "@/features/whiteboard/whiteboardDraftStorage";
import { createDefaultWhiteboardRepository } from "@/features/whiteboard/whiteboardRepositoryProvider";
import type { WhiteboardRepository } from "@/features/whiteboard/whiteboardRepository";
import { addWhiteboardPage, createInitialWhiteboardState, selectWhiteboardPage, type WhiteboardState } from "@/features/whiteboard/whiteboardPages";
import {
  removeDrawingMarkdownReference,
  removeWhiteboardDrawing,
  upsertWhiteboardDrawing,
  type WhiteboardDrawing,
} from "@/features/whiteboard/whiteboardDrawings";

export type WhiteboardViewMode = "md" | "preview";

export interface WhiteboardDocumentState {
  deletedDrawingIds: string[];
  dirtyDrawingIds: string[];
  dirtyPageIds: string[];
  drawings: WhiteboardDrawing[];
  isLoaded: boolean;
  pageState: WhiteboardState;
  revision: number;
  saveStatus: AutosaveStatus;
  viewMode: WhiteboardViewMode;
}

type WhiteboardDocuments = Record<string, WhiteboardDocumentState>;

const createWhiteboardDocument = (noteId: string): WhiteboardDocumentState => ({
  deletedDrawingIds: [],
  dirtyDrawingIds: [],
  dirtyPageIds: [],
  drawings: [],
  isLoaded: false,
  pageState: createInitialWhiteboardState(noteId),
  revision: 0,
  saveStatus: createAutosaveStatus(),
  viewMode: "md",
});

const createDefaultDraftStorage = (): WhiteboardDraftStorage =>
  import.meta.env.MODE === "test" ? new InMemoryWhiteboardDraftStorage() : new IndexedDbWhiteboardDraftStorage();

let repository: WhiteboardRepository = createDefaultWhiteboardRepository();
let draftStorage: WhiteboardDraftStorage = createDefaultDraftStorage();

export const setWhiteboardPersistenceForTest = (next: { draftStorage?: WhiteboardDraftStorage; repository?: WhiteboardRepository }) => {
  if (next.repository) repository = next.repository;
  if (next.draftStorage) draftStorage = next.draftStorage;
};

export const resetWhiteboardPersistenceForTest = () => {
  repository = createDefaultWhiteboardRepository();
  draftStorage = createDefaultDraftStorage();
};

const addUnique = (values: string[], value: string) => (values.includes(value) ? values : [...values, value]);
const ownerKey = (user: AuthUser | null) => user?.uid ?? "anonymous";
export const useWhiteboardStore = defineStore("whiteboard", () => {
  const documentsByNoteId = ref<WhiteboardDocuments>({});
  const userByNoteId = new Map<string, AuthUser | null>();
  const loadRequestByNoteId = new Map<string, number>();
  const schedulers = new Map<string, AutosaveScheduler>();
  const draftTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const documentForNote = (noteId: string) => {
    if (!documentsByNoteId.value[noteId]) documentsByNoteId.value[noteId] = createWhiteboardDocument(noteId);
    return documentsByNoteId.value[noteId];
  };

  const schedulerForNote = (noteId: string) => {
    let scheduler = schedulers.get(noteId);
    if (!scheduler) {
      scheduler = createAutosaveScheduler();
      schedulers.set(noteId, scheduler);
    }
    return scheduler;
  };

  const saveDraft = async (noteId: string) => {
    const document = documentForNote(noteId);
    await draftStorage.save(ownerKey(userByNoteId.get(noteId) ?? null), {
      drawings: document.drawings,
      noteId,
      pageState: document.pageState,
      revision: document.revision,
      updatedAt: new Date().toISOString(),
    });
  };

  const queueDraftSave = (noteId: string) => {
    const pending = draftTimers.get(noteId);
    if (pending) clearTimeout(pending);
    draftTimers.set(
      noteId,
      setTimeout(() => {
        draftTimers.delete(noteId);
        void saveDraft(noteId);
      }, 250),
    );
  };

  const flushNote = async (noteId: string): Promise<boolean> => {
    const document = documentForNote(noteId);
    schedulerForNote(noteId).cancel();
    const pendingDraft = draftTimers.get(noteId);
    if (pendingDraft) clearTimeout(pendingDraft);
    draftTimers.delete(noteId);
    await saveDraft(noteId).catch(() => undefined);
    if (document.saveStatus.state !== "dirty" && document.saveStatus.state !== "failed") return true;

    const user = userByNoteId.get(noteId) ?? null;
    const savingRevision = document.revision;
    if (!user) {
      document.dirtyDrawingIds = [];
      document.dirtyPageIds = [];
      document.deletedDrawingIds = [];
      document.saveStatus = { errorMessage: "", savedAt: new Date().toISOString(), state: "saved" };
      return true;
    }

    document.saveStatus = { errorMessage: "", savedAt: document.saveStatus.savedAt, state: "saving" };
    const dirtyPages = document.pageState.pages.filter((page) => document.dirtyPageIds.includes(page.id));
    const dirtyDrawings = document.drawings.filter((drawing) => document.dirtyDrawingIds.includes(drawing.id));
    const deletedDrawingIds = [...document.deletedDrawingIds];
    try {
      await Promise.all([
        ...dirtyPages.map((page) => repository.savePage(user, page)),
        ...dirtyDrawings.map((drawing) => repository.saveDrawing(user, noteId, drawing)),
        ...deletedDrawingIds.map((drawingId) => repository.deleteDrawing(user.uid, noteId, drawingId)),
      ]);
      if (document.revision === savingRevision) {
        document.dirtyDrawingIds = [];
        document.dirtyPageIds = [];
        document.deletedDrawingIds = [];
        document.saveStatus = { errorMessage: "", savedAt: new Date().toISOString(), state: "saved" };
        await draftStorage.remove(ownerKey(user), noteId).catch(() => undefined);
      } else {
        document.saveStatus = { errorMessage: "", savedAt: document.saveStatus.savedAt, state: "dirty" };
        schedulerForNote(noteId).schedule(() => flushNote(noteId).then(() => undefined));
      }
      return true;
    } catch {
      document.saveStatus = {
        errorMessage: "ホワイトボードを保存できませんでした。ローカル下書きは保持されています。",
        savedAt: document.saveStatus.savedAt,
        state: "failed",
      };
      return false;
    }
  };

  const markDirty = (noteId: string) => {
    const document = documentForNote(noteId);
    document.revision += 1;
    document.saveStatus = { errorMessage: "", savedAt: document.saveStatus.savedAt, state: "dirty" };
    queueDraftSave(noteId);
    schedulerForNote(noteId).schedule(() => flushNote(noteId).then(() => undefined));
  };

  const loadDocument = async (user: AuthUser | null, noteId: string) => {
    const requestId = (loadRequestByNoteId.get(noteId) ?? 0) + 1;
    loadRequestByNoteId.set(noteId, requestId);
    const previousUser = userByNoteId.get(noteId);
    if (previousUser !== undefined && previousUser?.uid !== user?.uid) {
      const pendingDraft = draftTimers.get(noteId);
      if (pendingDraft) clearTimeout(pendingDraft);
      draftTimers.delete(noteId);
      await saveDraft(noteId).catch(() => undefined);
      if (loadRequestByNoteId.get(noteId) !== requestId) return;
      schedulerForNote(noteId).cancel();
      documentsByNoteId.value[noteId] = createWhiteboardDocument(noteId);
    }
    const document = documentForNote(noteId);
    userByNoteId.set(noteId, user);
    const draft = await draftStorage.get(ownerKey(user), noteId).catch(() => null);
    const [remotePages, remoteDrawings] = user
      ? await Promise.all([repository.listPages(user.uid, noteId), repository.listDrawings(user.uid, noteId)])
      : [[], []];
    if (loadRequestByNoteId.get(noteId) !== requestId) return;
    const remoteUpdatedAt = remotePages.reduce((latest, page) => (page.updatedAt > latest ? page.updatedAt : latest), "");
    const useDraft = Boolean(draft && (!remoteUpdatedAt || draft.updatedAt > remoteUpdatedAt));
    if (useDraft && draft) {
      document.pageState = draft.pageState;
      document.drawings = draft.drawings;
      document.revision = draft.revision;
      document.dirtyPageIds = draft.pageState.pages.map((page) => page.id);
      document.dirtyDrawingIds = draft.drawings.map((drawing) => drawing.id);
      document.saveStatus = { errorMessage: "", savedAt: null, state: "dirty" };
      schedulerForNote(noteId).schedule(() => flushNote(noteId).then(() => undefined));
    } else if (remotePages.length > 0) {
      document.pageState = {
        pages: remotePages,
        selectedPageId: remotePages.some((page) => page.id === document.pageState.selectedPageId)
          ? document.pageState.selectedPageId
          : (remotePages[0]?.id ?? ""),
      };
      document.drawings = remoteDrawings;
      document.revision = Math.max(...remotePages.map((page) => page.revision), 0);
      document.saveStatus = { errorMessage: "", savedAt: remoteUpdatedAt, state: "saved" };
    }
    document.isLoaded = true;
  };

  const addPage = (noteId: string) => {
    const document = documentForNote(noteId);
    document.pageState = addWhiteboardPage(document.pageState, noteId);
    document.viewMode = "md";
    document.dirtyPageIds = addUnique(document.dirtyPageIds, document.pageState.selectedPageId);
    markDirty(noteId);
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
    const timestamp = new Date().toISOString();
    document.pageState = {
      ...document.pageState,
      pages: document.pageState.pages.map((page) =>
        page.id === document.pageState.selectedPageId ? { ...page, markdown, revision: page.revision + 1, updatedAt: timestamp } : page,
      ),
    };
    document.dirtyPageIds = addUnique(document.dirtyPageIds, document.pageState.selectedPageId);
    markDirty(noteId);
  };

  const saveDrawing = (noteId: string, drawing: WhiteboardDrawing) => {
    const document = documentForNote(noteId);
    document.drawings = upsertWhiteboardDrawing(document.drawings, drawing);
    document.dirtyDrawingIds = addUnique(document.dirtyDrawingIds, drawing.id);
    document.deletedDrawingIds = document.deletedDrawingIds.filter((id) => id !== drawing.id);
    markDirty(noteId);
  };

  const deleteDrawing = (noteId: string, drawingId: string) => {
    const document = documentForNote(noteId);
    document.drawings = removeWhiteboardDrawing(document.drawings, drawingId);
    const timestamp = new Date().toISOString();
    document.pageState = {
      ...document.pageState,
      pages: document.pageState.pages.map((page) => {
        const markdown = removeDrawingMarkdownReference(page.markdown, drawingId);
        if (markdown === page.markdown) return page;
        document.dirtyPageIds = addUnique(document.dirtyPageIds, page.id);
        return { ...page, markdown, revision: page.revision + 1, updatedAt: timestamp };
      }),
    };
    document.dirtyDrawingIds = document.dirtyDrawingIds.filter((id) => id !== drawingId);
    document.deletedDrawingIds = addUnique(document.deletedDrawingIds, drawingId);
    markDirty(noteId);
  };

  const statusForNote = (noteId: string) => documentForNote(noteId).saveStatus;
  const hasUnsavedChanges = (noteId: string) => ["dirty", "failed", "saving"].includes(statusForNote(noteId).state);
  const cancelScheduledSave = (noteId: string) => schedulerForNote(noteId).cancel();

  return {
    addPage,
    cancelScheduledSave,
    deleteDrawing,
    documentForNote,
    documentsByNoteId,
    flushNote,
    hasUnsavedChanges,
    loadDocument,
    saveDrawing,
    selectPage,
    setViewMode,
    statusForNote,
    updateMarkdown,
  };
});
