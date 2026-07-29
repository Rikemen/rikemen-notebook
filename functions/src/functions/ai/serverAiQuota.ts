import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const AI_DAILY_REQUEST_LIMIT = 100;

export interface AiQuotaReservation {
  date: string;
  limit: number;
  uid: string;
}

export interface AiQuotaRepository {
  reserveWithinLimit(reservation: AiQuotaReservation): Promise<number>;
}

export interface ServerAiQuotaService {
  reserve(uid: string): Promise<number>;
}

export class AiQuotaExceededError extends Error {
  constructor() {
    super("AIチャットの1日100回の利用上限に達しました。");
    this.name = "AiQuotaExceededError";
  }
}

export const createServerAiQuotaService = (
  repository: AiQuotaRepository,
  now: () => Date = () => new Date(),
): ServerAiQuotaService => ({
  reserve: (uid) =>
    repository.reserveWithinLimit({
      date: now().toISOString().slice(0, 10),
      limit: AI_DAILY_REQUEST_LIMIT,
      uid,
    }),
});

export const createFirestoreAiQuotaRepository = (
  database: Firestore,
): AiQuotaRepository => ({
  reserveWithinLimit: async ({ date, limit, uid }) => {
    const usageReference = database.doc(`users/${uid}/aiUsage/${date}`);
    return database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(usageReference);
      const existingCount = snapshot.exists ? snapshot.data()?.count : 0;
      const count = typeof existingCount === "number" ? existingCount : 0;
      if (count >= limit) {
        throw new AiQuotaExceededError();
      }
      const nextCount = count + 1;
      transaction.set(
        usageReference,
        {
          count: nextCount,
          date,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return nextCount;
    });
  },
});
