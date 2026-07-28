import { describe, it, expect, vi } from "vitest";
import { sleep } from "@/utils/utils";

describe("sleep", () => {
  it("指定ミリ秒後に true で resolve される", async () => {
    // タイマーをモック化して待ち時間をスキップ
    vi.useFakeTimers();

    const promise = sleep(1000);

    // 1000ms 分の時間を進める
    vi.advanceTimersByTime(1000);

    const result = await promise;
    expect(result).toBe(true);

    vi.useRealTimers();
  });

  it("0ms でも正常に resolve される", async () => {
    vi.useFakeTimers();

    const promise = sleep(0);
    vi.advanceTimersByTime(0);

    const result = await promise;
    expect(result).toBe(true);

    vi.useRealTimers();
  });
});
