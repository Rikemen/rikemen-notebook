/* eslint-disable max-statements, no-ternary */
import type { AuthUser } from "@/features/auth/types";
import type {
  MaterialFileSaveInput,
  SavedMaterial,
  TextbookRepository,
} from "@/features/textbook/textbookRepository";

type UploadFailure = "cancelled" | "error";

interface MaterialUploadManagerOptions {
  getRepository(): TextbookRepository;
  getUser(): AuthUser | null;
  onFailed(materialId: string, failure: UploadFailure): void;
  onProgress(materialId: string, ratio: number): void;
  onSaved(materialId: string, material: SavedMaterial): void;
  onStarted(materialId: string): void;
}

interface ActiveUpload {
  controller: AbortController;
  token: symbol;
}

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export const createMaterialUploadManager = (options: MaterialUploadManagerOptions) => {
  const active = new Map<string, ActiveUpload>();
  const pending = new Map<string, MaterialFileSaveInput>();

  const run = async (input: MaterialFileSaveInput) => {
    const user = options.getUser();
    if (!user) {
      options.onFailed(input.id, "error");
      return;
    }
    active.get(input.id)?.controller.abort();
    const controller = new AbortController();
    const token = Symbol(input.id);
    active.set(input.id, { controller, token });
    options.onStarted(input.id);
    try {
      const saved = await options.getRepository().save(input, user, {
        onProgress: ({ ratio }) => {
          if (active.get(input.id)?.token === token) options.onProgress(input.id, ratio);
        },
        signal: controller.signal,
      });
      if (active.get(input.id)?.token !== token) return;
      pending.delete(input.id);
      options.onSaved(input.id, saved);
    } catch (error: unknown) {
      if (active.get(input.id)?.token !== token) return;
      options.onFailed(input.id, isAbortError(error) || controller.signal.aborted ? "cancelled" : "error");
    } finally {
      if (active.get(input.id)?.token === token) active.delete(input.id);
    }
  };

  return {
    cancel: (materialId: string) => active.get(materialId)?.controller.abort(),
    retry: async (materialId: string) => {
      const input = pending.get(materialId);
      if (input) await run(input);
    },
    start: async (input: MaterialFileSaveInput) => {
      pending.set(input.id, input);
      await run(input);
    },
  };
};
