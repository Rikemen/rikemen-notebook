export const WHITEBOARD_AUTOSAVE_DELAY_MS = 30_000;

export interface AutosaveScheduler {
  cancel(): void;
  flush(): Promise<void>;
  hasPending(): boolean;
  schedule(callback: () => Promise<void>): void;
}

export const createAutosaveScheduler = (delayMs = WHITEBOARD_AUTOSAVE_DELAY_MS): AutosaveScheduler => {
  let callback: (() => Promise<void>) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    callback = null;
  };
  const flush = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const pending = callback;
    callback = null;
    if (pending) await pending();
  };
  return {
    cancel,
    flush,
    hasPending: () => timer !== null,
    schedule: (nextCallback) => {
      if (timer) clearTimeout(timer);
      callback = nextCallback;
      timer = setTimeout(() => {
        flush().catch(() => undefined);
      }, delayMs);
    },
  };
};
