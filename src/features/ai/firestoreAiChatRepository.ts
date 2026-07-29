import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import {
  chatThreadDocumentPath,
  chatThreadMessagePath,
  chatThreadMessagesCollectionPath,
  chatThreadsCollectionPath,
} from "@/features/user-data/userDataPaths";
import type { AiChatMessage, AiChatThread } from "@/features/ai/types";
import type { AiChatRepository } from "@/features/ai/aiChatRepository";

const threadPayload = (thread: AiChatThread) => ({
  createdAt: thread.createdAt,
  noteId: thread.noteId,
  ownerUid: thread.ownerUid,
  status: thread.status,
  title: thread.title,
  turnCount: thread.turnCount,
  updatedAt: thread.updatedAt,
});

const createThreadPayload = (thread: AiChatThread) => {
  const payload: Record<string, unknown> = threadPayload(thread);
  if (thread.inheritedSummary) {
    payload.inheritedSummary = thread.inheritedSummary;
  }
  if (thread.sourceThreadId) {
    payload.sourceThreadId = thread.sourceThreadId;
  }
  return payload;
};

const messagePayload = (message: AiChatMessage) => ({
  createdAt: message.createdAt,
  noteId: message.noteId,
  ownerUid: message.ownerUid,
  role: message.role,
  text: message.text,
  threadId: message.threadId,
});

export class FirestoreAiChatRepository implements AiChatRepository {
  constructor(private readonly firestore: Firestore = db) {}

  async listThreads(uid: string, noteId: string) {
    const snapshot = await getDocs(
      query(collection(this.firestore, chatThreadsCollectionPath({ noteId, uid })), orderBy("updatedAt", "desc")),
    );
    return snapshot.docs.map((documentSnapshot) => ({
      ...documentSnapshot.data(),
      id: documentSnapshot.id,
      noteId,
      ownerUid: uid,
    })) as AiChatThread[];
  }

  async listMessages(uid: string, noteId: string, threadId: string) {
    const snapshot = await getDocs(
      query(
        collection(this.firestore, chatThreadMessagesCollectionPath({ noteId, threadId, uid })),
        orderBy("createdAt", "asc"),
      ),
    );
    return snapshot.docs.map((documentSnapshot) => ({
      ...documentSnapshot.data(),
      id: documentSnapshot.id,
      noteId,
      ownerUid: uid,
      threadId,
    })) as AiChatMessage[];
  }

  async saveThread(uid: string, noteId: string, thread: AiChatThread) {
    await setDoc(
      doc(this.firestore, chatThreadDocumentPath({ childId: thread.id, noteId, uid })),
      createThreadPayload(thread),
    );
  }

  async saveMessage(uid: string, noteId: string, message: AiChatMessage) {
    await setDoc(
      doc(
        this.firestore,
        chatThreadMessagePath({
          messageId: message.id,
          noteId,
          threadId: message.threadId,
          uid,
        }),
      ),
      messagePayload(message),
    );
  }

  async saveRollover(
    uid: string,
    noteId: string,
    { source, successor }: { source: AiChatThread; successor: AiChatThread },
  ) {
    const batch = writeBatch(this.firestore);
    batch.set(
      doc(this.firestore, chatThreadDocumentPath({ childId: source.id, noteId, uid })),
      createThreadPayload(source),
    );
    batch.set(
      doc(this.firestore, chatThreadDocumentPath({ childId: successor.id, noteId, uid })),
      createThreadPayload(successor),
    );
    await batch.commit();
  }
}
