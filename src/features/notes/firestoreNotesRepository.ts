import { collection, doc, getDoc, getDocs, setDoc, type Firestore } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { callDeleteNotebook } from "@/utils/functions";
import { noteDocumentPath, notesCollectionPath } from "@/features/user-data/userDataPaths";
import type { MathNote } from "@/features/notes/types";
import type { NotesRepository } from "@/features/notes/notesRepository";

export class FirestoreNotesRepository implements NotesRepository {
  constructor(
    private readonly firestore: Firestore = db,
    private readonly deleteNotebook: (noteId: string) => Promise<unknown> = callDeleteNotebook,
  ) {}

  async list(uid: string) {
    const snapshot = await getDocs(collection(this.firestore, notesCollectionPath(uid)));
    return snapshot.docs
      .filter((documentSnapshot) => documentSnapshot.data().deletionStatus !== "deleting")
      .map((documentSnapshot) => ({
        ...documentSnapshot.data(),
        id: documentSnapshot.id,
        ownerUid: uid,
      })) as MathNote[];
  }

  async get(uid: string, noteId: string) {
    const snapshot = await getDoc(doc(this.firestore, noteDocumentPath({ noteId, uid })));
    if (!snapshot.exists() || snapshot.data().deletionStatus === "deleting") {
      return null;
    }

    return {
      ...snapshot.data(),
      id: snapshot.id,
      ownerUid: uid,
    } as MathNote;
  }

  async save(uid: string, note: MathNote) {
    if (note.ownerUid !== uid) {
      throw new Error("note owner does not match uid");
    }

    await setDoc(doc(this.firestore, noteDocumentPath({ noteId: note.id, uid })), {
      createdAt: note.createdAt,
      favorite: note.favorite,
      recent: note.recent,
      subject: note.subject,
      tags: note.tags,
      title: note.title,
      updatedAt: note.updatedAt,
    });
  }

  async remove(uid: string, noteId: string) {
    if (!uid.trim()) throw new Error("uid is required to delete note");
    await this.deleteNotebook(noteId);
  }
}
