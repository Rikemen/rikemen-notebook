export interface NotePathParams {
  uid: string;
  noteId: string;
}

export interface NoteChildPathParams extends NotePathParams {
  childId: string;
}

export interface TextbookStoragePathParams {
  uid: string;
  textbookId: string;
  fileName: string;
}

export interface NoteMaterialStoragePathParams extends NotePathParams {
  fileName: string;
  materialId: string;
}

export interface WhiteboardDrawingStoragePathParams extends NotePathParams {
  drawingId: string;
  fileName: "preview.png" | "strokes.json";
}

export interface ChatThreadMessagePathParams extends NotePathParams {
  messageId: string;
  threadId: string;
}

const encodePathSegment = (value: string) => encodeURIComponent(value.trim());

export const userRootPath = (uid: string) => `users/${encodePathSegment(uid)}`;

export const notesCollectionPath = (uid: string) => `${userRootPath(uid)}/notes`;

export const noteDocumentPath = ({ noteId, uid }: NotePathParams) => `${notesCollectionPath(uid)}/${encodePathSegment(noteId)}`;

export const noteChatMessagePath = ({ childId, noteId, uid }: NoteChildPathParams) =>
  `${noteDocumentPath({ noteId, uid })}/chatMessages/${encodePathSegment(childId)}`;

export const chatThreadsCollectionPath = ({ noteId, uid }: NotePathParams) => `${noteDocumentPath({ noteId, uid })}/chatThreads`;

export const chatThreadDocumentPath = ({ childId: threadId, noteId, uid }: NoteChildPathParams) =>
  `${chatThreadsCollectionPath({ noteId, uid })}/${encodePathSegment(threadId)}`;

export const chatThreadMessagesCollectionPath = ({ noteId, threadId, uid }: Omit<ChatThreadMessagePathParams, "messageId">) =>
  `${chatThreadDocumentPath({ childId: threadId, noteId, uid })}/messages`;

export const chatThreadMessagePath = ({ messageId, noteId, threadId, uid }: ChatThreadMessagePathParams) =>
  `${chatThreadMessagesCollectionPath({ noteId, threadId, uid })}/${encodePathSegment(messageId)}`;

export const whiteboardPagePath = ({ childId, noteId, uid }: NoteChildPathParams) =>
  `${noteDocumentPath({ noteId, uid })}/whiteboardPages/${encodePathSegment(childId)}`;

export const whiteboardPagesCollectionPath = ({ noteId, uid }: NotePathParams) => `${noteDocumentPath({ noteId, uid })}/whiteboardPages`;

export const whiteboardDrawingsCollectionPath = ({ noteId, uid }: NotePathParams) => `${noteDocumentPath({ noteId, uid })}/whiteboardDrawings`;

export const whiteboardDrawingPath = ({ childId, noteId, uid }: NoteChildPathParams) =>
  `${whiteboardDrawingsCollectionPath({ noteId, uid })}/${encodePathSegment(childId)}`;

export const whiteboardDrawingStoragePath = ({ drawingId, fileName, noteId, uid }: WhiteboardDrawingStoragePathParams) =>
  `${userRootPath(uid)}/notes/${encodePathSegment(noteId)}/whiteboardDrawings/${encodePathSegment(drawingId)}/${fileName}`;

export const noteMaterialsCollectionPath = ({ noteId, uid }: NotePathParams) => `${noteDocumentPath({ noteId, uid })}/materials`;

export const noteMaterialDocumentPath = ({ childId, noteId, uid }: NoteChildPathParams) =>
  `${noteMaterialsCollectionPath({ noteId, uid })}/${encodePathSegment(childId)}`;

export const noteMaterialStoragePath = ({ fileName, materialId, noteId, uid }: NoteMaterialStoragePathParams) =>
  `${userRootPath(uid)}/notes/${encodePathSegment(noteId)}/materials/${encodePathSegment(materialId)}/${encodePathSegment(fileName)}`;

export const workspaceLayoutPath = ({ noteId, uid }: NotePathParams) => `${noteDocumentPath({ noteId, uid })}/workspace/layout`;

export const textbookDocumentPath = ({ noteId: textbookId, uid }: NotePathParams) => `${userRootPath(uid)}/textbooks/${encodePathSegment(textbookId)}`;

export const textbookStoragePath = ({ fileName, textbookId, uid }: TextbookStoragePathParams) =>
  `users/${encodePathSegment(uid)}/textbooks/${encodePathSegment(textbookId)}/${encodePathSegment(fileName)}`;
