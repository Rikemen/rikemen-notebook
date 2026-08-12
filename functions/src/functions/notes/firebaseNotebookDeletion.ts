import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type { Bucket } from "@google-cloud/storage";
import {
  NOTEBOOK_DELETION_STATUS,
  type DeletingNotebook,
  type NotebookDeletionRepository,
  type NotebookFileRepository,
} from "./notebookDeletion";

const encodePathSegment = (value: string) => encodeURIComponent(value.trim());

const notebookPath = (uid: string, noteId: string) =>
  `users/${encodePathSegment(uid)}/notes/${encodePathSegment(noteId)}`;

const decodePathSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const deletingNotebookFromPath = (path: string): DeletingNotebook | null => {
  const segments = path.split("/");
  if (
    segments.length !== 4 ||
    segments[0] !== "users" ||
    segments[2] !== "notes"
  ) return null;
  return {
    noteId: decodePathSegment(segments[3]),
    uid: decodePathSegment(segments[1]),
  };
};

export const createFirestoreNotebookDeletionRepository = (
  database: Firestore,
): NotebookDeletionRepository => ({
  deleteDescendants: async (uid, noteId) => {
    const noteReference = database.doc(notebookPath(uid, noteId));
    const childCollections = await noteReference.listCollections();
    await Promise.all(
      childCollections.map((collectionReference) =>
        database.recursiveDelete(collectionReference)),
    );
  },
  deleteNotebook: async (uid, noteId) => {
    await database.doc(notebookPath(uid, noteId)).delete();
  },
  listDeleting: async (before, limit) => {
    const snapshot = await database
      .collectionGroup("notes")
      .where("deletionStatus", "==", NOTEBOOK_DELETION_STATUS)
      .where("deletionStartedAt", "<=", Timestamp.fromDate(before))
      .orderBy("deletionStartedAt", "asc")
      .limit(limit)
      .get();
    return snapshot.docs
      .map((documentSnapshot) => deletingNotebookFromPath(documentSnapshot.ref.path))
      .filter((notebook): notebook is DeletingNotebook => notebook !== null);
  },
  markDeleting: async (uid, noteId) => {
    const noteReference = database.doc(notebookPath(uid, noteId));
    return database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(noteReference);
      if (!snapshot.exists) return false;
      if (
        snapshot.data()?.deletionStatus !== NOTEBOOK_DELETION_STATUS ||
        !snapshot.data()?.deletionStartedAt
      ) {
        transaction.update(noteReference, {
          deletionStartedAt: FieldValue.serverTimestamp(),
          deletionStatus: NOTEBOOK_DELETION_STATUS,
        });
      }
      return true;
    });
  },
});

export const createStorageNotebookFileRepository = (
  bucket: Bucket,
): NotebookFileRepository => ({
  deleteNotebookFiles: async (uid, noteId) => {
    await bucket.deleteFiles({
      prefix: `${notebookPath(uid, noteId)}/`,
    });
  },
});
