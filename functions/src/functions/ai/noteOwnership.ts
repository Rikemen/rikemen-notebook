import type { Firestore } from "firebase-admin/firestore";

export interface NoteOwnershipService {
  noteExists(uid: string, noteId: string): Promise<boolean>;
}

export const createFirestoreNoteOwnership = (
  database: Firestore,
): NoteOwnershipService => ({
  noteExists: async (uid, noteId) => {
    const snapshot = await database.doc(`users/${uid}/notes/${noteId}`).get();
    return snapshot.exists && snapshot.data()?.deletionStatus !== "deleting";
  },
});
