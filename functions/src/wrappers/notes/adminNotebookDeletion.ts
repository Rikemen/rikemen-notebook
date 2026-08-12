import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import {
  createFirestoreNotebookDeletionRepository,
  createStorageNotebookFileRepository,
} from "../../functions/notes/firebaseNotebookDeletion";
import { createNotebookDeletionService } from "../../functions/notes/notebookDeletion";

const firebaseApp = getApps()[0] ?? initializeApp();

export const createAdminNotebookDeletionService = () =>
  createNotebookDeletionService({
    files: createStorageNotebookFileRepository(getStorage(firebaseApp).bucket()),
    onError: (error, context) => {
      logger.error("Notebook cascade deletion failed and will be retried", {
        context,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    },
    repository: createFirestoreNotebookDeletionRepository(getFirestore(firebaseApp)),
  });
