import { describe, expect, it, vi } from "vitest";
import { createObjectUrlRegistry } from "@/features/textbook/objectUrlRegistry";

describe("objectUrlRegistry", () => {
  it("資料IDごとにBlob URLを所有し、置換時に旧URLを一度だけ解放する", () => {
    const createObjectURL = vi.fn().mockReturnValueOnce("blob:material-1").mockReturnValueOnce("blob:material-2");
    const revokeObjectURL = vi.fn();
    const registry = createObjectUrlRegistry({ createObjectURL, revokeObjectURL });

    expect(registry.create("material-1", new Blob(["a"]))).toBe("blob:material-1");
    expect(registry.create("material-1", new Blob(["b"]))).toBe("blob:material-2");
    registry.release("material-1");
    registry.release("material-1");

    expect(revokeObjectURL.mock.calls).toEqual([["blob:material-1"], ["blob:material-2"]]);
  });

  it("セッション終了時に残っているURLをすべて解放する", () => {
    const revokeObjectURL = vi.fn();
    const registry = createObjectUrlRegistry({
      createObjectURL: vi.fn().mockReturnValueOnce("blob:one").mockReturnValueOnce("blob:two"),
      revokeObjectURL,
    });
    registry.create("one", new Blob(["1"]));
    registry.create("two", new Blob(["2"]));

    registry.releaseAll();

    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
