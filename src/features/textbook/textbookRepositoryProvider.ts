import { FirebaseTextbookRepository } from "@/features/textbook/firebaseTextbookRepository";
import { InMemoryTextbookRepository, type TextbookRepository } from "@/features/textbook/textbookRepository";

export const createDefaultTextbookRepository = (): TextbookRepository => {
  if (import.meta.env.MODE === "test") {
    return new InMemoryTextbookRepository();
  }
  return new FirebaseTextbookRepository();
};
