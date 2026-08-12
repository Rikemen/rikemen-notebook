import { onCall } from "firebase-functions/v2/https";
import { createDeleteNotebookHandler } from "../../functions/notes/deleteNotebook";
import { createAdminNotebookDeletionService } from "./adminNotebookDeletion";

const handler = createDeleteNotebookHandler(createAdminNotebookDeletionService());

export default onCall(
  {
    memory: "512MiB",
    region: "asia-northeast1",
    timeoutSeconds: 540,
  },
  handler,
);
