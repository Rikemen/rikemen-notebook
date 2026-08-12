export const NOTEBOOK_DELETION_STATUS = "deleting";
export const NOTEBOOK_DELETION_BATCH_LIMIT = 100;
export const NOTEBOOK_DELETION_CONCURRENCY = 5;
export const NOTEBOOK_DELETION_RETRY_DELAY_MS = 15 * 60 * 1000;

export interface DeletingNotebook {
  noteId: string;
  uid: string;
}

export interface NotebookDeletionRepository {
  deleteDescendants(uid: string, noteId: string): Promise<void>;
  deleteNotebook(uid: string, noteId: string): Promise<void>;
  listDeleting(before: Date, limit: number): Promise<DeletingNotebook[]>;
  markDeleting(uid: string, noteId: string): Promise<boolean>;
}

export interface NotebookFileRepository {
  deleteNotebookFiles(uid: string, noteId: string): Promise<void>;
}

export type NotebookDeletionRequestStatus = "deleted" | "missing" | "pending";

export interface NotebookDeletionCleanupResult {
  attempted: number;
  completed: number;
  failed: number;
}

interface NotebookDeletionErrorContext extends DeletingNotebook {
  phase: "cleanup" | "request";
}

interface NotebookDeletionDependencies {
  files: NotebookFileRepository;
  onError?: (error: unknown, context: NotebookDeletionErrorContext) => void;
  repository: NotebookDeletionRepository;
}

const completeDeletion = async (
  dependencies: NotebookDeletionDependencies,
  uid: string,
  noteId: string,
) => {
  await dependencies.files.deleteNotebookFiles(uid, noteId);
  await dependencies.repository.deleteDescendants(uid, noteId);
  await dependencies.repository.deleteNotebook(uid, noteId);
};

export const createNotebookDeletionService = (
  dependencies: NotebookDeletionDependencies,
) => ({
  cleanupPending: async (
    before: Date,
    limit = NOTEBOOK_DELETION_BATCH_LIMIT,
  ): Promise<NotebookDeletionCleanupResult> => {
    const notebooks = await dependencies.repository.listDeleting(before, limit);
    const results: boolean[] = [];
    for (let index = 0; index < notebooks.length; index += NOTEBOOK_DELETION_CONCURRENCY) {
      const batch = notebooks.slice(index, index + NOTEBOOK_DELETION_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async ({ noteId, uid }) => {
          try {
            await completeDeletion(dependencies, uid, noteId);
            return true;
          } catch (error: unknown) {
            dependencies.onError?.(error, { noteId, phase: "cleanup", uid });
            return false;
          }
        }),
      );
      results.push(...batchResults);
    }
    const completed = results.filter(Boolean).length;
    return {
      attempted: notebooks.length,
      completed,
      failed: notebooks.length - completed,
    };
  },
  requestDeletion: async (
    uid: string,
    noteId: string,
  ): Promise<NotebookDeletionRequestStatus> => {
    const exists = await dependencies.repository.markDeleting(uid, noteId);
    if (!exists) return "missing";

    try {
      await completeDeletion(dependencies, uid, noteId);
      return "deleted";
    } catch (error: unknown) {
      dependencies.onError?.(error, { noteId, phase: "request", uid });
      return "pending";
    }
  },
});

export type NotebookDeletionService = ReturnType<typeof createNotebookDeletionService>;
