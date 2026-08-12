import { HttpsError } from "firebase-functions/v2/https";
import type { NotebookDeletionService } from "./notebookDeletion";

interface DeleteNotebookCallableRequest {
  auth?: {
    uid: string;
  };
  data: unknown;
}

const parseNoteId = (data: unknown) => {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "ノートIDを指定してください。");
  }
  const noteId = (data as { noteId?: unknown }).noteId;
  if (
    typeof noteId !== "string" ||
    noteId.trim().length < 1 ||
    noteId.trim().length > 128
  ) {
    throw new HttpsError("invalid-argument", "ノートIDが不正です。");
  }
  return noteId.trim();
};

export const createDeleteNotebookHandler = (
  deletionService: NotebookDeletionService,
) => async (request: DeleteNotebookCallableRequest) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "ノートの削除にはログインが必要です。");
  }
  const noteId = parseNoteId(request.data);
  try {
    const status = await deletionService.requestDeletion(uid, noteId);
    return { status };
  } catch {
    throw new HttpsError(
      "internal",
      "ノートの削除を開始できませんでした。時間をおいて再試行してください。",
    );
  }
};
