import type { MathNote } from "@/features/notes/types";

export interface NotesRepository {
  list(uid: string): Promise<MathNote[]>;
  get(uid: string, noteId: string): Promise<MathNote | null>;
  save(uid: string, note: MathNote): Promise<void>;
  remove(uid: string, noteId: string): Promise<void>;
}

const requireOwnedNote = (uid: string, note: MathNote) => {
  if (note.ownerUid !== uid) {
    throw new Error("note owner does not match uid");
  }
};

export class InMemoryNotesRepository implements NotesRepository {
  private readonly notes = new Map<string, MathNote>();

  constructor(initialNotes: MathNote[] = []) {
    initialNotes.forEach((note) => {
      this.notes.set(`${note.ownerUid}:${note.id}`, {
        ...note,
        tags: [...note.tags],
      });
    });
  }

  list(uid: string) {
    return Promise.resolve([...this.notes.values()].filter((note) => note.ownerUid === uid));
  }

  get(uid: string, noteId: string) {
    return Promise.resolve(this.notes.get(`${uid}:${noteId}`) ?? null);
  }

  save(uid: string, note: MathNote) {
    try {
      requireOwnedNote(uid, note);
      this.notes.set(`${uid}:${note.id}`, {
        ...note,
        tags: [...note.tags],
      });
      return Promise.resolve();
    } catch (error: unknown) {
      return Promise.reject(error);
    }
  }

  remove(uid: string, noteId: string) {
    this.notes.delete(`${uid}:${noteId}`);
    return Promise.resolve();
  }
}
