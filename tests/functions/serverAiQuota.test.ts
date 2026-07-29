import { describe, expect, it, vi } from "vitest";
import {
  AI_DAILY_REQUEST_LIMIT,
  AiQuotaExceededError,
  createServerAiQuotaService,
  createFirestoreAiQuotaRepository,
} from "../../functions/src/functions/ai/serverAiQuota";

describe("serverAiQuota", () => {
  it("UTC日付・上限とuidをrepositoryへ渡す", async () => {
    const reserveWithinLimit = vi.fn().mockResolvedValue(25);
    const service = createServerAiQuotaService(
      { reserveWithinLimit },
      () => new Date("2026-07-29T23:59:59.000Z"),
    );

    await expect(service.reserve("user-1")).resolves.toBe(25);
    expect(reserveWithinLimit).toHaveBeenCalledWith({
      date: "2026-07-29",
      limit: AI_DAILY_REQUEST_LIMIT,
      uid: "user-1",
    });
  });

  it("100回到達後は予約を拒否するエラーを維持する", async () => {
    const service = createServerAiQuotaService({
      reserveWithinLimit: vi.fn().mockRejectedValue(new AiQuotaExceededError()),
    });

    await expect(service.reserve("user-1")).rejects.toBeInstanceOf(AiQuotaExceededError);
  });

  it("99回からtransactionで100回目を予約する", async () => {
    const set = vi.fn();
    const runTransaction = vi.fn(async (callback) =>
      callback({
        get: vi.fn().mockResolvedValue({
          data: () => ({ count: 99 }),
          exists: true,
        }),
        set,
      }),
    );
    const database = {
      doc: vi.fn().mockReturnValue({ path: "users/user-1/aiUsage/2026-07-29" }),
      runTransaction,
    };
    const repository = createFirestoreAiQuotaRepository(database as never);

    await expect(
      repository.reserveWithinLimit({
        date: "2026-07-29",
        limit: 100,
        uid: "user-1",
      }),
    ).resolves.toBe(100);
    expect(set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ count: 100, date: "2026-07-29" }),
      { merge: true },
    );
  });

  it("100回到達済みではtransaction内で拒否する", async () => {
    const runTransaction = vi.fn(async (callback) =>
      callback({
        get: vi.fn().mockResolvedValue({
          data: () => ({ count: 100 }),
          exists: true,
        }),
        set: vi.fn(),
      }),
    );
    const database = {
      doc: vi.fn().mockReturnValue({}),
      runTransaction,
    };
    const repository = createFirestoreAiQuotaRepository(database as never);

    await expect(
      repository.reserveWithinLimit({
        date: "2026-07-29",
        limit: 100,
        uid: "user-1",
      }),
    ).rejects.toBeInstanceOf(AiQuotaExceededError);
  });
});
