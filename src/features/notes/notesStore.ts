/* eslint-disable max-lines-per-function, max-statements */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { AuthUser } from "@/features/auth/types";
import { canPersistHistory } from "@/features/auth/accessPolicy";
import { initialMathNotes } from "@/features/notes/fixtures";
import { FirestoreNotesRepository } from "@/features/notes/firestoreNotesRepository";
import { InMemoryNotesRepository, type NotesRepository } from "@/features/notes/notesRepository";
import { searchNotes } from "@/features/notes/searchNotes";
import type { CreateNoteInput, MathNote, SearchNotesQuery } from "@/features/notes/types";
import { validateNoteInput } from "@/features/notes/validateNoteInput";

const nowIso = () => new Date().toISOString();

const createNoteId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}`;
};

const createDefaultNotesRepository = (): NotesRepository => {
  if (import.meta.env.MODE === "test") {
    return new InMemoryNotesRepository(initialMathNotes);
  }

  return new FirestoreNotesRepository();
};

let notesRepository = createDefaultNotesRepository();

export const setNotesRepositoryForTest = (repository: NotesRepository) => {
  notesRepository = repository;
};

export const resetNotesRepositoryForTest = () => {
  notesRepository = createDefaultNotesRepository();
};

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<MathNote[]>([...initialMathNotes]);
  const isLoading = ref(false);
  const loadError = ref("");
  const saveError = ref("");
  const query = ref<SearchNotesQuery>({
    keyword: "",
    subject: "",
    tag: "",
  });

  const visibleNotes = computed(() => searchNotes(notes.value, query.value));

  const notesForUser = (uid: string) => notes.value.filter((note) => note.ownerUid === uid);

  const loadNotes = async (user: AuthUser | null | undefined) => {
    if (!canPersistHistory(user)) {
      return;
    }

    isLoading.value = true;
    loadError.value = "";
    try {
      notes.value = await notesRepository.list(user.uid);
    } catch (error: unknown) {
      if (error instanceof Error) {
        loadError.value = error.message;
      } else {
        loadError.value = "ノートの読み込みに失敗しました。";
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createNote = async (input: CreateNoteInput, user: AuthUser | null | undefined) => {
    if (!canPersistHistory(user)) {
      return null;
    }

    const validation = validateNoteInput(input);
    if (!validation.ok) {
      return null;
    }

    const timestamp = nowIso();
    const note: MathNote = {
      createdAt: timestamp,
      favorite: false,
      id: createNoteId(),
      ownerUid: user.uid,
      recent: true,
      subject: (input.subject ?? "").trim(),
      tags: input.tags,
      title: input.title.trim(),
      updatedAt: timestamp,
    };

    notes.value = [note, ...notes.value];
    saveError.value = "";
    try {
      await notesRepository.save(user.uid, note);
    } catch (error: unknown) {
      notes.value = notes.value.filter((candidate) => candidate.id !== note.id);
      if (error instanceof Error) {
        saveError.value = error.message;
      } else {
        saveError.value = "ノートの保存に失敗しました。";
      }
      return null;
    }

    return note;
  };

  const duplicateNote = async (noteId: string, user: AuthUser | null | undefined) => {
    if (!canPersistHistory(user)) {
      return null;
    }

    const note = notes.value.find((candidate) => candidate.id === noteId && candidate.ownerUid === user.uid);
    if (!note) {
      return null;
    }

    return await createNote(
      {
        subject: note.subject,
        tags: [...note.tags],
        title: `${note.title} コピー`,
      },
      user,
    );
  };

  const deleteNote = async (noteId: string, user: AuthUser | null | undefined) => {
    if (!canPersistHistory(user)) {
      return false;
    }

    const previousNotes = notes.value;
    notes.value = notes.value.filter((note) => note.id !== noteId || note.ownerUid !== user.uid);
    if (notes.value.length === previousNotes.length) {
      return false;
    }

    saveError.value = "";
    try {
      await notesRepository.remove(user.uid, noteId);
      return true;
    } catch (error: unknown) {
      notes.value = previousNotes;
      if (error instanceof Error) {
        saveError.value = error.message;
      } else {
        saveError.value = "ノートの削除に失敗しました。";
      }
      return false;
    }
  };

  const toggleFavorite = async (noteId: string, user: AuthUser | null | undefined) => {
    if (!canPersistHistory(user)) {
      return false;
    }

    const note = notes.value.find((candidate) => candidate.id === noteId && candidate.ownerUid === user.uid);
    if (!note) {
      return false;
    }

    const previousFavorite = note.favorite;
    const previousUpdatedAt = note.updatedAt;
    note.favorite = !note.favorite;
    note.updatedAt = nowIso();
    saveError.value = "";
    try {
      await notesRepository.save(user.uid, note);
      return true;
    } catch (error: unknown) {
      note.favorite = previousFavorite;
      note.updatedAt = previousUpdatedAt;
      if (error instanceof Error) {
        saveError.value = error.message;
      } else {
        saveError.value = "ノートの更新に失敗しました。";
      }
      return false;
    }
  };

  const updateQuery = (patch: Partial<SearchNotesQuery>) => {
    query.value = {
      ...query.value,
      ...patch,
    };
  };

  return {
    createNote,
    deleteNote,
    duplicateNote,
    isLoading,
    loadError,
    loadNotes,
    notes,
    notesForUser,
    query,
    saveError,
    toggleFavorite,
    updateQuery,
    visibleNotes,
  };
});
