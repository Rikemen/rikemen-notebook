import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import type { MaterialListItem } from "@/features/textbook/materials";
import type { MaterialTocItem } from "@/features/textbook/materialTableOfContents";
import { useTextbookPanelStore } from "@/features/textbook/textbookPanelStore";

const initialMaterials: MaterialListItem[] = [
  {
    id: "material-1",
    pageCount: 6,
    sizeLabel: "1.2 MB",
    title: "解析.pdf",
    uploadedAt: "2026/07/29",
  },
];

describe("textbookPanelStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("ノートごとに資料パネルのモードを保持する", () => {
    const store = useTextbookPanelStore();

    expect(store.stateForNote("note-a", initialMaterials).mode).toBe("materials");
    store.setMode("note-a", "contents", initialMaterials);

    expect(store.stateForNote("note-a", initialMaterials).mode).toBe("contents");
    expect(store.stateForNote("note-b", initialMaterials).mode).toBe("materials");
  });

  it("追加資料を現在のノートだけに保持する", () => {
    const store = useTextbookPanelStore();
    const added: MaterialListItem = {
      id: "material-added",
      pageCount: 6,
      sizeLabel: "2.0 MB",
      title: "極限.pdf",
      uploadedAt: "2026/07/29",
    };

    store.addMaterial("note-a", added, initialMaterials);

    expect(store.stateForNote("note-a", initialMaterials).materials).toContainEqual(added);
    expect(store.stateForNote("note-b", initialMaterials).materials).not.toContainEqual(added);
  });

  it("目次選択で対象資料とページを選びプレビューモードへ移動する", () => {
    const store = useTextbookPanelStore();
    const item: MaterialTocItem = {
      children: [],
      id: "toc-1",
      page: 4,
      title: "関数の極限",
    };

    store.addTocItem("note-a", {
      initialMaterials,
      item,
      materialId: "material-1",
    });
    store.openTocItem("note-a", {
      initialMaterials,
      item,
      materialId: "material-1",
    });

    const state = store.stateForNote("note-a", initialMaterials);
    expect(state.tocByMaterialId["material-1"]).toContainEqual(item);
    expect(state).toMatchObject({
      mode: "preview",
      selectedPage: 4,
      selectedTextbookId: "material-1",
    });
  });
});
