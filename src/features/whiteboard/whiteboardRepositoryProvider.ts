import { FirestoreWhiteboardRepository } from "@/features/whiteboard/firestoreWhiteboardRepository";
import { InMemoryWhiteboardRepository, type WhiteboardRepository } from "@/features/whiteboard/whiteboardRepository";

export const createDefaultWhiteboardRepository = (): WhiteboardRepository => {
  if (import.meta.env.MODE === "test") return new InMemoryWhiteboardRepository();
  return new FirestoreWhiteboardRepository();
};
