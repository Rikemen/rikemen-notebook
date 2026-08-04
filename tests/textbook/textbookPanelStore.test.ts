import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import type { MaterialTocItem } from "@/features/textbook/materialTableOfContents";
import { useTextbookPanelStore } from "@/features/textbook/textbookPanelStore";

const material = {
  id: "material-1",
  pageCount: 6,
  sizeLabel: "1.2 MB",
  title: "解析.pdf",
  uploadedAt: "2026/07/29",
};

describe("textbookPanelStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("新規ノートは空の資料一覧から始まる", () => {
    const store = useTextbookPanelStore();

    expect(store.stateForNote("note-a")).toMatchObject({
      materials: [],
      mode: "materials",
      selectedPage: 1,
      selectedTextbookId: "",
    });
  });

  it("ノートごとに資料パネルのモードを保持する", () => {
    const store = useTextbookPanelStore();
    store.addMaterial("note-a", material);
    store.setMode("note-a", "contents");

    expect(store.stateForNote("note-a").mode).toBe("contents");
    expect(store.stateForNote("note-b").mode).toBe("materials");
  });

  it("追加資料を現在のノートだけに保持する", () => {
    const store = useTextbookPanelStore();
    const added = {
      id: "material-added",
      pageCount: 6,
      sizeLabel: "2.0 MB",
      title: "極限.pdf",
      uploadedAt: "2026/07/29",
    };

    store.addMaterial("note-a", added);

    expect(store.stateForNote("note-a").materials).toContainEqual(added);
    expect(store.stateForNote("note-b").materials).not.toContainEqual(added);
  });

  it("目次選択で対象資料とページを選びプレビューモードへ移動する", () => {
    const store = useTextbookPanelStore();
    store.addMaterial("note-a", material);
    const item: MaterialTocItem = {
      children: [],
      id: "toc-1",
      page: 4,
      title: "関数の極限",
    };

    store.addTocItem("note-a", {
      item,
      materialId: "material-1",
    });
    store.openTocItem("note-a", {
      item,
      materialId: "material-1",
    });

    const state = store.stateForNote("note-a");
    expect(state.tocByMaterialId["material-1"]).toContainEqual(item);
    expect(state).toMatchObject({
      mode: "preview",
      selectedPage: 4,
      selectedTextbookId: "material-1",
    });
  });

  it("保存済み教材を重複なく復元し状態を更新する", () => {
    const store = useTextbookPanelStore();
    const saved = {
      ...material,
      sourceUrl: "https://storage.example/material-1.pdf",
      status: "saved" as const,
    };

    store.hydrateMaterials("note-a", [saved]);
    store.hydrateMaterials("note-a", [saved]);
    store.updateMaterial("note-a", "material-1", { status: "error" });

    expect(store.stateForNote("note-a").materials).toEqual([{ ...saved, status: "error" }]);
    expect(store.stateForNote("note-b").materials).toEqual([]);
  });
});
