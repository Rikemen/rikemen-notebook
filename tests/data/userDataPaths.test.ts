import { describe, expect, it } from "vitest";
import {
  chatThreadDocumentPath,
  chatThreadMessagePath,
  chatThreadsCollectionPath,
  noteChatMessagePath,
  noteDocumentPath,
  notesCollectionPath,
  textbookDocumentPath,
  textbookStoragePath,
  userRootPath,
  whiteboardPagePath,
} from "@/features/user-data/userDataPaths";

describe("userDataPaths", () => {
  it("ユーザー別 Firestore パスを生成する", () => {
    expect(userRootPath("user-1")).toBe("users/user-1");
    expect(notesCollectionPath("user-1")).toBe("users/user-1/notes");
    expect(noteDocumentPath({ noteId: "note-1", uid: "user-1" })).toBe("users/user-1/notes/note-1");
    expect(noteChatMessagePath({ childId: "message-1", noteId: "note-1", uid: "user-1" })).toBe(
      "users/user-1/notes/note-1/chatMessages/message-1",
    );
    expect(chatThreadsCollectionPath({ noteId: "note-1", uid: "user-1" })).toBe(
      "users/user-1/notes/note-1/chatThreads",
    );
    expect(chatThreadDocumentPath({ childId: "thread-1", noteId: "note-1", uid: "user-1" })).toBe(
      "users/user-1/notes/note-1/chatThreads/thread-1",
    );
    expect(
      chatThreadMessagePath({
        messageId: "message-1",
        noteId: "note-1",
        threadId: "thread-1",
        uid: "user-1",
      }),
    ).toBe("users/user-1/notes/note-1/chatThreads/thread-1/messages/message-1");
    expect(whiteboardPagePath({ childId: "page-1", noteId: "note-1", uid: "user-1" })).toBe(
      "users/user-1/notes/note-1/whiteboardPages/page-1",
    );
    expect(textbookDocumentPath({ noteId: "textbook-1", uid: "user-1" })).toBe("users/user-1/textbooks/textbook-1");
  });

  it("Storage パスの各セグメントをエンコードする", () => {
    expect(
      textbookStoragePath({
        fileName: "linear algebra.pdf",
        textbookId: "textbook 1",
        uid: "user@example.com",
      }),
    ).toBe("users/user%40example.com/textbooks/textbook%201/linear%20algebra.pdf");
  });
});
