import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosaveScheduler, WHITEBOARD_AUTOSAVE_DELAY_MS } from "@/features/whiteboard/autosaveScheduler";

describe("autosaveScheduler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("最後の編集から30秒後に1回保存する", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutosaveScheduler();
    scheduler.schedule(save);

    await vi.advanceTimersByTimeAsync(WHITEBOARD_AUTOSAVE_DELAY_MS - 1);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledOnce();
  });

  it("再編集すると30秒timerを最初から数え直す", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutosaveScheduler();
    scheduler.schedule(save);
    await vi.advanceTimersByTimeAsync(20_000);
    scheduler.schedule(save);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(save).toHaveBeenCalledOnce();
  });

  it("明示flushは待機せず保存し、cancelは保存しない", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutosaveScheduler();
    scheduler.schedule(save);
    await scheduler.flush();
    expect(save).toHaveBeenCalledOnce();

    scheduler.schedule(save);
    scheduler.cancel();
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledOnce();
  });
});
