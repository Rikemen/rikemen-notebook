import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  NOTEBOOK_DELETION_RETRY_DELAY_MS,
} from "../../functions/notes/notebookDeletion";
import { createAdminNotebookDeletionService } from "./adminNotebookDeletion";

const deletionService = createAdminNotebookDeletionService();

export default onSchedule(
  {
    maxBackoffSeconds: 3600,
    memory: "512MiB",
    region: "asia-northeast1",
    retryCount: 3,
    schedule: "every 60 minutes",
    timeoutSeconds: 540,
  },
  async () => {
    const before = new Date(Date.now() - NOTEBOOK_DELETION_RETRY_DELAY_MS);
    const result = await deletionService.cleanupPending(before);
    logger.info("Notebook deletion cleanup completed", result);
    if (result.failed > 0) {
      throw new Error(`${result.failed} notebook deletions remain pending`);
    }
  },
);
